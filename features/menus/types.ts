export type MenuStatus = "active" | "archived"

export type MenuItem = {
  id: string
  menuId: string
  price: string
  category: string | null
  imageUrl: string | null
  cloudinaryPublicId: string | null
  isAvailable: boolean
  displayOrder: number
  status: MenuStatus
  createdAt: string
  updatedAt: string
  name: string
  description: string | null
}

export type Menu = {
  id: string
  branchId: string
  name: string
  displayOrder: number
  status: MenuStatus
  lastVerifiedAt: string | null
  createdAt: string
  updatedAt: string
  items: MenuItem[]
}

export type MenuFormValues = {
  name: string
  displayOrder: string
}

export type MenuItemFormValues = {
  name: string
  description: string
  price: string
  category: string
  imageUrl: string
  isAvailable: boolean
  displayOrder: string
}
