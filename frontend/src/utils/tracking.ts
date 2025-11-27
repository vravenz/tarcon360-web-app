import axios from 'axios';
import { BACKEND_URL } from '../config';

type CommonHeaders = {
  Authorization?: string;
  'x-user-id'?: string;
};

const headers = (userId?: number): CommonHeaders => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  ...(userId ? { 'x-user-id': String(userId) } : {}),
});

/** PUT /api/tracking/eta/:assignmentId  body: { eta: number|null }  */
export async function setETA(assignmentId: number, eta: number | null, userId?: number) {
  const url = `${BACKEND_URL}/api/tracking/eta/${assignmentId}`;
  return axios.put(url, { eta }, { headers: headers(userId) });
}

/** POST /api/tracking/confirmations
 * body: { assignment_id, type: 'shift_created'|'24h'|'2h', response: 'accept'|'decline', notes? }
 */
export async function sendReminderConfirmation(
  assignment_id: number,
  type: 'shift_created' | '24h' | '2h',
  response: 'accept' | 'decline',
  userId?: number,
  notes?: string
) {
  const url = `${BACKEND_URL}/api/tracking/confirmations`;
  return axios.post(
    url,
    { assignment_id, type, response, notes },
    { headers: headers(userId) }
  );
}
