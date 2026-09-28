import { expect } from '@playwright/test'

export const pngFile = {
  name: 'bead.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',
    'base64',
  ),
}

export async function requestBody(request) {
  if (!request.postDataBuffer()) return null
  const contentType = request.headers()['content-type']
  expect(contentType).toMatch(/^multipart\/form-data; boundary=/)
  const data = await new Response(request.postDataBuffer(), {
    headers: { 'Content-Type': contentType },
  }).formData()
  const body = {}
  for (const [key, value] of data) {
    body[key] =
      key === 'file'
        ? { name: value.name, type: value.type, size: value.size }
        : ['items', 'sizes'].includes(key)
          ? JSON.parse(value)
          : key === 'isActive'
            ? value === 'true'
            : ['price', 'stock', 'sortOrder'].includes(key)
              ? Number(value)
              : value
  }
  expect(body).not.toHaveProperty('imageUrl')
  expect(body).not.toHaveProperty('imageKey')
  return body
}
