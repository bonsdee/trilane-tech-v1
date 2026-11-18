import { http, unwrap } from './client';

export const getSite = () => http.get('/public/site').then(unwrap);

export const getPilotSettings = () => http.get('/admin/settings/pilot').then(unwrap);
export const updatePilotSettings = (body) => http.put('/admin/settings/pilot', body).then(unwrap);
