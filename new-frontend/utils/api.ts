// new-frontend/utils/api.ts
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

// attach Token & Farm ID dynamically before requests
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  const selectedFarmId = localStorage.getItem("x-selected-farm-id");

  // bypass headers for login-related requests
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

// Redirect on 401 (Unauthorized) or 403 (Forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config.url;

      // Handle 401 Unauthorized (EXCEPT login & signup)
      if (status === 401 && !requestUrl?.includes("/auth/signin") && !requestUrl?.includes("/auth/signup")) {
        console.warn("Unauthorized! Logging out...");
        toast.error(languageService.t('api.errors.sessionExpired'));

        logout(); // clear local storage & session
        window.location.href = "/auth/login"; // redirect to login
      }

      // Handle 403 Forbidden (Redirect to /pages/access)
      if (status === 403) {
        console.warn("Forbidden! Access denied...");
        toast.error(languageService.t('api.errors.permissionDenied'));
        //window.location.href = "/auth/access"; // Forbidden page
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Network Error:", error);
      toast.error(languageService.t('api.errors.networkError'));
    } else {
      // Something happened in setting up the request
      console.error("Error:", error.message);
      toast.error(languageService.t('api.errors.unknownError'));
    }

    return Promise.reject(error);
  }
);

// Listen for language changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'language' && event.newValue) {
      languageService.setLanguage(event.newValue);
    }
  });
}

export default api;