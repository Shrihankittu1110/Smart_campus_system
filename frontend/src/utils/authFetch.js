import { apiUrl } from './apiUrl';

export const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    return fetch(apiUrl(url), {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
};
