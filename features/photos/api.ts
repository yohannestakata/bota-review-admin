import type { AxiosInstance } from "axios"

import type { AdminPhoto, Photo, PhotoCategory, UploadSignature } from "./types"

export async function listBranchPhotos(
  api: AxiosInstance,
  branchId: string
): Promise<Photo[]> {
  const { data } = await api.get<Photo[]>(`/branches/${branchId}/photos`)
  return data
}

export async function listPendingPhotos(
  api: AxiosInstance
): Promise<AdminPhoto[]> {
  const { data } = await api.get<AdminPhoto[]>("/admin/photos/pending")
  return data
}

export async function approvePhoto(api: AxiosInstance, id: string) {
  const { data } = await api.patch<Photo>(`/admin/photos/${id}/approve`)
  return data
}

export async function rejectPhoto(api: AxiosInstance, id: string) {
  const { data } = await api.patch<Photo>(`/admin/photos/${id}/reject`)
  return data
}

export async function assignCover(
  api: AxiosInstance,
  branchId: string,
  photoId: string
) {
  const { data } = await api.patch(`/admin/branches/${branchId}/cover`, {
    photoId,
  })
  return data
}

async function signUpload(api: AxiosInstance): Promise<UploadSignature> {
  const { data } = await api.post<UploadSignature>("/photos/sign")
  return data
}

// Signed direct-to-Cloudinary upload, then register against the branch. The
// uploader is an editor/admin, so the backend auto-approves the photo.
export async function uploadBranchPhoto(
  api: AxiosInstance,
  branchId: string,
  file: File,
  category: PhotoCategory
): Promise<Photo> {
  const sig = await signUpload(api)

  const form = new FormData()
  form.append("file", file)
  form.append("api_key", sig.apiKey)
  form.append("timestamp", String(sig.timestamp))
  form.append("signature", sig.signature)
  form.append("folder", sig.folder)
  // Only sent when the backend signs a preset — must match the signed params.
  if (sig.uploadPreset) {
    form.append("upload_preset", sig.uploadPreset)
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
    { method: "POST", body: form }
  )
  if (!response.ok) {
    let detail = `status ${response.status}`
    try {
      const body = (await response.json()) as { error?: { message?: string } }
      detail = body.error?.message ?? detail
    } catch {
      // No JSON body — keep the status-derived detail.
    }
    throw new Error(`Cloudinary upload failed: ${detail}`)
  }
  const uploaded = (await response.json()) as {
    public_id: string
    secure_url: string
    width: number
    height: number
  }

  const { data } = await api.post<Photo>(`/branches/${branchId}/photos`, {
    publicId: uploaded.public_id,
    url: uploaded.secure_url,
    width: uploaded.width,
    height: uploaded.height,
    category,
  })
  return data
}
