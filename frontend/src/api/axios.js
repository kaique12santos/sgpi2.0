import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000, // Tempo limite de 10 segundos
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sgpi_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

export default api;