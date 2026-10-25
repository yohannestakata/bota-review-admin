import type { Api } from "@/lib/api"

const WIDTHS = [320, 640, 1280] as const

/**
 * Our photos come in 320, 640 and 1280 px wide; picks the smallest that is
 * at least `width` px. Other URLs pass through unchanged.
 */
export function photoSize(url: string, width: number) {
  const match = url.match(/^(.+\/i\/[^/]+\/[^/]+\/)(?:320|640|1280)\.webp$/)
  if (!match) return url
  const size = WIDTHS.find((w) => w >= width) ?? 1280
  return `${match[1]}${size}.webp`
}

const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"]

/** The image types an upload can be, for a file input's `accept`. */
export const UPLOAD_ACCEPT = UPLOAD_TYPES.join(",")

type UploadLink = {
  uploadKey: string
  url: string
  headers: Record<string, string>
  expiresIn: number
}

/**
 * Uploads an image straight to storage through a link from the API. Returns
 * the upload key to send to the endpoint that uses the image.
 */
export async function uploadImage(api: Api, file: File) {
  if (!UPLOAD_TYPES.includes(file.type)) {
    throw new Error(`${file.name} isn't a JPEG, PNG or WebP image`)
  }
  const link = (
    await api<UploadLink>("/photos/upload-link", {
      method: "POST",
      body: { contentType: file.type },
    })
  ).data
  const response = await fetch(link.url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`${file.name} didn't upload: status ${response.status}`)
  }
  return link.uploadKey
}
