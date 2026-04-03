import { apiClient } from '@/utils/apiClient'
import type { FaceCheckinModel } from '@/interfaces/models/FaceCheckinModel'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class FaceAttendanceService {
  /**
   * Registers a face descriptor and avatar image for an employee.
   * Sends multipart/form-data with the image file and descriptor JSON.
   */
  public static async registerFace(
    userId: number,
    descriptor: Float32Array,
    imageBlob: Blob,
  ): Promise<UserModel> {
    const formData = new FormData()
    formData.append('image', imageBlob, 'avatar.jpg')
    formData.append('descriptor', JSON.stringify(Array.from(descriptor)))

    return await apiClient.postForm<UserModel>(`users/${userId}/face`, formData)
  }

  /**
   * Performs a face-based check-in or check-out.
   * Sends multipart/form-data with the captured frame, descriptor, and timestamp.
   */
  public static async faceCheckin(
    descriptor: Float32Array,
    imageBlob: Blob,
    location?: string,
  ): Promise<FaceCheckinModel> {
    const formData = new FormData()
    formData.append('image', imageBlob, 'checkin.jpg')
    formData.append('descriptor', JSON.stringify(Array.from(descriptor)))
    if (location) formData.append('location', location)

    return await apiClient.postForm<FaceCheckinModel>('attendance-logs/face/checkin', formData)
  }

  /**
   * Admin approves or rejects a pending KYC submission.
   */
  public static async reviewKyc(
    userId: number,
    status: 'approved' | 'rejected',
    rejectionReason?: string,
  ): Promise<UserModel> {
    return await apiClient.patch<UserModel>(`users/${userId}/kyc`, {
      status,
      rejection_reason: rejectionReason,
    })
  }

  /**
   * Cancels a user's pending or rejected KYC submission, allowing them to re-submit.
   */
  public static async cancelKyc(userId: number): Promise<void> {
    await apiClient.delete(`users/${userId}/kyc`)
  }
}
