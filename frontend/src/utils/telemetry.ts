// frontend/src/utils/telemetry.ts
import { BACKEND_URL } from '../config';

export type TelemetryPoint = {
  company_id: number;
  roster_shift_assignment_id: number;
  location_lat: number;
  location_long: number;
  accuracy_m?: number | null;
  speed_mps?: number | null;
  heading_deg?: number | null;
  altitude_m?: number | null;
  provider?: string | null;
  battery_pct?: number | null;
  is_mock?: boolean;
};

type StartOptions = {
  companyId: number;
  assignmentId: number;
  token?: string;
  postIntervalMs?: number;
  highAccuracy?: boolean;
  onStatus?: (msg: string) => void;
  onError?: (msg: string) => void;
};

function toPayload(companyId: number, assignmentId: number, c: GeolocationCoordinates): TelemetryPoint {
  return {
    company_id: companyId,
    roster_shift_assignment_id: assignmentId,
    location_lat: c.latitude,
    location_long: c.longitude,
    accuracy_m: Number.isFinite(c.accuracy) ? Number(c.accuracy) : null,
    speed_mps: Number.isFinite(c.speed as number) ? Number(c.speed) : null,
    heading_deg: Number.isFinite(c.heading as number) ? Number(c.heading) : null,
    altitude_m: Number.isFinite(c.altitude as number) ? Number(c.altitude) : null,
    provider: 'web_pwa',
    battery_pct: null,
    is_mock: false,
  };
}

async function postPoint(payload: TelemetryPoint, token?: string) {
  await fetch(`${BACKEND_URL}/api/tracking/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

function oncePosition(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

function geoErrorText(e: any): string {
  const code = e?.code;
  if (code === 1) return 'Permission denied: allow location access for this site.';
  if (code === 2) return 'Location unavailable: move near a window or enable Wi-Fi.';
  if (code === 3) return 'Location timeout: retry or allow cached (low-accuracy) location.';
  return e?.message || 'Unknown location error.';
}

export class TelemetryClient {
  private watchId: number | null = null;
  private lastPostTs = 0;

  stop() {
    if (this.watchId != null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async start(opts: StartOptions) {
    const {
      companyId,
      assignmentId,
      token,
      postIntervalMs = 10_000,
      highAccuracy = true,
      onStatus,
      onError,
    } = opts;

    if (!('geolocation' in navigator)) {
      onError?.('Geolocation is not supported by this browser.');
      return;
    }

    // Check permission (best-effort)
    try {
      // @ts-ignore
      const perm = await navigator.permissions?.query?.({ name: 'geolocation' });
      if (perm?.state === 'denied') {
        onError?.('Location access is denied. Please enable it in browser settings.');
        return;
      } else if (perm?.state) {
        onStatus?.(`Permission: ${perm.state}`);
      }
    } catch { /* ignore */ }

    // One-shot initial fix
    try {
      onStatus?.('Getting location…');
      const pos = await oncePosition({ enableHighAccuracy: true, timeout: 30000 });
      await postPoint(toPayload(companyId, assignmentId, pos.coords), token);
      onStatus?.('Initial location acquired.');
    } catch (e: any) {
      if (e.code === e.PERMISSION_DENIED) {
        onError?.('Permission denied. Please allow location and try again.');
        return;
      } else if (e.code === e.POSITION_UNAVAILABLE || e.code === e.TIMEOUT) {
        onStatus?.('High accuracy unavailable, trying fallback…');
        try {
          const pos2 = await oncePosition({ enableHighAccuracy: false, maximumAge: 120000, timeout: 40000 });
          await postPoint(toPayload(companyId, assignmentId, pos2.coords), token);
          onStatus?.('Fallback fix acquired.');
        } catch (e2: any) {
          onError?.(`Fallback failed: ${geoErrorText(e2)}`);
        }
      } else {
        onError?.(geoErrorText(e));
      }
    }

    // Continuous watch
    const startWatch = (relaxed: boolean) => {
      this.stop();
      onStatus?.(`Starting ${relaxed ? 'relaxed' : 'high accuracy'} tracking…`);
      this.watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const now = Date.now();
          if (now - this.lastPostTs < postIntervalMs) return;
          try {
            await postPoint(toPayload(companyId, assignmentId, pos.coords), token);
            this.lastPostTs = now;
            onStatus?.(`Position sent (${new Date().toLocaleTimeString()})`);
          } catch (err) {
            console.warn('Telemetry post failed:', err);
          }
        },
        (err) => {
          if ((err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) && !relaxed) {
            onStatus?.('Retrying with relaxed tracking…');
            startWatch(true);
          } else {
            onError?.(geoErrorText(err));
          }
        },
        relaxed
          ? { enableHighAccuracy: false, maximumAge: 60000, timeout: 40000 }
          : { enableHighAccuracy: true, maximumAge: 5000, timeout: 25000 }
      );
    };

    startWatch(false);
  }
}

/** ─────────────────────────────────────────────────────────────
 *  Helpers used by Trail.tsx
 *  Return shapes match your component usage.
 *  ───────────────────────────────────────────────────────────── */
export async function fetchLatest(assignmentId: number, token?: string) {
  const res = await fetch(`${BACKEND_URL}/api/tracking/latest/${assignmentId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 404) {
    return { ok: true, data: null as any };
  }
  if (!res.ok) throw new Error(`Latest fetch failed: ${res.status}`);
  return res.json(); // { ok:true, data:null|{...} }
}

export async function fetchTrail(
  assignmentId: number,
  sinceISO?: string,
  limit = 200,
  token?: string
) {
  const url = new URL(`${BACKEND_URL}/api/tracking/trail/${assignmentId}`);
  if (sinceISO) url.searchParams.set('since', sinceISO);
  if (limit) url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 404) {
    return { ok: true, data: [] as any[] };
  }
  if (!res.ok) throw new Error(`Trail fetch failed: ${res.status}`);
  return res.json(); // { ok:true, data:[...] }
}
