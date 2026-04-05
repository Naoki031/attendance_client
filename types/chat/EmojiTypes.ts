export interface PackItem {
  key: string
  url: string
  label: string
}

export interface EmojiCategory {
  name: string
  icon: string
  tabImage?: string
  isCustomPack?: boolean
  isMixed?: boolean
  blobs?: PackItem[]
  emojis?: string[]
}
