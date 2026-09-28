import api from './api'

export const getProfileApi = async () => {
  try {
    const response = await api.get('/api/user/profile')
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}

export const updateProfileApi = async (payload) => {
  try {
    const response = await api.put('/api/user/profile', payload)
    return response.data
  } catch (error) {
    throw error.response?.data || error.message
  }
}