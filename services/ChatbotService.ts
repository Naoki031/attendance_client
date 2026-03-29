import { apiClient } from '@/utils/apiClient'

export default class ChatbotService {
  /**
   * Reloads chatbot prompt sections from disk.
   * Returns the number of sections loaded.
   */
  public static async reloadPrompts(): Promise<{ sections: number }> {
    return await apiClient.post<{ sections: number }>('/chatbot/reload-prompts', {})
  }
}
