import api from "./api";

const buildParams = (filters) => {
  const params = {};
  if (filters.q) params.q = filters.q;
  if (filters.category && filters.category !== "all") {
    params.category = filters.category;
  }
  if (filters.difficulty && filters.difficulty !== "all") {
    params.difficulty = filters.difficulty;
  }
  if (filters.sort) params.sort = filters.sort;
  if (filters.author_id) params.author_id = filters.author_id;
  if (filters.limit) params.limit = filters.limit;
  if (filters.page) params.page = filters.page;
  return params;
};

export const searchRecipesApi = async (filters = {}) => {
  try {
    const response = await api.get("/api/recipes", {
      params: buildParams(filters),
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRecipeByIdApi = async (id) => {
  try {
    const response = await api.get(`/api/recipes/${id}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRecipeBySlugApi = async (slug) => {
  try {
    const response = await api.get(`/api/recipes/slug/${slug}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

const hasRecipeFiles = (recipeData) =>
  recipeData.coverImageFile || recipeData.steps?.some((step) => step.image_file);

const buildRecipeFormData = (recipeData) => {
  const formData = new FormData();
  const { coverImageFile, steps = [], ...fields } = recipeData;

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : value);
    }
  });

  const sanitizedSteps = steps.map((step) => {
    const sanitizedStep = { ...step };
    delete sanitizedStep.image_file;
    delete sanitizedStep.image_preview;
    return sanitizedStep;
  });
  const stepImageIndexes = [];
  steps.forEach((step, index) => {
    if (step.image_file) {
      formData.append("stepImages", step.image_file);
      stepImageIndexes.push(index);
    }
  });
  formData.append("steps", JSON.stringify(sanitizedSteps));
  formData.append("stepImageIndexes", JSON.stringify(stepImageIndexes));

  if (coverImageFile) {
    formData.append("coverImage", coverImageFile);
  }

  return formData;
};

export const createRecipeApi = async (recipeData) => {
  try {
    const hasFiles = hasRecipeFiles(recipeData);
    const response = await api.post("/api/recipes", hasFiles ? buildRecipeFormData(recipeData) : recipeData, hasFiles ? {
      headers: { "Content-Type": "multipart/form-data" },
    } : undefined);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateRecipeApi = async (id, recipeData) => {
  try {
    const hasFiles = hasRecipeFiles(recipeData);
    const response = await api.put(`/api/recipes/${id}`, hasFiles ? buildRecipeFormData(recipeData) : recipeData, hasFiles ? {
      headers: { "Content-Type": "multipart/form-data" },
    } : undefined);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteRecipeApi = async (id) => {
  try {
    const response = await api.delete(`/api/recipes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reviews
export const submitReviewApi = async (recipeId, rating, comment) => {
  try {
    const response = await api.post(`/api/recipes/${recipeId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Comments
export const submitCommentApi = async (recipeId, content, parentId = null) => {
  try {
    const response = await api.post(`/api/recipes/${recipeId}/comments`, {
      content,
      parentId,
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteCommentApi = async (commentId) => {
  try {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Saved Recipes
export const getSavedRecipesApi = async (userId) => {
  try {
    const url = userId ? `/api/me/saved-recipes?userId=${userId}` : "/api/me/saved-recipes";
    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const saveRecipeApi = async (recipeId) => {
  try {
    const response = await api.post(`/api/recipes/${recipeId}/save`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const unsaveRecipeApi = async (recipeId) => {
  try {
    const response = await api.delete(`/api/recipes/${recipeId}/save`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkSavedStatusApi = async (recipeId) => {
  try {
    const response = await api.get(`/api/recipes/${recipeId}/saved-status`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Follows
export const followUserApi = async (userId) => {
  try {
    const response = await api.post(`/api/users/${userId}/follow`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const unfollowUserApi = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}/follow`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const checkFollowStatusApi = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/follow-status`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChefProfileApi = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChefsRankingApi = async () => {
  try {
    const response = await api.get('/api/chefs/ranking');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getFollowersApi = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/followers`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getFollowingApi = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/following`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateHealthStatsApi = async (data) => {
  try {
    const response = await api.put("/api/me/health", data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const changePasswordApi = async (data) => {
  try {
    const response = await api.put("/user/password", data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ========================
// ADMIN MANAGEMENT APIs
// ========================

export const getAdminUsersApi = async () => {
  try {
    const response = await api.get('/api/admin/users');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAdminUserApi = async (id) => {
  try {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAdminUserRoleApi = async (id, role) => {
  try {
    const response = await api.put(`/api/admin/users/${id}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAdminRecipesApi = async (status) => {
  try {
    const response = await api.get('/api/admin/recipes', { params: { status } });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateAdminRecipeStatusApi = async (id, status) => {
  try {
    const response = await api.put(`/api/admin/recipes/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAdminRecipeApi = async (id) => {
  try {
    const response = await api.delete(`/api/admin/recipes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createAdminCategoryApi = async (data) => {
  try {
    const response = await api.post('/api/admin/categories', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteAdminCategoryApi = async (id) => {
  try {
    const response = await api.delete(`/api/admin/categories/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getRecipesRankingApi = async () => {
  try {
    const response = await api.get("/api/recipes/ranking");
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
