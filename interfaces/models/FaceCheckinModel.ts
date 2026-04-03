export interface FaceCheckinModel {
  success: boolean
  type: 'clock_in' | 'clock_out'
  employeeName: string
  employeeCode: string
  confidence: number
  imageUrl: string
  checkedAt: string
}
