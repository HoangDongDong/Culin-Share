import api from "./api";

export const getCategoriesApi = async () => {
  try {
    const response = await api.get("/api/categories");
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCategoryByIdApi = async (id) => {
  try {
    const response = await api.get(`/api/categories/${id}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
