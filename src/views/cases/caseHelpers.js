import { useEffect, useState } from 'react'
import { clampArea } from '../apparel/apparelHelpers'
import { MAX_BLEED, MAX_SAFE_INSET } from './caseGeometry'

// Phone case models are COMPANY products of a CASE category: one product per model, with
// its own template image, printable area, camera opening, price and stock.
export const isCase = (category) => category?.builderType === 'CASE'

// The app groups models under these brands; any other uppercase name also works.
export const deviceBrands = {
  APPLE: 'Apple',
  SAMSUNG: 'Samsung',
  GOOGLE: 'Google',
  XIAOMI: 'Xiaomi',
  HUAWEI: 'Huawei',
  OTHER: 'Other',
}
export const brandLabel = (brand) =>
  deviceBrands[brand] || (brand ? brand.charAt(0) + brand.slice(1).toLowerCase() : '')

// Starting points only: drag them onto the real template of each model. New templates have no
// bleed and no safe area until the admin sets them (no production value is assumed).
export const defaultCaseArea = () => ({
  x: 0.03,
  y: 0.015,
  width: 0.94,
  height: 0.97,
  radius: 0.14,
})
export const defaultCameraArea = () => ({
  x: 0.07,
  y: 0.025,
  width: 0.4,
  height: 0.19,
  radius: 0.22,
})
export const defaultSafeInsets = () => ({ top: 0.06, right: 0.06, bottom: 0.06, left: 0.06 })

export const CORNERS = [
  ['tl', 'Top left'],
  ['tr', 'Top right'],
  ['bl', 'Bottom left'],
  ['br', 'Bottom right'],
]
export const SIDES = [
  ['top', 'Top'],
  ['right', 'Right'],
  ['bottom', 'Bottom'],
  ['left', 'Left'],
]

const round = (value) => Math.round(value * 10000) / 10000
const clamp = (value, max) => Math.min(Math.max(Number(value) || 0, 0), max)

/**
 * A case area for the API: clamped inside the template, radii 0–0.5 of its width. Advanced
 * corners send `radii` and keep `radius` (the top-left corner) for clients that only know one
 * radius. The printable area (`printable`) also carries its bleed and safe area.
 */
export const caseAreaPayload = (area, printable = false) => {
  const { x, y, width, height } = clampArea(area)
  const radii = area.radii
    ? Object.fromEntries(CORNERS.map(([key]) => [key, round(clamp(area.radii[key], 0.5))]))
    : null
  const radius = radii ? radii.tl : round(clamp(area.radius, 0.5))
  const result = { x, y, width, height, ...(radius ? { radius } : {}), ...(radii ? { radii } : {}) }
  if (!printable) return result
  const bleed = round(clamp(area.bleed, MAX_BLEED))
  if (bleed) result.bleed = bleed
  if (area.safe)
    result.safe = Object.fromEntries(
      SIDES.map(([key]) => [key, round(clamp(area.safe[key], MAX_SAFE_INSET))]),
    )
  return result
}

/** True when the camera opening and the printable area overlap (the API requires it). */
export const cameraOverlaps = (area, camera) =>
  camera.x < area.x + area.width &&
  camera.x + camera.width > area.x &&
  camera.y < area.y + area.height &&
  camera.y + camera.height > area.y

/** Width ÷ height of an image once it has loaded (null until then, or when it fails). */
export const useImageRatio = (src) => {
  const [ratio, setRatio] = useState({ src: null, value: null })
  useEffect(() => {
    if (!src) return undefined
    let live = true
    const image = new Image()
    image.referrerPolicy = 'no-referrer'
    image.onload = () =>
      live &&
      image.naturalWidth &&
      setRatio({ src, value: image.naturalWidth / image.naturalHeight })
    image.src = src
    return () => {
      live = false
    }
  }, [src])
  return ratio.src === src ? ratio.value : null
}
