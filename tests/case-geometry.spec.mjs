import { test, expect } from '@playwright/test'
import {
  bleedShape,
  cameraShape,
  parseCaseTemplate,
  printableShape,
  safeShape,
  shapePath,
  templateFrame,
} from '../src/views/cases/caseGeometry.js'

/*
 * The admin's copy of the case geometry must draw exactly what the customer's studio draws:
 * these expected paths are the same as in HomeMadeWeb/tests/case-geometry.spec.ts.
 */

const LEGACY = {
  front: { x: 0.04, y: 0.02, width: 0.92, height: 0.96, radius: 0.14 },
  camera: { x: 0.1, y: 0.03, width: 0.4, height: 0.15, radius: 0.2 },
}
const ADVANCED = {
  front: {
    x: 0.03,
    y: 0.015,
    width: 0.94,
    height: 0.97,
    radius: 0.18,
    radii: { tl: 0.18, tr: 0.18, br: 0.12, bl: 0.12 },
    bleed: 0.03,
    safe: { top: 0.3, right: 0.06, bottom: 0.06, left: 0.06 },
  },
  camera: {
    x: 0.07,
    y: 0.025,
    width: 0.4,
    height: 0.19,
    radius: 0.22,
    radii: { tl: 0.3, tr: 0.22, br: 0.22, bl: 0.22 },
  },
}
const RATIO = 0.5
const view = templateFrame(RATIO)

const EXPECTED = {
  legacyPrintable:
    'M16.88 4H83.12A12.88 12.88 0 0 1 96 16.88V183.12A12.88 12.88 0 0 1 83.12 196H16.88A12.88 12.88 0 0 1 4 183.12V16.88A12.88 12.88 0 0 1 16.88 4Z',
  legacyCamera: 'M18 6H42A8 8 0 0 1 50 14V28A8 8 0 0 1 42 36H18A8 8 0 0 1 10 28V14A8 8 0 0 1 18 6Z',
  advPrintable:
    'M19.92 3H80.08A16.92 16.92 0 0 1 97 19.92V185.72A11.28 11.28 0 0 1 85.72 197H14.28A11.28 11.28 0 0 1 3 185.72V19.92A16.92 16.92 0 0 1 19.92 3Z',
  advBleed:
    'M19.92 0.18H80.08A19.74 19.74 0 0 1 99.82 19.92V185.72A14.1 14.1 0 0 1 85.72 199.82H14.28A14.1 14.1 0 0 1 0.18 185.72V19.92A19.74 19.74 0 0 1 19.92 0.18Z',
  advSafe:
    'M19.92 31.2H80.08A11.28 0 0 0 1 91.36 31.2V185.72A5.64 5.64 0 0 1 85.72 191.36H14.28A5.64 5.64 0 0 1 8.64 185.72V31.2A11.28 0 0 0 1 19.92 31.2Z',
  advCamera:
    'M19 5H38.2A8.8 8.8 0 0 1 47 13.8V34.2A8.8 8.8 0 0 1 38.2 43H15.8A8.8 8.8 0 0 1 7 34.2V17A12 12 0 0 1 19 5Z',
}

test('the admin draws an existing single-radius template like the studio', () => {
  const t = parseCaseTemplate(LEGACY, LEGACY.front)
  expect(shapePath(printableShape(t, RATIO), view)).toBe(EXPECTED.legacyPrintable)
  expect(shapePath(cameraShape(t, RATIO), view)).toBe(EXPECTED.legacyCamera)
  expect(t.bleed).toBe(0)
  expect(t.safe).toBeNull()
})

test('the admin draws corners, bleed, safe area and camera like the studio', () => {
  const t = parseCaseTemplate(ADVANCED, ADVANCED.front)
  expect(shapePath(printableShape(t, RATIO), view)).toBe(EXPECTED.advPrintable)
  expect(shapePath(bleedShape(t, RATIO), view)).toBe(EXPECTED.advBleed)
  expect(shapePath(safeShape(t, RATIO), view)).toBe(EXPECTED.advSafe)
  expect(shapePath(cameraShape(t, RATIO), view)).toBe(EXPECTED.advCamera)
})
