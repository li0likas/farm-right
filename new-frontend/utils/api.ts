import axios from 'axios';
import { toast } from "sonner";
import { logout } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Redirect to /login if 401 Unauthorized
api.interceptors.response.use(
  response => response,
  error => {
    // if (error.response?.status === 401) {
    //   logout();
    //   toast.warning("Unauthorized! Redirecting to login...");
    //   window.location.href = '/auth/login';
    // }
    // return Promise.reject(error);
  }
);

export default api;