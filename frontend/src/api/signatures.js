import { http, unwrap } from './client';

export const getSignaturePage = () => http.get('/admin/email-signatures').then(unwrap);
