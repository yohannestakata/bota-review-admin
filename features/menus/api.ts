import type { AxiosInstance } from "axios"

import type {
  Menu,
  MenuFormValues,
  MenuItem,
  MenuItemFormValues,
} from "./types"

function menuBody(values: MenuFormValues) {
  return {
    name: values.name.trim(),
    displayOrder: Number(values.displayOrder || 0),
  }
}

function itemBody(values: MenuItemFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    price: values.price.trim(),
    category: values.category.trim() || undefined,
    imageUrl: values.imageUrl.trim() || undefined,
    isAvailable: values.isAvailable,
    displayOrder: Number(values.displayOrder || 0),
  }
}

export async function listBranchMenus(
  api: AxiosInstance,
  branchId: string
): Promise<Menu[]> {
  const { data } = await api.get<Menu[]>(`/branches/${branchId}/menus`)
  return data
}

export async function createMenu(
  api: AxiosInstance,
  branchId: string,
  values: MenuFormValues
): Promise<Menu> {
  const { data } = await api.post<Menu>(
    `/admin/branches/${branchId}/menus`,
    menuBody(values)
  )
  return data
}

export async function updateMenu(
  api: AxiosInstance,
  id: string,
  values: MenuFormValues
): Promise<Menu> {
  const { data } = await api.patch<Menu>(`/admin/menus/${id}`, menuBody(values))
  return data
}

export async function archiveMenu(
  api: AxiosInstance,
  id: string
): Promise<Menu> {
  const { data } = await api.delete<Menu>(`/admin/menus/${id}`)
  return data
}

export async function createMenuItem(
  api: AxiosInstance,
  menuId: string,
  values: MenuItemFormValues
): Promise<MenuItem> {
  const { data } = await api.post<MenuItem>(
    `/admin/menus/${menuId}/items`,
    itemBody(values)
  )
  return data
}

export async function updateMenuItem(
  api: AxiosInstance,
  id: string,
  values: MenuItemFormValues
): Promise<MenuItem> {
  const { data } = await api.patch<MenuItem>(
    `/admin/menu-items/${id}`,
    itemBody(values)
  )
  return data
}

export async function archiveMenuItem(
  api: AxiosInstance,
  id: string
): Promise<MenuItem> {
  const { data } = await api.delete<MenuItem>(`/admin/menu-items/${id}`)
  return data
}

export async function updateMenuItemAvailability(
  api: AxiosInstance,
  id: string,
  isAvailable: boolean
): Promise<MenuItem> {
  const { data } = await api.patch<MenuItem>(
    `/admin/menu-items/${id}/availability`,
    { isAvailable }
  )
  return data
}
