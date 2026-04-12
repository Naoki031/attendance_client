export interface RoomSectionItemModel {
  id: number
  section_id: number
  resource_type: 'meeting' | 'chat_room'
  resource_id: number
  created_at?: string
}

export interface RoomSectionModel {
  id: number
  user_id: number
  name: string
  position: number
  items?: RoomSectionItemModel[]
  created_at?: string
  updated_at?: string
}
