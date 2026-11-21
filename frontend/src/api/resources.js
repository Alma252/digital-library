import client from './client.js'
import { USE_MOCK } from './config.js'
import * as mock from './mock/handlers.js'

const data = (request) => request.then((response) => response.data)

// params: { page, page_size, search, category, language, file_type }
export const listResources = (params) =>
  USE_MOCK ? mock.listResources(params) : data(client.get('/resources/', { params }))

export const getResource = (id) => (USE_MOCK ? mock.getResource(id) : data(client.get(`/resources/${id}/`)))

export const listCategories = () => (USE_MOCK ? mock.listCategories() : data(client.get('/categories/')))

export const listAuthors = (params) =>
  USE_MOCK ? mock.listAuthors(params) : data(client.get('/authors/', { params }))
