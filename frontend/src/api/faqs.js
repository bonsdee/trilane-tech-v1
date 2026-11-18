import { http, unwrap } from './client';

export const getPublicFaqs = () => http.get('/public/faqs').then(unwrap);

export const listFaqs = () => http.get('/admin/faqs').then(unwrap);
export const createFaq = (body) => http.post('/admin/faqs', body).then(unwrap);
export const updateFaq = (id, body) => http.put(`/admin/faqs/${id}`, body).then(unwrap);
export const deleteFaq = (id) => http.delete(`/admin/faqs/${id}`);
