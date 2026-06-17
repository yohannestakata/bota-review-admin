import type { AxiosInstance } from "axios"

import type { CurrentUser } from "./types"

export async function getMe(api: AxiosInstance): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/me")
  return data
}
