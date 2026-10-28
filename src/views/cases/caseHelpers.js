import { clampArea } from '../apparel/apparelHelpers'

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

// Starting points only: drag them onto the real template of each model.
export const defaultCaseArea = () => ({ x: 0.03, y: 0.015, width: 0.94, height: 0.97, radius: 0.14 })
export const defaultCameraArea = () => ({ x: 0.07, y: 0.025, width: 0.4, height: 0.19, radius: 0.22 })

/** CSS corners for an area whose radius is a fraction of its width. */
export const radiusStyle = (area) => {
  const radius = Number(area?.radius) || 0
  if (!radius || !area?.width || !area?.height) return undefined
  const vertical = (radius * area.width) / area.height
  return { borderRadius: `${radius * 100}% / ${Math.min(vertical, 0.5) * 100}%` }
}

const round = (value) => Math.round(value * 10000) / 10000

/** A case area for the API: clamped inside the template, radius 0–0.5 of its width. */
export const caseAreaPayload = (area) => {
  const { x, y, width, height } = clampArea(area)
  const radius = Math.min(Math.max(Number(area.radius) || 0, 0), 0.5)
  return { x, y, width, height, ...(radius ? { radius: round(radius) } : {}) }
}
