import axios from 'axios';

// POTENTIAL ISSUE: Backend usually runs on port 8080 by default for Spring Boot.
// Ensure this BASE_URL matches your backend's actual port.
const BASE_URL = 'http://localhost:8081/api'; // <--- CHECK THIS PORT (8081 vs 8080)

const instance = axios.create({
  baseURL: BASE_URL,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;