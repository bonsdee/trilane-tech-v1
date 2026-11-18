import { http, unwrap } from './client';

export const getPublicTeam = () => http.get('/public/team').then(unwrap);

export const listTeam = () => http.get('/admin/team').then(unwrap);
export const createTeamMember = (body) => http.post('/admin/team', body).then(unwrap);
export const updateTeamMember = (id, body) => http.put(`/admin/team/${id}`, body).then(unwrap);
export const deleteTeamMember = (id) => http.delete(`/admin/team/${id}`);
