import React from 'react';
import Card from '../Card';
import Button from '../Button';
import { bookOn, bookOff } from '../../utils/bookOnOff';

type Props = {
  assignmentId: number;
  token?: string;
  userId?: number;
};

const BookOnOff: React.FC<Props> = ({ assignmentId, token, userId }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [usingFallback, setUsingFallback] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = React.useState<Blob | null>(null);
  const [busy, setBusy] = React.useState<'on' | 'off' | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const stopCamera = React.useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  // Start front camera
  const startCamera = React.useCallback(async () => {
    setErr(null);
    setMsg(null);
    setUsingFallback(false);

    // Stop any previous
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    // Secure-context + feature detection
    const isSecure =
      typeof window !== 'undefined' &&
      (window.isSecureContext || window.location.protocol === 'https:');
    const hasMedia =
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      typeof navigator.mediaDevices.getUserMedia === 'function';

    if (!isSecure || !hasMedia) {
      setUsingFallback(true);
      setErr(
        !isSecure
          ? 'Camera requires HTTPS (or localhost). Using fallback capture.'
          : 'Live camera not supported in this browser. Using fallback capture.'
      );
      return;
    }

    try {
      // Prefer front camera; width/height hints are optional
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' }, // "user" = front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setStream(s);
    } catch (e: any) {
      // Fall back to input capture on iOS/permission denied
      setUsingFallback(true);
      setErr(
        e?.name === 'NotAllowedError' || String(e?.message || '').includes('Permission')
          ? 'Camera permission denied. Use the “Take Photo (fallback)” button below.'
          : 'Cannot access camera. Using fallback capture.'
      );
    }
  }, [stream]);

  // Attach stream to video
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream) {
      v.srcObject = stream;
      v.play().catch(() => void 0);
    } else {
      v.srcObject = null;
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [stream]);

  // Init on mount
  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Capture a frame to canvas → blob
  const takePhoto = async () => {
    setErr(null);
    setMsg(null);
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErr('Canvas context not available.');
      return;
    }
    // Mirror front camera so the preview looks natural
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
    );
    if (!blob) {
      setErr('Failed to capture photo.');
      return;
    }

    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(blob);
    setPhotoUrl(url);
    setPhotoBlob(blob);
  };

  // Fallback file input (mobile: capture="user" )
  const onPickFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null);
    setMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure it’s an image
    if (!file.type.startsWith('image/')) {
      setErr('Please take a photo (image only).');
      return;
    }

    if (photoUrl) URL.revokeObjectURL(photoUrl);
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setPhotoBlob(file);
    e.target.value = '';
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
    setMsg(null);
    setErr(null);
  };

  const submit = async (type: 'on' | 'off') => {
    if (!photoBlob) {
      setErr('Please capture a live photo first.');
      return;
    }
    try {
      setBusy(type);
      setErr(null);
      setMsg(null);
      if (type === 'on') {
        await bookOn(assignmentId, photoBlob, token, userId);
        setMsg('Book ON recorded.');
      } else {
        await bookOff(assignmentId, photoBlob, token, userId);
        setMsg('Book OFF recorded.');
      }
      // keep the photo preview as proof; you can clear it if you prefer:
      // clearPhoto();
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <h3 className="font-semibold text-lg">Book On / Book Off (Live Photo)</h3>
      <p className="text-xs text-gray-500">
        Live front camera is required. On iOS or restricted browsers, use the fallback capture button.
      </p>

      {/* Live preview */}
      {!usingFallback && (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="rounded overflow-hidden bg-black max-w-full">
            <video
              ref={videoRef}
              className="w-full max-w-md"
              playsInline
              muted
              autoPlay
              style={{ transform: 'scaleX(-1)' }} // mirror for front camera
            />
          </div>
          <div className="flex flex-col gap-2">
            {/* Use only allowed icons */}
            <Button onClick={takePhoto} icon="view">
              Take Photo (Front)
            </Button>
            <Button variant="outline" onClick={startCamera} icon="undo">
              Restart Camera
            </Button>
            <Button variant="outline" onClick={stopCamera} icon="cancel">
              Stop Camera
            </Button>
          </div>
        </div>
      )}

      {/* Fallback */}
      {usingFallback && (
        <div className="space-y-2">
          <p className="text-sm">Fallback capture (opens front camera on most phones):</p>
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              capture="user"          // <— hints front/selfie camera on mobile
              onChange={onPickFallback}
              className="hidden"
            />
            <span className="inline-flex">
              <Button icon="view">Take Photo (Fallback)</Button>
            </span>
          </label>
        </div>
      )}

      {/* Captured photo */}
      <div className="flex flex-col md:flex-row items-start gap-3">
        <div className="border rounded p-2 min-w-[220px] min-h-[140px] flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Captured"
              className="max-w-full max-h-64 rounded"
              style={{ transform: 'scaleX(-1)' }} // keep mirrored look
            />
          ) : (
            <span className="text-sm text-gray-500">No photo captured yet.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => submit('on')}
            disabled={!photoBlob || !!busy}
            icon="tick"
          >
            {busy === 'on' ? 'Booking On…' : 'Book ON'}
          </Button>
          <Button
            onClick={() => submit('off')}
            disabled={!photoBlob || !!busy}
            icon="tick"
          >
            {busy === 'off' ? 'Booking Off…' : 'Book OFF'}
          </Button>
          <Button onClick={clearPhoto} variant="outline" icon="undo">
            Retake / Clear
          </Button>
        </div>
      </div>

      {msg && <p className="text-green-600 text-sm">{msg}</p>}
      {err && <p className="text-red-600 text-sm">{err}</p>}

      {/* hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
};

export default BookOnOff;
