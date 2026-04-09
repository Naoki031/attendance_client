/**
 * Composable for active liveness detection using face-api.js facial landmarks.
 *
 * Supports two usage modes:
 *  - Single random challenge: runChallenge(video) — for check-in liveness proof
 *  - Specific challenge: runChallenge(video, 'smile') — used by KYC sequence
 *
 * Available challenges:
 *  blink        — EAR drops below threshold then recovers
 *  smile        — mouth width exceeds ~92% of inter-ocular distance
 *  turn_left    — nose horizontally closer to right eye (head rotated left)
 *  turn_right   — nose horizontally closer to left eye (head rotated right)
 *  move_closer  — face bounding box > 40% of frame width
 *  move_further — face bounding box < 22% of frame width
 *
 * Landmark indices (68-point model, 0-indexed):
 *   Jaw        : 0–16    Left eye: 36–41   Right eye: 42–47
 *   Nose tip   : 30      Mouth outer left: 48   Mouth outer right: 54
 */

export type LivenessChallenge =
  | 'blink'
  | 'smile'
  | 'turn_left'
  | 'turn_right'
  | 'move_closer'
  | 'move_further'

const RANDOM_CHALLENGES: LivenessChallenge[] = ['smile', 'turn_left', 'turn_right']

const TIMEOUT_MS = 9000
const POLL_INTERVAL_MS = 120

const EAR_BLINK_THRESHOLD = 0.25
const SMILE_RATIO_THRESHOLD = 0.92
const YAW_RATIO_THRESHOLD = 1.55
const MOVE_CLOSER_RATIO = 0.4
const MOVE_FURTHER_RATIO = 0.22

type Point = { x: number; y: number }

const euclideanDistribution = (pointA: Point, pointB: Point): number => {
  const dx = pointA.x - pointB.x
  const dy = pointA.y - pointB.y
  return Math.sqrt(dx * dx + dy * dy)
}

const avgPoint = (points: Point[]): Point => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
})

const avgX = (points: Point[]): number =>
  points.reduce((sum, point) => sum + point.x, 0) / points.length

/**
 * Eye Aspect Ratio — EAR = (dist(p1,p5) + dist(p2,p4)) / (2 * dist(p0,p3))
 * Soukupová & Čech 2016 formula.
 */
const computeEAR = (eyePoints: Point[]): number => {
  const vertical1 = euclideanDistribution(eyePoints[1]!, eyePoints[5]!)

  const vertical2 = euclideanDistribution(eyePoints[2]!, eyePoints[4]!)

  const horizontal = euclideanDistribution(eyePoints[0]!, eyePoints[3]!)
  if (horizontal === 0) return 0

  return (vertical1 + vertical2) / (2 * horizontal)
}

const computeAverageEAR = (positions: Point[]): number => {
  const leftEAR = computeEAR(positions.slice(36, 42))
  const rightEAR = computeEAR(positions.slice(42, 48))

  return (leftEAR + rightEAR) / 2
}

/**
 * Detects a smile by comparing mouth width to inter-ocular distance.
 * Smiling stretches the mouth corners outward, increasing the ratio above ~0.92.
 */
const isSmiling = (positions: Point[]): boolean => {
  const leftEyeCenter = avgPoint(positions.slice(36, 42))
  const rightEyeCenter = avgPoint(positions.slice(42, 48))
  const interocularDistribution = euclideanDistribution(leftEyeCenter, rightEyeCenter)

  const mouthWidth = euclideanDistribution(positions[48]!, positions[54]!)
  if (interocularDistribution === 0) return false

  return mouthWidth / interocularDistribution > SMILE_RATIO_THRESHOLD
}

/**
 * Head turned LEFT — nose tip is significantly closer to the right eye than the left.
 */
const isHeadTurnedLeft = (positions: Point[]): boolean => {
  const noseTipX = positions[30]!.x
  const leftEyeX = avgX(positions.slice(36, 42))
  const rightEyeX = avgX(positions.slice(42, 48))
  const distributionLeft = Math.abs(noseTipX - leftEyeX)
  const distributionRight = Math.abs(noseTipX - rightEyeX)
  if (distributionRight === 0) return false

  return distributionLeft / distributionRight > YAW_RATIO_THRESHOLD
}

/**
 * Head turned RIGHT — nose tip is significantly closer to the left eye than the right.
 */
const isHeadTurnedRight = (positions: Point[]): boolean => {
  const noseTipX = positions[30]!.x
  const leftEyeX = avgX(positions.slice(36, 42))
  const rightEyeX = avgX(positions.slice(42, 48))
  const distributionLeft = Math.abs(noseTipX - leftEyeX)
  const distributionRight = Math.abs(noseTipX - rightEyeX)
  if (distributionLeft === 0) return false

  return distributionRight / distributionLeft > YAW_RATIO_THRESHOLD
}

export const useLiveness = () => {
  /** Currently active challenge type, null when idle */
  const currentChallenge = ref<LivenessChallenge | null>(null)
  /** 0–100: percentage of timeout elapsed (drives the progress bar) */
  const livenessProgress = ref<number>(0)
  /** True once the most recent challenge was successfully passed */
  const isPassed = ref<boolean>(false)

  /**
   * Runs a single liveness challenge.
   *
   * @param video - Live HTMLVideoElement from the webcam
   * @param challenge - Specific challenge to run, or omit for a random one
   * @returns Promise that resolves on pass, rejects with Error('liveness_timeout') on timeout
   */
  const runChallenge = (video: HTMLVideoElement, challenge?: LivenessChallenge): Promise<void> => {
    const randomIndex = Math.floor(Math.random() * RANDOM_CHALLENGES.length)
    const selectedChallenge: LivenessChallenge =
      challenge ?? (RANDOM_CHALLENGES[randomIndex] as LivenessChallenge)

    currentChallenge.value = selectedChallenge
    isPassed.value = false
    livenessProgress.value = 0

    return new Promise((resolve, reject) => {
      let eyeWasClosed = false
      let blinkDone = false
      let settled = false
      const startTime = Date.now()

      const tick = async () => {
        if (settled) return

        const elapsed = Date.now() - startTime
        livenessProgress.value = Math.min((elapsed / TIMEOUT_MS) * 100, 100)

        if (elapsed >= TIMEOUT_MS) {
          settled = true
          currentChallenge.value = null
          reject(new Error('liveness_timeout'))

          return
        }

        try {
          const faceapi = await import('face-api.js')
          const detectionResult = await faceapi
            .detectSingleFace(
              video,
              new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }),
            )
            .withFaceLandmarks()

          if (detectionResult && !settled) {
            const positions = detectionResult.landmarks.positions as Point[]
            const boxWidth = detectionResult.detection.box.width
            const videoWidth = video.videoWidth || video.clientWidth || 640
            const faceRatio = boxWidth / videoWidth

            let actionDetected = false

            if (selectedChallenge === 'blink') {
              const ear = computeAverageEAR(positions)
              if (ear < EAR_BLINK_THRESHOLD) {
                eyeWasClosed = true
              } else if (eyeWasClosed && ear >= EAR_BLINK_THRESHOLD) {
                blinkDone = true
                eyeWasClosed = false
              }
              actionDetected = blinkDone
            } else if (selectedChallenge === 'smile') {
              actionDetected = isSmiling(positions)
            } else if (selectedChallenge === 'turn_left') {
              actionDetected = isHeadTurnedLeft(positions)
            } else if (selectedChallenge === 'turn_right') {
              actionDetected = isHeadTurnedRight(positions)
            } else if (selectedChallenge === 'move_closer') {
              actionDetected = faceRatio > MOVE_CLOSER_RATIO
            } else if (selectedChallenge === 'move_further') {
              actionDetected = faceRatio < MOVE_FURTHER_RATIO
            }

            if (actionDetected) {
              settled = true
              isPassed.value = true
              currentChallenge.value = null
              livenessProgress.value = 100
              resolve()

              return
            }
          }
        } catch {
          // Ignore per-frame errors (model not ready, video paused, etc.)
        }

        if (!settled) setTimeout(tick, POLL_INTERVAL_MS)
      }

      setTimeout(tick, POLL_INTERVAL_MS)
    })
  }

  return { currentChallenge, livenessProgress, isPassed, runChallenge }
}
