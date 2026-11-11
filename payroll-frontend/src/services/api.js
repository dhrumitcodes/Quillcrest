import axios from 'axios';

// VITE_API_BASE_URL is the backend origin (for example,
// https://ai-payroll-backend.onrender.com). Keep /api in one place
// so pages and the shared Axios client use the same production host.
const backendOrigin = (import.meta.env.VITE_API_BASE_URL || 'https://ai-payroll-backend.onrender.com').replace(/\/$/, '');

const API = axios.create({
    baseURL: `${backendOrigin}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getEmployees = () => API.get('/employees');
export const getPayroll = () => API.get('/payroll');

export default API;
