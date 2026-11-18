import { http, unwrap } from './client';

export const listUsers = () => http.get('/admin/users').then(unwrap);
export const inviteUser = (body) => http.post('/admin/users', body).then(unwrap);
export const resendInvite = (id) => http.post(`/admin/users/${id}/resend-invite`).then(unwrap);
export const setUserActive = (id, active) => http.patch(`/admin/users/${id}`, { active }).then(unwrap);
