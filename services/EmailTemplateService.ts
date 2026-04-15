import { apiClient } from '@/utils/apiClient'
import type { EmailTemplateModel } from '@/interfaces/models/EmailTemplateModel'
import type { TemplateKeyDefinition } from '@/interfaces/models/TemplateKeyDefinition'

export default class EmailTemplateService {
  public static async getTemplateKeys(): Promise<TemplateKeyDefinition[]> {
    return apiClient.get<TemplateKeyDefinition[]>('/email-templates/template-keys')
  }

  public static async getAll(companyId?: number): Promise<EmailTemplateModel[]> {
    const query = companyId ? `?company_id=${companyId}` : ''
    return apiClient.get<EmailTemplateModel[]>(`/email-templates${query}`)
  }

  public static async getOne(id: number): Promise<EmailTemplateModel> {
    return apiClient.get<EmailTemplateModel>(`/email-templates/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<EmailTemplateModel> {
    return apiClient.post<EmailTemplateModel>('/email-templates', data)
  }

  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<EmailTemplateModel> {
    return apiClient.put<EmailTemplateModel>(`/email-templates/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/email-templates/${id}`)) as boolean
  }
}
