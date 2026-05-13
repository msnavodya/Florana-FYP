// Wrap API calls used by the legacy Florana web client.
import axios from "axios";


const fallbackHost = window?.location?.hostname || "127.0.0.1";
export const API_URL = (process.env.REACT_APP_API_URL || `http://${fallbackHost}:8000`).replace(/\/+$/, "");

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});


API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const buildApiUrl = (path = "") => {
  if (!path) {
    return API_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

export const getApiErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return Array.isArray(data.detail)
      ? data.detail.map((item) => item.msg || item.message || String(item)).join("\n")
      : data.detail;
  }

  if (data?.message) {
    return data.message;
  }

  return error?.message || "Something went wrong. Please try again.";
};


export const signupUser = (payload) => API.post("/auth/signup", payload);

export const loginUser = async (email, password) => {
  const response = await API.post("/auth/login", { email, password });

  if (response.data?.access_token) {
    localStorage.setItem("token", response.data.access_token);
  }

  return response;
};

export const predictImage = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post("/predict", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getPlants = () => API.get("/plants/");

export const createPlant = (formData) =>
  API.post("/plants/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deletePlant = (plantId) => API.delete(`/plants/${plantId}`);

export const getPlant = (plantId) => API.get(`/plants/${plantId}`);

export const getPlantByName = (plantName) =>
  API.get(`/plants/by-name/${encodeURIComponent(plantName)}`);

export const addGrowth = (formData) =>
  API.post("/growth/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getGrowth = (plantId) => API.get(`/growth/${plantId}`);

export const getProducts = () => API.get("/shop/products");

export const createProduct = (formData) =>
  API.post("/shop/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteProduct = (productId) => API.delete(`/shop/products/${productId}`);

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};


export default API;
