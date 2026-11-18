import { http, unwrap } from './client';

export const getSummary = () => http.get('/admin/dashboard/summary').then(unwrap);
