export type RouteType = {
  icon: string
  text: string
  link: string
  active?: string
  children?: RouteType[]
  type?: string
  inset?: boolean
  name?: string
}

export type DividerType = {
  type: 'divider'
  inset: boolean
}
