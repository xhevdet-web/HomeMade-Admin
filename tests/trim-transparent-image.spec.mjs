import { test, expect } from '@playwright/test'
import { findContentBounds, squareCrop } from '../src/_helpers/trimTransparentImage.js'

/** RGBA image, fully transparent unless painted. */
const canvas = (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) })
const paint = (image, x0, y0, w, h, alpha = 255) => {
  for (let y = y0; y < y0 + h; y += 1)
    for (let x = x0; x < x0 + w; x += 1) image.data[(y * image.width + x) * 4 + 3] = alpha
}
const disc = (image, cx, cy, radius, alpha = 255) => {
  for (let y = 0; y < image.height; y += 1)
    for (let x = 0; x < image.width; x += 1)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2)
        image.data[(y * image.width + x) * 4 + 3] = alpha
}
const bounds = (image, options) =>
  findContentBounds(image.data, image.width, image.height, options)

test.describe('trimTransparentImage: content bounds', () => {
  test('finds a bead in the middle of a large transparent canvas', () => {
    const image = canvas(1200, 1600)
    disc(image, 600, 800, 87.5)
    const result = bounds(image)
    expect(result.hasTransparency).toBe(true)
    expect(result.bounds).toEqual({ left: 513, top: 713, right: 686, bottom: 886 })
  })

  test('ignores faint halo pixels at or below the alpha threshold', () => {
    const image = canvas(400, 400)
    paint(image, 50, 50, 300, 300, 16)
    paint(image, 150, 150, 100, 100)
    expect(bounds(image).bounds).toEqual({ left: 150, top: 150, right: 249, bottom: 249 })
    expect(bounds(image, { alphaThreshold: 15 }).bounds).toEqual({
      left: 50,
      top: 50,
      right: 349,
      bottom: 349,
    })
  })

  test('small specks far from the bead do not stretch the box', () => {
    const image = canvas(1200, 1600)
    disc(image, 600, 800, 87.5)
    const clean = bounds(image).bounds
    // Dust in the corners, beside the bead and below it.
    paint(image, 10, 10, 3, 3)
    paint(image, 1180, 1580, 3, 3)
    paint(image, 50, 790, 4, 4)
    paint(image, 600, 1400, 1, 5)
    expect(bounds(image).bounds).toEqual(clean)
  })

  test('a row needs at least 2 pixels even on a tiny image', () => {
    const image = canvas(20, 20)
    paint(image, 5, 5, 10, 10)
    paint(image, 0, 0, 1, 1)
    expect(bounds(image).bounds).toEqual({ left: 5, top: 5, right: 14, bottom: 14 })
  })

  test('reports an opaque image as having no transparency', () => {
    const image = canvas(10, 10)
    paint(image, 0, 0, 10, 10)
    expect(bounds(image)).toEqual({
      hasTransparency: false,
      bounds: { left: 0, top: 0, right: 9, bottom: 9 },
    })
  })

  test('returns no bounds for a fully transparent image', () => {
    expect(bounds(canvas(50, 50))).toEqual({ hasTransparency: true, bounds: null })
  })
})

test.describe('trimTransparentImage: square crop', () => {
  test('makes a square around the box with a 2% margin, centred on it', () => {
    const crop = squareCrop({ left: 513, top: 713, right: 686, bottom: 886 })
    expect(crop.side).toBe(Math.ceil(174 * 1.02))
    expect(crop.outputSide).toBe(crop.side)
    expect(crop.sx + crop.side / 2).toBe(600)
    expect(crop.sy + crop.side / 2).toBe(800)
  })

  test('uses the longer side of a non-square box and centres the shorter one', () => {
    const crop = squareCrop({ left: 100, top: 0, right: 199, bottom: 299 }, { margin: 0 })
    expect(crop).toEqual({ sx: 0, sy: 0, side: 300, outputSide: 300 })
  })

  test('downscales a square larger than the maximum side', () => {
    const crop = squareCrop({ left: 0, top: 0, right: 2999, bottom: 1999 })
    expect(crop.side).toBe(3060)
    expect(crop.outputSide).toBe(1024)
  })
})
