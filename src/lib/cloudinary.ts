/**
 * A resized Cloudinary URL (cropped to fill `size`×`size`, auto format and
 * quality). Other URLs pass through unchanged.
 */
export function thumbnail(url: string, size: number) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`)
    : url
}
