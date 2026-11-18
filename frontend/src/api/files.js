import { http, unwrap } from './client';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  return http.post('/admin/files', form).then(unwrap);
}
