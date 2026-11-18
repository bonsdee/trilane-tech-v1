import { http, unwrap } from './client';

export const getPublicPortfolio = () => http.get('/public/portfolio').then(unwrap);
export const getPublicProject = (slug) => http.get(`/public/portfolio/${encodeURIComponent(slug)}`).then(unwrap);

export const listProjects = () => http.get('/admin/portfolio').then(unwrap);
export const getProject = (id) => http.get(`/admin/portfolio/${id}`).then(unwrap);
export const createProject = (body) => http.post('/admin/portfolio', body).then(unwrap);
export const updateProject = (id, body) => http.put(`/admin/portfolio/${id}`, body).then(unwrap);
export const deleteProject = (id) => http.delete(`/admin/portfolio/${id}`);
