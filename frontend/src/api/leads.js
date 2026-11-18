import { http, unwrap } from './client';

export const submitLead = (body) => http.post('/public/leads', body).then(unwrap);

/** Drops empty filter values so they are not sent. */
function clean(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false));
}

export const listLeads = (params) =>
  http.get('/admin/leads', { params: clean(params) }).then((res) => res.data);
export const getLead = (id) => http.get(`/admin/leads/${id}`).then(unwrap);
export const updateLead = (id, changes) => http.patch(`/admin/leads/${id}`, changes).then(unwrap);
export const deleteLead = (id) => http.delete(`/admin/leads/${id}`);
export const listNotes = (id) => http.get(`/admin/leads/${id}/notes`).then(unwrap);
export const addNote = (id, body) => http.post(`/admin/leads/${id}/notes`, { body }).then(unwrap);
export const deleteNote = (id, noteId) => http.delete(`/admin/leads/${id}/notes/${noteId}`);

/** Downloads the CSV for the current filter and hands it to the browser. */
export async function exportLeads(params) {
  const res = await http.get('/admin/leads/export', { params: clean(params), responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : 'trilane-leads.csv';
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
