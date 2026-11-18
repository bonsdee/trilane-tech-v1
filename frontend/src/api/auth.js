import { http, unwrap } from './client';

export const login = (email, password) => http.post('/auth/login', { email, password }).then(unwrap);
export const logout = () => http.post('/auth/logout');
export const forgotPassword = (email) => http.post('/auth/forgot-password', { email }).then(unwrap);
export const setPassword = (token, password) => http.post('/auth/set-password', { token, password }).then(unwrap);
export const me = () => http.get('/auth/me').then(unwrap);
