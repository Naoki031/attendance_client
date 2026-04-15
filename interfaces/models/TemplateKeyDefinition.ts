export interface VariableDefinition {
  name: string
  description: string
}

export interface TemplateKeyDefinition {
  key: string
  description: string
  variables: VariableDefinition[]
}
