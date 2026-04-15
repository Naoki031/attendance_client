<template>
  <div class="meeting-room">
    <v-theme-provider theme="sandstone-dark" style="display: contents">
      <!-- Loading state while fetching meeting data -->
      <div v-if="step === 'loading'" class="meeting-room__loading">
        <template v-if="loadError">
          <v-icon icon="mdi-alert-circle-outline" size="48" color="error" class="mb-3" />
          <p class="text-body-2 text-medium-emphasis">{{ loadError }}</p>
        </template>
        <v-progress-circular v-else indeterminate color="primary" size="48" />
      </div>

      <!-- Password screen (private meeting, non-host) -->
      <div v-else-if="step === 'password'" class="meeting-room__prejoin">
        <div class="prejoin-card">
          <v-icon icon="mdi-lock" size="48" color="warning" class="mb-3"></v-icon>
          <h2 class="text-h6 font-weight-bold mb-1">{{ meetingTitle }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('meetings.passwordRequired') }}</p>

          <v-text-field
            v-model="meetingPassword"
            :label="$t('meetings.enterPassword')"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            autofocus
            @click:append-inner="showPassword = !showPassword"
            @keyup.enter="submitPassword"
          ></v-text-field>

          <v-alert
            v-if="passwordError"
            type="error"
            density="compact"
            class="mb-3"
            style="font-size: 12px"
          >
            {{ passwordError }}
          </v-alert>

          <div class="d-flex gap-3 justify-center mt-2">
            <v-btn variant="text" color="grey" @click="navigateTo('/meetings')">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              :loading="isVerifyingPassword"
              @click="submitPassword"
            >
              {{ $t('common.confirm') }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Pre-join screen -->
      <div v-else-if="step === 'prejoin'" class="meeting-room__prejoin">
        <div class="prejoin-card">
          <h2 class="text-h6 font-weight-bold mb-1">{{ meetingTitle }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('meetings.readyToJoin') }}</p>

          <!-- Camera preview -->
          <div class="prejoin-preview">
            <video
              ref="previewVideoReference"
              autoplay
              muted
              playsinline
              class="prejoin-preview__video"
            ></video>
            <div v-if="!previewCameraOn" class="prejoin-preview__placeholder">
              <v-icon icon="mdi-camera-off" size="48" color="grey"></v-icon>
            </div>
          </div>

          <!-- Mic level indicator -->
          <div class="mic-test mt-3">
            <div class="mic-test__label text-body-2 text-medium-emphasis mb-1">
              <v-icon size="14" class="mr-1">mdi-microphone</v-icon>
              {{ previewMicOn ? $t('meetings.micLevel') : $t('meetings.micOff') }}
            </div>
            <div class="mic-test__bar-bg">
              <div
                class="mic-test__bar"
                :style="{ width: `${micLevel}%` }"
                :class="micLevelClass"
              ></div>
            </div>
          </div>

          <!-- Toggle controls -->
          <div class="d-flex justify-center gap-4 mt-4 mb-4">
            <div class="prejoin-control">
              <v-btn
                :icon="previewMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                :color="previewMicOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="togglePreviewMic"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="previewMicOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'"
              >
                {{ previewMicOn ? $t('meetings.controls.micOn') : $t('meetings.controls.micOff') }}
              </span>
            </div>
            <div class="prejoin-control">
              <v-btn
                :icon="previewCameraOn ? 'mdi-camera' : 'mdi-camera-off'"
                :color="previewCameraOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="togglePreviewCamera"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="
                  previewCameraOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'
                "
              >
                {{
                  previewCameraOn ? $t('meetings.controls.camOn') : $t('meetings.controls.camOff')
                }}
              </span>
            </div>
            <div class="prejoin-control">
              <v-btn
                :icon="previewSpeakerOn ? 'mdi-volume-high' : 'mdi-volume-mute'"
                :color="previewSpeakerOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="previewSpeakerOn = !previewSpeakerOn"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="
                  previewSpeakerOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'
                "
              >
                {{
                  previewSpeakerOn
                    ? $t('meetings.controls.speakerOn')
                    : $t('meetings.controls.speakerOff')
                }}
              </span>
            </div>
          </div>

          <!-- Device selectors -->
          <div class="d-flex flex-column ga-2 mb-4">
            <v-select
              v-if="micDevices.length > 1"
              v-model="selectedMicId"
              :items="micDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectMic')"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-microphone"
              @update:model-value="onMicDeviceChange"
            />
            <v-select
              v-if="speakerDevices.length >= 1"
              v-model="selectedSpeakerId"
              :items="speakerDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectSpeaker')"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-volume-high"
            />
          </div>

          <v-alert
            v-if="previewPermissionError"
            type="warning"
            density="compact"
            class="mb-3"
            style="font-size: 12px"
            closable
            @click:close="previewPermissionError = ''"
          >
            <v-icon class="mr-1">mdi-shield-lock-outline</v-icon>
            {{ previewPermissionError }}
          </v-alert>

          <v-alert
            v-if="joinError"
            type="error"
            density="compact"
            class="mb-3"
            style="font-size: 12px; word-break: break-all"
          >
            {{ joinError }}
          </v-alert>

          <p class="text-caption text-medium-emphasis mb-3">
            <v-icon size="12" class="mr-1">mdi-headphones</v-icon>
            {{ $t('meetings.headphonesHint') }}
          </p>

          <div class="d-flex gap-3 justify-center">
            <v-btn variant="text" color="grey" @click="navigateTo('/meetings')">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              :loading="isJoining"
              @click="confirmJoin"
            >
              {{ $t('meetings.join') }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Joining spinner -->
      <div v-else-if="step === 'joining'" class="meeting-room__loading">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-3">{{ $t('meetings.joining') }}</p>
      </div>

      <!-- In meeting -->
      <template v-else-if="step === 'meeting'">
        <!-- Meeting-ended countdown overlay -->
        <div v-if="endCountdown !== null" class="meeting-end-overlay">
          <p class="meeting-end-overlay__label">{{ $t('meetings.meetingEnding') }}</p>
          <div class="meeting-end-overlay__count">{{ endCountdown }}</div>
        </div>

        <div class="meeting-room__main">
          <div class="meeting-room__video">
            <MeetingVideoGrid
              ref="videoGridReference"
              :local-participant="localParticipant"
              :remote-participants="remoteParticipants"
              :has-remote-screen-share="hasRemoteScreenShare"
              :remote-screen-share-tracks="remoteScreenShareTracks"
              :is-mic-enabled="isMicEnabled"
              :is-camera-enabled="isCameraEnabled"
              :is-screen-sharing="isScreenSharing"
              :is-speaker-enabled="isSpeakerEnabled"
              :active-speaker-identities="activeSpeakerIdentities"
              :speaker-audio-levels="speakerAudioLevels"
              :remote-mic-states="remoteMicStates"
              :remote-screen-audio-states="remoteScreenAudioStates"
              :screen-audio-active="screenAudioActive"
              :remote-speaker-states="remoteSpeakerStates"
              :participant-avatar-map="participantAvatarMap"
              :participant-name-map="participantNameMap"
              :local-avatar="localAvatar"
              :cursors="cursors"
              :markers="markers"
              :participant-color-map="participantColorMap"
              :host-user-id="currentHostId"
              :local-user-id="localUserId"
              :co-host-user-ids="coHostUserIds"
              @cursor-move="sendCursorMove($event.x, $event.y)"
              @cursor-hide="sendCursorHide"
              @marker-place="sendScreenMarker($event.x, $event.y)"
              @markers-clear="clearScreenMarkers"
            />
          </div>
          <!-- <div
            class="meeting-room__subtitles"
            :class="{ 'meeting-room__subtitles--hidden': !showSubtitles }"
          >
            <MeetingSubtitlePanel
              :subtitles="subtitles"
              :user-language="userLanguage"
              :speaking-language="speakingLanguage"
              @update:speaking-language="speakingLanguage = $event"
            />
          </div> -->
          <div class="meeting-room__vote" :class="{ 'meeting-room__vote--hidden': !showVotePanel }">
            <MeetingVotePanel
              :votes="votes"
              :local-user-id="localUserId"
              :meeting-participant-count="socketParticipants.length"
              @create-vote="voteDialog = true"
              @cast-vote="castVote"
              @close-vote="closeVote"
            />
          </div>

          <div class="meeting-room__chat" :class="{ 'meeting-room__chat--hidden': !showChatPanel }">
            <MeetingChatPanel
              v-show="showChatPanel"
              :meeting-uuid="meetingUuid"
              :user-id="localUserId"
              :username="localUsername"
              :avatar="localAvatar"
              :language="_userLanguage"
              @close="showChatPanel = false"
              @new-message="onNewChatMessage"
            />
          </div>
        </div>

        <MeetingControlBar
          :is-mic-enabled="isMicEnabled"
          :is-camera-enabled="isCameraEnabled"
          :is-screen-sharing="isScreenSharing"
          :is-speaker-enabled="isSpeakerEnabled"
          :show-vote-panel="showVotePanel"
          :show-chat-panel="showChatPanel"
          :chat-unread-count="chatUnreadCount"
          :tts-enabled="ttsEnabled"
          :has-any-screen-share="isScreenSharing || hasRemoteScreenShare"
          :is-fullscreen="isFullscreen"
          :is-host="isHost"
          :is-host-or-co-host="isHostOrCoHost"
          @toggle-mic="toggleMic"
          @toggle-camera="toggleCamera"
          @toggle-speaker="toggleSpeaker"
          @start-screen-share="startScreenShare"
          @stop-screen-share="stopScreenShare"
          @toggle-vote-panel="showVotePanel = !showVotePanel"
          @toggle-chat-panel="handleToggleChatPanel"
          @toggle-tts="ttsEnabled = !ttsEnabled"
          @toggle-fullscreen="handleToggleFullscreen"
          @open-settings="settingsDialog = true"
          @open-invite="inviteDialog = true"
          @transfer-host="transferHostDialog = true"
          @manage-co-host="coHostDialog = true"
          @end-meeting="handleEndMeeting"
          @leave="leaveMeeting"
        />
      </template>

      <!-- End Meeting confirm dialog (host only) -->
      <v-dialog v-model="endMeetingDialog" max-width="360" persistent>
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
            <v-icon color="error">mdi-phone-remove</v-icon>
            {{ $t('meetings.controls.endMeeting') }}
          </v-card-title>
          <v-card-text class="pt-0 text-body-2 text-medium-emphasis">
            {{ $t('meetings.controls.endMeetingConfirm') }}
          </v-card-text>
          <v-card-actions class="pa-4 pt-0 ga-2 justify-end">
            <v-btn variant="text" @click="endMeetingDialog = false">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn color="error" variant="flat" @click="confirmEndMeeting">
              {{ $t('meetings.controls.endMeeting') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Invite dialog -->
      <MeetingDialogInvite
        ref="inviteDialogReference"
        :dialog="inviteDialog"
        :meeting-uuid="meetingUuid"
        @close-modal="inviteDialog = false"
      />

      <!-- Transfer Host / Manage Co-Host dialog -->
      <v-dialog v-model="transferHostDialog" max-width="400" persistent>
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
            <v-icon color="amber">mdi-crown-outline</v-icon>
            {{ $t('meetings.hostSchedule.transferHost') }}
          </v-card-title>
          <v-card-text class="pt-0 text-body-2 text-medium-emphasis">
            {{ $t('meetings.hostSchedule.transferHostTitle') }}
          </v-card-text>
          <v-card-text class="pt-0">
            <v-list density="compact" rounded="lg">
              <v-list-item
                v-for="participant in transferableParticipants"
                :key="participant.userId"
                :title="participant.username"
                rounded="lg"
                @click="confirmTransferHost(participant.userId)"
              >
                <template #prepend>
                  <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                    <span class="text-caption font-weight-bold">
                      {{ participant.username.charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="transferHostDialog = false">{{
              $t('common.cancel')
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Manage Co-Host dialog (host only) -->
      <v-dialog v-model="coHostDialog" max-width="400" persistent>
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
            <v-icon color="teal">mdi-account-star-outline</v-icon>
            {{ $t('meetings.coHost.manageTitle') }}
          </v-card-title>
          <v-card-text class="pt-0 text-body-2 text-medium-emphasis">
            {{ $t('meetings.coHost.manageDescription') }}
          </v-card-text>
          <v-card-text class="pt-0">
            <v-list density="compact" rounded="lg">
              <v-list-item
                v-for="participant in coHostManageableParticipants"
                :key="participant.userId"
                rounded="lg"
              >
                <template #prepend>
                  <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                    <span class="text-caption font-weight-bold">
                      {{ participant.username.charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                </template>
                <v-list-item-title>
                  {{ participant.username }}
                </v-list-item-title>
                <template #append>
                  <v-btn
                    v-if="coHostUserIds.has(participant.userId)"
                    size="x-small"
                    variant="tonal"
                    color="error"
                    @click="handleDemoteCoHost(participant.userId)"
                  >
                    {{ $t('meetings.coHost.demote') }}
                  </v-btn>
                  <v-btn
                    v-else
                    size="x-small"
                    variant="tonal"
                    color="teal"
                    @click="handlePromoteCoHost(participant.userId)"
                  >
                    {{ $t('meetings.coHost.promote') }}
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="coHostDialog = false">{{ $t('common.close') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Host changed snackbar -->
      <v-snackbar
        v-model="hostChangedSnackbar"
        location="top"
        color="amber-darken-3"
        :timeout="3000"
        rounded="lg"
      >
        <v-icon class="mr-2">mdi-crown</v-icon>
        {{ hostChangedMessage }}
      </v-snackbar>

      <!-- Device settings dialog -->
      <v-dialog v-model="settingsDialog" max-width="400">
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
            <v-icon color="primary">mdi-cog-outline</v-icon>
            {{ $t('meetings.controls.settings') }}
          </v-card-title>
          <v-card-text class="pt-0 d-flex flex-column ga-4">
            <v-select
              v-model="selectedMicId"
              :items="micDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectMic')"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-microphone"
              @update:model-value="onMicDeviceChange"
            />
            <v-select
              v-model="selectedSpeakerId"
              :items="speakerDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectSpeaker')"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-volume-high"
            />
            <v-switch
              :model-value="isNoiseSuppressed"
              :label="$t('meetings.noiseSuppression')"
              color="success"
              density="comfortable"
              hide-details
              inset
              @update:model-value="toggleNoiseSuppression"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn color="primary" variant="elevated" rounded="lg" @click="settingsDialog = false">
              {{ $t('common.done') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Vote creation dialog -->
      <MeetingVoteCreateDialog
        v-model="voteDialog"
        :participants="socketParticipants"
        @create="handleCreateVote"
      />

      <!-- Invite activity toast (calling / joined / declined / missed) -->
      <v-snackbar
        v-model="roomToastVisible"
        location="top"
        :color="roomToastColor"
        :timeout="4000"
        rounded="lg"
        min-width="240"
      >
        {{ roomToastMessage }}
      </v-snackbar>

      <!-- macOS Screen Recording permission warning -->
      <v-snackbar
        :model-value="!!screenShareWarning"
        color="warning"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-shield-lock-outline</v-icon>
          <span>{{ screenShareWarning }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="screenShareWarning = ''">{{ $t('common.close') }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Screen share start failure (non-cancellation errors) -->
      <v-snackbar
        :model-value="!!screenShareErrorMessage"
        color="error"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-monitor-off</v-icon>
          <span>{{ screenShareErrorMessage }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="screenShareErrorMessage = ''">{{
            $t('common.close')
          }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Mic / camera permission denied during the meeting -->
      <v-snackbar
        :model-value="!!devicePermissionMessage"
        color="warning"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-shield-lock-outline</v-icon>
          <span>{{ devicePermissionMessage }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="devicePermissionMessage = ''">{{
            $t('common.close')
          }}</v-btn>
        </template>
      </v-snackbar>

      <!-- LiveKit reconnecting banner (persistent until resolved) -->
      <v-snackbar
        :model-value="isReconnecting"
        color="warning"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-progress-circular indeterminate size="16" width="2" color="white" />
          <span>{{ $t('meetings.reconnecting') }}</span>
        </div>
      </v-snackbar>

      <!-- LiveKit unexpected disconnect -->
      <v-snackbar
        :model-value="!!roomDisconnectedMessage"
        color="error"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-wifi-off</v-icon>
          <span>{{ roomDisconnectedMessage }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="roomDisconnectedMessage = ''">{{
            $t('common.close')
          }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Socket.IO connection failure -->
      <v-snackbar
        :model-value="!!socketErrorMessage"
        color="error"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-connection</v-icon>
          <span>{{ socketErrorMessage }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="socketErrorMessage = ''">{{ $t('common.close') }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Screen audio echo risk warning -->
      <v-snackbar
        :model-value="!!screenAudioEchoWarning"
        color="warning"
        location="top"
        :timeout="12000"
        min-width="320"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-volume-alert</v-icon>
          <span>{{ screenAudioEchoWarning }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="screenAudioEchoWarning = ''">{{
            $t('common.close')
          }}</v-btn>
        </template>
      </v-snackbar>

      <!-- Mic device switch failure -->
      <v-snackbar
        :model-value="!!switchDeviceErrorMessage"
        color="warning"
        location="top"
        :timeout="6000"
        min-width="280"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-microphone-off</v-icon>
          <span>{{ switchDeviceErrorMessage }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="switchDeviceErrorMessage = ''">{{
            $t('common.close')
          }}</v-btn>
        </template>
      </v-snackbar>
    </v-theme-provider>
  </div>
</template>

<script lang="ts" setup>
// START IMPORT
import { useRoute } from '#app'
import { useMeeting } from '@/composables/useMeeting'
import type MeetingVideoGrid from '@/components/meeting/VideoGrid.vue'
import type { MediaDeviceItem } from '@/types/meeting/MediaDeviceItem'
import { apiClient } from '@/utils/apiClient'
import MeetingService from '@/services/MeetingService'
// END IMPORT

definePageMeta({ layout: false })

// START DEFINE STATE
const route = useRoute()
const { t } = useI18n()
const meetingUuid = ref(route.params.uuid as string)

const step = ref<'loading' | 'password' | 'prejoin' | 'joining' | 'meeting'>('loading')
const loadError = ref('')
const isJoining = ref(false)
const joinError = ref('')
const meetingTitle = ref('')
const meetingId = ref(0)
const meetingIsPrivate = ref(false)
const meetingHostId = ref(0)
const localUserId = ref(0)
const localUsername = ref('')
const showChatPanel = ref(false)
const chatUnreadCount = ref(0)

// Password step state
const meetingPassword = ref('')
const showPassword = ref(false)
const passwordError = ref('')
const isVerifyingPassword = ref(false)

const _userLanguage = computed(() => useCookie('language').value ?? 'en')
const _showSubtitles = ref(true)
const videoGridReference = ref<InstanceType<typeof MeetingVideoGrid> | null>(null)
const isFullscreen = ref(false)

// Map of String(userId) → avatar URL for all participants (used by VideoGrid placeholder)
const participantAvatarMap = ref<Record<string, string>>({})
// Map of String(userId) → full name — used as reliable fallback when LiveKit participant.name is empty
const participantNameMap = ref<Record<string, string>>({})
// Avatar URL for the local user
const localAvatar = ref('')

// Pre-join preview
const previewVideoReference = ref<HTMLVideoElement | null>(null)
const previewMicOn = ref(false)
const previewCameraOn = ref(false)
const previewPermissionError = ref('')
const previewSpeakerOn = ref(true)
let previewStream: MediaStream | null = null

// Device selection
const micDevices = ref<MediaDeviceItem[]>([])
const speakerDevices = ref<MediaDeviceItem[]>([])
const selectedMicId = ref<string>('')
const selectedSpeakerId = ref<string>('')
const settingsDialog = ref(false)
const inviteDialog = ref(false)
const inviteDialogReference = ref<{ refresh: () => void } | null>(null)
const endMeetingDialog = ref(false)
const transferHostDialog = ref(false)
const coHostDialog = ref(false)
const hostChangedSnackbar = ref(false)
const hostChangedMessage = ref('')
const voteDialog = ref(false)

// Mic level detector
const micLevel = ref(0)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let micLevelAnimFrame: number | null = null

const micLevelClass = computed(() => {
  if (micLevel.value < 20) return 'mic-test__bar--low'
  if (micLevel.value < 60) return 'mic-test__bar--mid'
  return 'mic-test__bar--high'
})

const {
  socketParticipants,
  localParticipant,
  remoteParticipants,
  hasRemoteScreenShare,
  remoteScreenShareTracks,
  speakingLanguage: _speakingLanguage,
  ttsEnabled,
  activeSpeakerIdentities,
  speakerAudioLevels,
  remoteMicStates,
  remoteScreenAudioStates,
  remoteSpeakerStates,
  isNoiseSuppressed,
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing,
  screenAudioActive,
  isSpeakerEnabled,
  subtitles: _subtitles,
  connect,
  joinLiveKit,
  toggleMic,
  toggleNoiseSuppression,
  toggleCamera,
  toggleSpeaker,
  startScreenShare,
  stopScreenShare,
  switchMicDevice,
  setRemoteSpeakerDevice,
  onBlackScreenDetected,
  onScreenShareFailed,
  onScreenAudioEchoRisk,
  onMediaDeviceError,
  onRoomDisconnected,
  onRoomReconnecting,
  onRoomReconnected,
  onSocketError,
  onSwitchDeviceError,
  disconnect,
  cursors,
  markers,
  sendCursorMove,
  sendCursorHide,
  sendScreenMarker,
  clearScreenMarkers,
  getParticipantColor,
  endMeeting,
  currentHostId,
  coHostUserIds,
  isCoHost: _isCoHost,
  isHost: isComposableHost,
  isHostOrCoHost,
  transferHost,
  promoteCoHost,
  demoteCoHost,
  votes,
  showVotePanel,
  createVote,
  castVote,
  closeVote,
  lastInviteEvent,
} = useMeeting(meetingId, meetingUuid, () => {
  // Host ended the meeting — show countdown then disconnect and navigate away
  startEndCountdown()
})

// isHost: true when local user is the current runtime host (resolved from schedule or transfer).
// Falls back to permanent owner (meetingHostId) before the first session starts (currentHostId null).
// Also uses the composable's socket-based isHost check.
const isHost = computed(() => {
  if (localUserId.value === 0) return false
  if (currentHostId.value !== null) return isComposableHost.value
  return localUserId.value === meetingHostId.value
})

// Participants available to receive host (everyone except the current host and co-hosts)
const transferableParticipants = computed(() =>
  socketParticipants.value.filter(
    (participant) =>
      participant.userId !== localUserId.value && !coHostUserIds.value.has(participant.userId),
  ),
)

// Participants visible in the co-host management dialog (everyone except the host)
const coHostManageableParticipants = computed(() =>
  socketParticipants.value.filter((participant) => participant.userId !== localUserId.value),
)

// Build participantColorMap — assigns each participant a distinct color
const participantColorMap = computed(() => {
  const map: Record<string, string> = {}
  for (const participant of socketParticipants.value) {
    map[String(participant.userId)] = getParticipantColor(participant.userId)
  }
  return map
})

// Countdown shown to all participants when the host ends the meeting (3 → 2 → 1 → leave)
const endCountdown = ref<number | null>(null)

// In-room activity toast (invite sent / result received)
const roomToastVisible = ref(false)
const roomToastMessage = ref('')
const roomToastColor = ref('primary')
// END DEFINE STATE

// Apply speaker device change to all active remote audio elements
watch(selectedSpeakerId, (deviceId) => {
  if (deviceId) setRemoteSpeakerDevice(deviceId)
})

// Show a snackbar notification whenever the runtime host changes mid-session
watch(currentHostId, (newHostId, previousHostId) => {
  if (newHostId === null || previousHostId === null) return

  const hostParticipant = socketParticipants.value.find(
    (participant) => participant.userId === newHostId,
  )
  const name = hostParticipant?.username ?? `#${newHostId}`

  if (newHostId === localUserId.value) {
    hostChangedMessage.value = t('meetings.hostSchedule.youAreHost')
  } else {
    hostChangedMessage.value = t('meetings.hostSchedule.hostChanged', { name })
  }
  hostChangedSnackbar.value = true
})

// Re-enumerate devices when settings dialog opens so newly connected USB/Type-C
// peripherals appear immediately without requiring a page reload
watch(settingsDialog, (open) => {
  if (open) enumerateDevices()
})

// When a new participant joins who wasn't in the initial meeting data,
// add their name from the LiveKit token so the VideoGrid placeholder shows correctly.
watch(remoteParticipants, (participants) => {
  const updates: Record<string, string> = {}

  for (const participant of participants) {
    if (!participantNameMap.value[participant.identity] && participant.name) {
      updates[participant.identity] = participant.name
    }
  }

  if (Object.keys(updates).length > 0) {
    participantNameMap.value = { ...participantNameMap.value, ...updates }
  }
})

// Socket participant list is the authoritative name source — the socket gateway always
// fetches full_name from DB. Use it to fill in names that the LiveKit token may have
// missed (e.g. participants whose JWT predates the full_name payload field).
watch(
  socketParticipants,
  (participants) => {
    const updates: Record<string, string> = {}
    for (const participant of participants) {
      const key = String(participant.userId)
      if (!participantNameMap.value[key] && participant.username) {
        updates[key] = participant.username
      }
    }
    if (Object.keys(updates).length > 0) {
      participantNameMap.value = { ...participantNameMap.value, ...updates }
    }
  },
  { deep: true },
)

// Show a brief toast whenever an invite is sent or responded to in this meeting room
// Also refresh the invite dialog so the host sees updated RSVP status immediately
watch(lastInviteEvent, (event) => {
  if (!event) return
  if (event.type === 'sent') {
    roomToastMessage.value = t('meetings.invite.calling', { name: event.userName })
    roomToastColor.value = 'primary'
  } else if (event.type === 'result') {
    if (event.result === 'accepted') {
      roomToastMessage.value = t('meetings.invite.resultJoined', { name: event.userName })
      roomToastColor.value = 'success'
    } else if (event.result === 'declined') {
      roomToastMessage.value = t('meetings.invite.resultDeclined', { name: event.userName })
      roomToastColor.value = 'error'
    } else if (event.result === 'missed') {
      roomToastMessage.value = t('meetings.invite.resultMissed', { name: event.userName })
      roomToastColor.value = 'warning'
    }
    // Refresh the invite list so status columns update in real time
    inviteDialogReference.value?.refresh()
  }
  roomToastVisible.value = true
})

// Show a warning snackbar when black frames are detected (macOS Screen Recording permission blocked)
const screenShareWarning = ref('')
onBlackScreenDetected(() => {
  screenShareWarning.value = t('meetings.screenRecordingPermission')
  setTimeout(() => {
    screenShareWarning.value = ''
  }, 12000)
})

// Show an error snackbar when screen share fails for a non-cancellation reason
// (e.g. OverconstrainedError still fired, H264 negotiation failure, unexpected LiveKit error)
const screenShareErrorMessage = ref('')
onScreenShareFailed(() => {
  screenShareErrorMessage.value = t('meetings.screenShareFailed')
  setTimeout(() => {
    screenShareErrorMessage.value = ''
  }, 10000)
})

// Show a permission guidance snackbar when the OS/browser blocks mic or camera access
// during the meeting (e.g. user revokes permission in System Preferences mid-meeting)
const devicePermissionMessage = ref('')
onMediaDeviceError((kind) => {
  if (kind === 'audioinput') {
    devicePermissionMessage.value = t('meetings.permissionDenied.mic')
  } else if (kind === 'videoinput') {
    devicePermissionMessage.value = t('meetings.permissionDenied.camera')
  } else {
    devicePermissionMessage.value = t('meetings.permissionDenied.device')
  }
  setTimeout(() => {
    devicePermissionMessage.value = ''
  }, 12000)
})

// Show a persistent banner when LiveKit is reconnecting after signal loss
const isReconnecting = ref(false)
onRoomReconnecting(() => {
  isReconnecting.value = true
})
onRoomReconnected(() => {
  isReconnecting.value = false
})

// Show a snackbar when LiveKit disconnects unexpectedly (not triggered by leaveMeeting)
const roomDisconnectedMessage = ref('')
onRoomDisconnected(() => {
  if (step.value === 'meeting') {
    roomDisconnectedMessage.value = t('meetings.connectionLost')
  }
})

// Show a snackbar when Socket.IO fails to connect
const socketErrorMessage = ref('')
onSocketError(() => {
  socketErrorMessage.value = t('meetings.socketConnectionFailed')
  setTimeout(() => {
    socketErrorMessage.value = ''
  }, 10000)
})

// Warn user when they start sharing screen audio: meeting audio playing through speakers
// gets captured by the screen audio track and sent back to participants as echo.
const screenAudioEchoWarning = ref('')
onScreenAudioEchoRisk(() => {
  screenAudioEchoWarning.value = t('meetings.screenAudioEchoWarning')
  setTimeout(() => {
    screenAudioEchoWarning.value = ''
  }, 12000)
})

// Show a snackbar when switching mic device fails
const switchDeviceErrorMessage = ref('')
onSwitchDeviceError(() => {
  switchDeviceErrorMessage.value = t('meetings.switchDeviceFailed')
  setTimeout(() => {
    switchDeviceErrorMessage.value = ''
  }, 6000)
})

// START DEFINE METHOD
function startMicLevelDetection(stream: MediaStream) {
  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  function tick() {
    analyser!.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    micLevel.value = Math.min(100, Math.round((average / 128) * 100))
    micLevelAnimFrame = requestAnimationFrame(tick)
  }

  tick()
}

function stopMicLevelDetection() {
  if (micLevelAnimFrame !== null) {
    cancelAnimationFrame(micLevelAnimFrame)
    micLevelAnimFrame = null
  }
  audioContext?.close()
  audioContext = null
  analyser = null
  micLevel.value = 0
}

async function enumerateDevices() {
  try {
    // Must request permission first so labels are populated (not empty strings).
    // Skip when already in meeting — mic permission is already granted and opening a
    // second getUserMedia stream on the same device would conflict with the active track.
    if (step.value !== 'meeting') {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    const devices = await navigator.mediaDevices.enumerateDevices()
    micDevices.value = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${t('meetings.microphone')} ${index + 1}`,
      }))
    speakerDevices.value = devices
      .filter((device) => device.kind === 'audiooutput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${t('meetings.speaker')} ${index + 1}`,
      }))
    if (!selectedMicId.value && micDevices.value.length > 0) {
      selectedMicId.value = micDevices.value[0]?.deviceId ?? ''
    }
    if (!selectedSpeakerId.value && speakerDevices.value.length > 0) {
      selectedSpeakerId.value = speakerDevices.value[0]?.deviceId ?? ''
    }
  } catch {
    // Permission denied — device list stays empty, dropdowns hidden
  }
}

async function startPreviewMic(deviceId?: string) {
  previewStream?.getAudioTracks().forEach((track) => track.stop())
  stopMicLevelDetection()
  try {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    }
    const micStream = await navigator.mediaDevices.getUserMedia(constraints)
    if (!previewStream) previewStream = new MediaStream()
    micStream.getAudioTracks().forEach((track) => previewStream!.addTrack(track))
    startMicLevelDetection(micStream)
    previewMicOn.value = true
    previewPermissionError.value = ''
  } catch (error) {
    previewMicOn.value = false
    if (error instanceof Error && error.name === 'NotAllowedError') {
      previewPermissionError.value = t('meetings.permissionDenied.mic')
    }
  }
}

async function togglePreviewMic() {
  if (previewMicOn.value) {
    previewStream?.getAudioTracks().forEach((track) => track.stop())
    stopMicLevelDetection()
    previewMicOn.value = false
  } else {
    await startPreviewMic(selectedMicId.value || undefined)
  }
}

async function onMicDeviceChange(deviceId: string) {
  if (step.value === 'meeting') {
    await switchMicDevice(deviceId)
  } else if (previewMicOn.value) {
    await startPreviewMic(deviceId)
  }
}

async function togglePreviewCamera() {
  if (previewCameraOn.value) {
    previewStream?.getVideoTracks().forEach((track) => track.stop())
    if (previewVideoReference.value) previewVideoReference.value.srcObject = null
    previewCameraOn.value = false
  } else {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (!previewStream) previewStream = new MediaStream()
      camStream.getVideoTracks().forEach((track) => previewStream!.addTrack(track))
      if (previewVideoReference.value) previewVideoReference.value.srcObject = previewStream
      previewCameraOn.value = true
      previewPermissionError.value = ''
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        previewPermissionError.value = t('meetings.permissionDenied.camera')
      }
    }
  }
}

function stopPreviewStream() {
  stopMicLevelDetection()
  previewStream?.getTracks().forEach((track) => track.stop())
  previewStream = null
}

const MEETING_PASSWORDS_KEY = 'meeting_passwords'

function savePassword(uuid: string, password: string) {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  stored[uuid] = password
  localStorage.setItem(MEETING_PASSWORDS_KEY, JSON.stringify(stored))
}

function loadSavedPassword(uuid: string): string | null {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  return stored[uuid] ?? null
}

function clearSavedPassword(uuid: string) {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  const next = Object.fromEntries(Object.entries(stored).filter(([key]) => key !== uuid))
  localStorage.setItem(MEETING_PASSWORDS_KEY, JSON.stringify(next))
}

async function submitPassword() {
  if (!meetingPassword.value.trim()) return

  isVerifyingPassword.value = true
  passwordError.value = ''

  try {
    // Attempt to get a token with the entered password — if wrong, API returns 403
    await MeetingService.getToken(meetingUuid.value, meetingPassword.value)
    // Password valid — save for future visits and proceed to prejoin
    savePassword(meetingUuid.value, meetingPassword.value)
    step.value = 'prejoin'
  } catch {
    passwordError.value = t('meetings.wrongPassword')
  } finally {
    isVerifyingPassword.value = false
  }
}

async function confirmJoin() {
  isJoining.value = true
  joinError.value = ''
  step.value = 'joining'
  stopPreviewStream()

  try {
    const user = await apiClient.get<{ id: number; full_name: string }>('/auth/user')

    await connect(user.id, user.full_name)

    const { token } = await MeetingService.getToken(
      meetingUuid.value,
      meetingPassword.value || undefined,
    )

    await joinLiveKit(token, selectedMicId.value || undefined)

    if (previewMicOn.value) await toggleMic()
    if (previewCameraOn.value) await toggleCamera()
    if (!previewSpeakerOn.value) toggleSpeaker()

    step.value = 'meeting'
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      // Browser blocked mic/camera during join — show guidance instead of raw error
      joinError.value = t('meetings.permissionDenied.joinBlocked')
    } else {
      joinError.value = error instanceof Error ? error.message : String(error)
    }
    step.value = 'prejoin'
    isJoining.value = false
  }
}

async function leaveMeeting() {
  disconnect()
  navigateTo('/meetings')
}

function startEndCountdown() {
  endCountdown.value = 3
  const timer = setInterval(() => {
    if (endCountdown.value === null) {
      clearInterval(timer)
      return
    }
    endCountdown.value -= 1
    if (endCountdown.value <= 0) {
      clearInterval(timer)
      disconnect()
      navigateTo('/meetings')
    }
  }, 1000)
}

function handleEndMeeting() {
  endMeetingDialog.value = true
}

function confirmEndMeeting() {
  endMeetingDialog.value = false
  endMeeting()
}

function confirmTransferHost(toUserId: number) {
  transferHostDialog.value = false
  transferHost(toUserId)
}

function handlePromoteCoHost(targetUserId: number) {
  promoteCoHost(targetUserId)
}

function handleDemoteCoHost(targetUserId: number) {
  demoteCoHost(targetUserId)
}

function handleToggleFullscreen() {
  videoGridReference.value?.toggleFullscreen()
  // isFullscreen is kept in sync via document.fullscreenchange listener
}

function handleToggleChatPanel() {
  showChatPanel.value = !showChatPanel.value

  // Clear unread badge when opening the panel
  if (showChatPanel.value) {
    chatUnreadCount.value = 0
  }
}

function onNewChatMessage() {
  // Only increment badge when the chat panel is hidden — if it's open, user already sees the message
  if (!showChatPanel.value) {
    chatUnreadCount.value++
  }
}

function handleCreateVote(payload: {
  question: string
  options: string[]
  type: 'single' | 'multiple' | 'story_point'
  participantIds: number[]
}) {
  createVote(payload.question, payload.options, payload.type, payload.participantIds)
}
// END DEFINE METHOD

// START LIFECYCLE
onMounted(async () => {
  // Sync isFullscreen when user exits via Escape (browser fires fullscreenchange globally)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  try {
    const meeting = await MeetingService.getOne(meetingUuid.value)
    meetingTitle.value = meeting.title
    meetingId.value = meeting.id
    meetingIsPrivate.value = meeting.is_private
    meetingHostId.value = meeting.host_id

    // Build avatar + name maps: String(userId) → value
    const avatarMap: Record<string, string> = {}
    const nameMap: Record<string, string> = {}
    for (const participant of meeting.participants ?? []) {
      const key = String(participant.user_id)
      if (participant.user?.avatar) avatarMap[key] = participant.user.avatar
      if (participant.user?.full_name) nameMap[key] = participant.user.full_name
    }
    participantAvatarMap.value = avatarMap
    participantNameMap.value = nameMap

    // Fetch local user avatar
    const authUser = await apiClient.get<{ id: number; full_name: string; avatar?: string | null }>(
      '/auth/user',
    )
    localAvatar.value = authUser.avatar ?? ''
    localUserId.value = authUser.id
    localUsername.value = authUser.full_name

    // Show password screen for non-host joining a private room; otherwise go to prejoin
    if (meeting.is_private && authUser.id !== meeting.host_id) {
      // Try saved password first — skip password screen if still valid
      const savedPassword = loadSavedPassword(meetingUuid.value)
      if (savedPassword) {
        try {
          await MeetingService.getToken(meetingUuid.value, savedPassword)
          meetingPassword.value = savedPassword
          step.value = 'prejoin'
          enumerateDevices()
        } catch {
          // Saved password is no longer valid (host regenerated) — clear it and ask again
          clearSavedPassword(meetingUuid.value)
          step.value = 'password'
        }
      } else {
        step.value = 'password'
      }
    } else {
      step.value = 'prejoin'
      enumerateDevices()
    }
  } catch (error) {
    // Show the error message on the loading screen briefly before redirecting
    loadError.value =
      error instanceof Error && error.message ? error.message : t('meetings.loadFailed')
    setTimeout(() => navigateTo('/meetings'), 3000)
  }
})

// Refresh device list whenever a USB/Type-C peripheral is plugged or unplugged
if (import.meta.client) {
  navigator.mediaDevices.addEventListener('devicechange', enumerateDevices)
}

onUnmounted(() => {
  stopPreviewStream()
  disconnect()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (import.meta.client) {
    navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices)
  }
})

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
// END LIFECYCLE
</script>

<style scoped>
.meeting-room {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #111;
  overflow: hidden;
}

.meeting-room__prejoin {
  flex: 1;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 16px;
}

.prejoin-card {
  background: #1e1e1e;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  /* Always dark background — force white text regardless of app theme */
  color: rgba(255, 255, 255, 0.87);
}

.prejoin-card .text-medium-emphasis {
  color: rgba(255, 255, 255, 0.6);
}

.prejoin-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
}

.prejoin-preview__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.prejoin-preview__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-test {
  text-align: left;
}

.mic-test__label {
  display: flex;
  align-items: center;
}

.mic-test__bar-bg {
  height: 6px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mic-test__bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.08s ease-out;
}

.mic-test__bar--low {
  background: rgb(var(--v-theme-success));
}
.mic-test__bar--mid {
  background: rgb(var(--v-theme-warning));
}
.mic-test__bar--high {
  background: rgb(var(--v-theme-error));
}

.meeting-room__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.meeting-room__main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.meeting-room__video {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.meeting-room__subtitles {
  flex: 0 0 clamp(240px, 25%, 320px);
  overflow: hidden;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  transition: flex-basis 0.2s ease;
}

.meeting-room__subtitles--hidden {
  flex: 0 0 0 !important;
  border: none;
}

.meeting-room__vote {
  flex: 0 0 clamp(260px, 25%, 340px);
  overflow: hidden;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  transition: flex-basis 0.2s ease;
}

.meeting-room__vote--hidden {
  flex: 0 0 0 !important;
  border: none;
}

.meeting-room__chat {
  flex: 0 0 clamp(280px, 25%, 360px);
  overflow: hidden;
  transition: flex-basis 0.2s ease;
}

.meeting-room__chat--hidden {
  flex: 0 0 0 !important;
}

.prejoin-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.prejoin-control__label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
  user-select: none;
}

.prejoin-control__label--on {
  color: rgb(var(--v-theme-success));
}

.prejoin-control__label--off {
  color: rgb(var(--v-theme-error));
}

/* ── Meeting-ended countdown overlay ── */
.meeting-end-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  pointer-events: none;
}

.meeting-end-overlay__label {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.02em;
}

.meeting-end-overlay__count {
  font-size: 96px;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  animation: countdown-pulse 1s ease-in-out infinite;
}

@keyframes countdown-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.85;
  }
}

/* ── Mobile portrait ── */
@media (max-width: 640px) {
  .prejoin-card {
    padding: 20px;
  }

  .meeting-room__main {
    flex-direction: column;
  }

  .meeting-room__subtitles {
    flex: 0 0 clamp(100px, 20vh, 140px);
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .meeting-room__subtitles--hidden {
    flex: 0 0 0 !important;
    border: none;
  }

  .meeting-room__vote {
    flex: 0 0 clamp(100px, 20vh, 140px);
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .meeting-room__vote--hidden {
    flex: 0 0 0 !important;
    border: none;
  }
}
</style>
