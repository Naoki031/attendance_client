import type { UserModel } from '~/interfaces/models/UserModel'

/** State **/
export type AuthState = {
  isAuthenticated: boolean
  user: UserModel | null
}
