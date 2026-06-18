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
  reviewId?: string | null
  uploadedByUserId?: string
  url: string
  width: number
  height: number
  category: PhotoCategory
  moderationStatus: "pending" | "approved" | "rejected"
  isCover: boolean
  cloudinaryPublicId: string | null
  moderatedByUserId?: string | null
  moderatedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export type AdminPhoto = Photo & {
  branch: {
    id: string
    label: string
    slug: string
    status: "draft" | "published" | "archived"
  }
  uploader: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    trustLevel: string
  }
}

export type UploadSignature = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  uploadPreset: string
  folder: string
}
