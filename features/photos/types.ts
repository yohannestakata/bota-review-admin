export type PhotoCategory =
  | "food"
  | "drink"
  | "interior"
  | "exterior"
  | "menu"
  | "ambience"

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  "food",
  "drink",
  "interior",
  "exterior",
  "menu",
  "ambience",
]

export type Photo = {
  id: string
  branchId: string
  url: string
  width: number
  height: number
  category: PhotoCategory
  moderationStatus: "pending" | "approved" | "rejected"
  isCover: boolean
  cloudinaryPublicId: string | null
  createdAt: string
}

export type UploadSignature = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  uploadPreset: string
  folder: string
}
