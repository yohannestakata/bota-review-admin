/**
 * A resized Cloudinary URL (cropped to fill `size`×`size`, auto format and
 * quality). Other URLs pass through unchanged.
 */
export function thumbnail(url: string, size: number) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? withTransform(url, `c_fill,w_${size},h_${size},f_auto,q_auto`)
    : url
}

// After any edits already in the URL (rotate, crop…), so the size applies to
// the edited photo rather than before the edits.
function withTransform(url: string, transform: string) {
  const match = url.match(/\/upload\/((?:[^/]+\/)*?)(v\d+\/)/)
  if (match) {
    return url.replace(match[0], `/upload/${match[1]}${transform}/${match[2]}`)
  }
  return url.replace("/upload/", `/upload/${transform}/`)
}
