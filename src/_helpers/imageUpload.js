export const validateImageFile = (file) => {
  if (!file) return null
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Choose a JPEG, PNG, or WebP image.'
  if (file.size > 5 * 1024 * 1024) return 'Image must be 5 MB or smaller.'
  return null
}

export const imageFormData = (fields, file) => {
  const error = validateImageFile(file)
  if (error) throw new Error(error)
  const data = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined)
      data.append(
        key,
        ['items', 'sizes'].includes(key) ? JSON.stringify(value) : String(value ?? ''),
      )
  })
  if (file) data.append('file', file)
  return data
}
