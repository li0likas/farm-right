import axios from "axios";
import { logout } from "@/utils/auth";
import { toast } from "sonner";
import languageService from "@/utils/languageService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
  const selectedFarmId = localStorage.getItem("x-selected-farm-id");

  if (config.url?.includes("/auth/signin") || config.url?.includes("/auth/signup")) {
    return config;
  }

  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (selectedFarmId) {
    config.headers["x-selected-farm-id"] = selectedFarmId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config.url;

      // Handle 401 Unauthorized (EXCEPT login & signup)
      if (status === 401 && !requestUrl?.includes("/auth/signin") && !requestUrl?.includes("/auth/signup")) {
        console.warn("Unauthorized! Logging out...");
        toast.error(languageService.t('errors.sessionExpired'));

        logout(); // clear local storage & session
        window.location.href = "/auth/login"; // redirect to login
      }

      // Handle 403 Forbidden (Redirect to /pages/access)
      if (status === 403) {
        console.warn("Forbidden! Access denied...");
        toast.error(languageService.t('errors.permissionDenied'));
      }
    } else if (error.request) {
      console.error("Network Error:", error);
      toast.error(languageService.t('errors.networkError'));
    } else {
      console.error("Error:", error.message);
      toast.error(languageService.t('errors.unknownError'));
    }

    return Promise.reject(error);
  }
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'language' && event.newValue) {
      languageService.setLanguage(event.newValue);
    }
  });
}

export default api;