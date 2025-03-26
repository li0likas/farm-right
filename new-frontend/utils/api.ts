import axios from "axios";
import { logout } from "@/utils/auth";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// // add Authorization and Farm ID headers dynamically
// api.interceptors.request.use((config) => {
//   const accessToken = localStorage.getItem("accessToken");
//   const selectedFarmId = localStorage.getItem("x-selected-farm-id");

//   if (!accessToken || !selectedFarmId) {
//     toast.error("Missing authentication or farm selection.");
//     return Promise.reject(new Error("Unauthorized"));
//   }

//   config.headers["Authorization"] = `Bearer ${accessToken}`;
//   config.headers["x-selected-farm-id"] = selectedFarmId;

//   return config;
// });

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
        toast.error("Session expired. Please log in again.");

        logout(); // clear local storage & session
        window.location.href = "/auth/login"; // redirect to login
      }

      // Handle 403 Forbidden (Redirect to /pages/access)
      if (status === 403) {
        console.warn("Forbidden! Redirecting to access page...");
        toast.error("You do not have permission to do this.");
        //window.location.href = "/auth/access"; // Forbidden page
      }
    }

    return Promise.reject(error);
  }
);

export default api;