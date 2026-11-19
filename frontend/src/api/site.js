import { http, unwrap } from './client';

export const getSite = () => http.get('/public/site').then(unwrap);

export const getPilotSettings = () => http.get('/admin/settings/pilot').then(unwrap);
export const updatePilotSettings = (body) => http.put('/admin/settings/pilot', body).then(unwrap);

export const getBookingSettings = () => http.get('/admin/settings/booking').then(unwrap);
export const updateBookingSettings = (body) => http.put('/admin/settings/booking', body).then(unwrap);
