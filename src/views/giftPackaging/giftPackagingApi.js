import api from '../../_helpers/api'
import { imageFormData } from '../../_helpers/imageUpload'

// Every Gift Packaging request goes through here, on the shared authenticated client.
const ENDPOINT = '/gift-packaging'
const path = (id, colorId) =>
  `${ENDPOINT}/${encodeURIComponent(id)}${colorId ? `/colors/${encodeURIComponent(colorId)}` : ''}`
// Image uploads may take longer than plain JSON saves.
const options = (file, signal) => ({ timeout: file ? 120000 : 15000, signal })

export const listPackaging = (signal) => api.get(ENDPOINT, { signal }).then(({ data }) => data)
export const getPackaging = (id, signal) => api.get(path(id), { signal }).then(({ data }) => data)

export const createPackaging = (fields, file) =>
  api.post(ENDPOINT, imageFormData(fields, file), options(file)).then(({ data }) => data)
export const updatePackaging = (id, fields, file) =>
  api.patch(path(id), imageFormData(fields, file), options(file)).then(({ data }) => data)
export const deletePackaging = (id) => api.delete(path(id))

export const addPackagingColor = (id, fields, file) =>
  api
    .post(`${path(id)}/colors`, imageFormData(fields, file), options(file))
    .then(({ data }) => data)
export const updatePackagingColor = (id, colorId, fields, file) =>
  api.patch(path(id, colorId), imageFormData(fields, file), options(file)).then(({ data }) => data)
export const deletePackagingColor = (id, colorId) => api.delete(path(id, colorId))
