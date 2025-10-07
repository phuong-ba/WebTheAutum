import axios from "axios";
import Cookies from "js-cookie";

const baseUrl = axios.create({
  baseURL: "http://localhost:8080/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

baseUrl.interceptors.request.use(
  (config) => {
    const token = JSON.parse(Cookies.get("token") || "null");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

export default baseUrl;
