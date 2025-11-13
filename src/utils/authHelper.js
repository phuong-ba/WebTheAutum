export const getCurrentUser = () => {
  return {
    id: localStorage.getItem("user_id") ? parseInt(localStorage.getItem("user_id")) : null,
    name: localStorage.getItem("user_name") || "",
    email: localStorage.getItem("user_email") || "",
    role: localStorage.getItem("user_role") || ""
  };
};

export const getCurrentUserId = () => {
  const userId = localStorage.getItem("user_id");
  return userId ? parseInt(userId) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("auth_token");
};

export const logout = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
};