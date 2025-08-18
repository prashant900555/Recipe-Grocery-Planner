import axios from "axios";
import { apiUrl } from "../config/api.js";

const API_URL = apiUrl("/api/auth");

// Area codes for the dropdown
export const AREA_CODES = [
  { code: "1", country: "US/Canada", flag: "🇺🇸" },
  { code: "44", country: "UK", flag: "🇬🇧" },
  { code: "91", country: "India", flag: "🇮🇳" },
  { code: "353", country: "Ireland", flag: "🇮🇪" },
  { code: "61", country: "Australia", flag: "🇦🇺" },
  { code: "49", country: "Germany", flag: "🇩🇪" },
  { code: "33", country: "France", flag: "🇫🇷" },
  { code: "81", country: "Japan", flag: "🇯🇵" },
  { code: "86", country: "China", flag: "🇨🇳" },
  { code: "7", country: "Russia", flag: "🇷🇺" },
];

// Configure axios to include credentials (cookies)
axios.defaults.withCredentials = true;

export async function register(userData) {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
}

export async function login(loginData) {
  const payload = {
    ...loginData,
    deviceInfo: `${navigator.platform}-${navigator.userAgent}`.substring(0, 50),
  };
  const response = await axios.post(`${API_URL}/login`, payload);
  return response.data;
}

export async function logout() {
  const response = await axios.post(`${API_URL}/logout`);
  return response.data;
}

export async function refreshToken() {
  const response = await axios.post(`${API_URL}/refresh`);
  return response.data;
}

export async function getCurrentUser() {
  const response = await axios.get(`${API_URL}/me`);
  return response.data;
}

// Utility functions
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^\d{1,10}$/;
  return phoneRegex.test(phoneNumber);
}

export function formatPhoneForLogin(areaCode, phoneNumber) {
  return `${areaCode}-${phoneNumber}`;
}
