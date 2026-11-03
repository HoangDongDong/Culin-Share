import api from './api';

const data = response => response.data.data;
export const communityApi = {
  feed: (params, signal) => api.get('/api/community/posts', { params, signal }).then(data),
  stats: signal => api.get('/api/community/stats', { signal }).then(data),
  metadata: signal => api.get('/api/community/metadata', { signal }).then(data),
  save: (id, saved) => (saved ? api.put(`/api/community/posts/${id}/save`) : api.delete(`/api/community/posts/${id}/save`)).then(data),
  follow: (id, followed) => (followed ? api.post(`/api/users/${id}/follow`) : api.delete(`/api/users/${id}/follow`)).then(response => response.data.data),
  join: (id, joined) => (joined ? api.put(`/api/community/challenges/${id}/join`) : api.delete(`/api/community/challenges/${id}/join`)).then(data),
  register: (id, registered) => (registered ? api.put(`/api/community/events/${id}/register`) : api.delete(`/api/community/events/${id}/register`)).then(data),
  createActivity: (type, payload) => api.post(type === 'challenge' ? '/api/community/challenges' : '/api/community/events',payload).then(data),
  post: (id, signal) => api.get(`/api/community/posts/${id}`, { signal }).then(data),
  create: (content, recipes, images, details = {}, onProgress) => {
    const form = new FormData();
    form.append('content', content);
    form.append('recipeIds', JSON.stringify(recipes.map(recipe => recipe.id)));
    Object.entries(details).forEach(([key,value]) => { if (value !== null && value !== undefined) form.append(key,value); });
    images.forEach(image => form.append('images', image.file));
    return api.post('/api/community/posts', form, { headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: event => { if (event.total && onProgress) onProgress(Math.round(event.loaded / event.total * 100)); },
    }).then(data);
  },
  edit: (id, content) => api.patch(`/api/community/posts/${id}`, { content }).then(data),
  remove: id => api.delete(`/api/community/posts/${id}`).then(data),
  like: (id, liked) => (liked ? api.put(`/api/community/posts/${id}/like`) : api.delete(`/api/community/posts/${id}/like`)).then(data),
  comments: (id, after = 0) => api.get(`/api/community/posts/${id}/comments`, { params: { after } }).then(data),
  addComment: (id, content, parentId) => api.post(`/api/community/posts/${id}/comments`, { content, parentId }).then(data),
  removeComment: id => api.delete(`/api/community/comments/${id}`).then(data),
  report: (id, reason, description) => api.post(`/api/community/posts/${id}/report`, { reason, description }).then(data),
  reportComment: (id, reason, description) => api.post(`/api/community/comments/${id}/report`, { reason, description }).then(data),
  recipes: (q, signal) => api.get('/api/recipes', { params: { q, limit: 8 }, signal }).then(data),
};
export const communityError = error => error.response?.data?.message || 'Chưa thể thực hiện thao tác. Bạn thử lại nhé.';
