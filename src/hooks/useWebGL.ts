/** True when the browser can create a WebGL context. Checked once; the page has a static fallback without it. */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
