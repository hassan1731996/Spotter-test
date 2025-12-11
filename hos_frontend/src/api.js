import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createTrip = async (tripData) => {
  const response = await api.post('/trips/', tripData);
  return response.data;
};

export const getTrip = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/`);
  return response.data;
};

export default api;
