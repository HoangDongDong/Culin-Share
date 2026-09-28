import api from "./api";

export const loginApi = async (username, password) => {
  try {
    const response = await api.post("/api/login", { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const googleLoginApi = async (idToken) => {
  try {
    const response = await api.post("/api/auth/google", { idToken });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const forgotPasswordApi = async (email) => {
  try {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const resetPasswordApi = async (
  email,
  otp,
  newPassword,
  confirmPassword,
) => {
  try {
    const response = await api.post("/api/auth/reset-password", {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getProfileApi = async () => {
  try {
    const response = await api.get("/user/profile");
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateProfileApi = async (profileData) => {
  try {
    const response = await api.put("/user/profile", profileData);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const uploadAvatarApi = async (formData) => {
  try {
    const response = await api.post("/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const verifyOtpApi = async (email, otp) => {
  try {
    const response = await api.post("/api/verify-otp", { email, otp });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


