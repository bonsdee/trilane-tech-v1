import { http, unwrap } from './client';

export const getPublicServices = () => http.get('/public/services').then(unwrap);

export const listServices = () => http.get('/admin/services').then(unwrap);
export const getService = (id) => http.get(`/admin/services/${id}`).then(unwrap);
export const createService = (body) => http.post('/admin/services', body).then(unwrap);
export const updateService = (id, body) => http.put(`/admin/services/${id}`, body).then(unwrap);
export const deleteService = (id) => http.delete(`/admin/services/${id}`);
