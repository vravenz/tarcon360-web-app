// frontend/src/utils/bookOnOff.ts
import { BACKEND_URL } from '../config';

type ApiResp<T=any> = { ok: boolean; data?: T; error?: string };

async function postPhoto(
  path: string,
  photo: Blob,
  token?: string,
  userId?: number
): Promise<ApiResp> {
  const form = new FormData();
  form.append('photo', photo, `book-${Date.now()}.jpg`);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (userId != null) headers['x-user-id'] = String(userId);

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers,
    body: form,
  });

  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (ct.includes('application/json')) {
      const j = await res.json().catch(() => null);
      msg = j?.error || j?.message || msg;
    } else {
      const t = await res.text().catch(() => '');
      if (t) msg = t;
    }
    throw new Error(msg);
  }

  if (ct.includes('application/json')) return res.json();
  return { ok: true };
}

export async function bookOn(
  assignmentId: number,
  photo: Blob,
  token?: string,
  userId?: number
) {
  return postPhoto(`/api/tracking/book-on/${assignmentId}`, photo, token, userId);
}

export async function bookOff(
  assignmentId: number,
  photo: Blob,
  token?: string,
  userId?: number
) {
  return postPhoto(`/api/tracking/book-off/${assignmentId}`, photo, token, userId);
}
