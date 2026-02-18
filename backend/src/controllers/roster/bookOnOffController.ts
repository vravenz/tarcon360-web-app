// backend/src/controllers/roster/bookOnOffController.ts
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import pool from '../../config/database';

const UPLOAD_DIR =
  process.env.BOOK_PHOTO_DIR ||
  path.resolve(process.cwd(), 'src', 'uploads', 'book_photos');


async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
ensureUploadDir().catch((e) => console.error('Failed to ensure upload directory:', e));

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `photo-${stamp}-${rand}${ext}`);
  },
});

export const uploadBookPhoto: RequestHandler = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(
      file.mimetype.toLowerCase()
    );
    cb(null, ok);
  },
}).single('photo');

type EventType = 'book_on' | 'book_off';

function parseAssignmentId(req: Request): number | null {
  const n = Number(req.params.assignmentId);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function getCompanyId(assignmentId: number): Promise<number> {
  const sql = `
    SELECT company_id
    FROM roster_shift_assignments
    WHERE roster_shift_assignment_id = $1
    LIMIT 1
  `;
  const { rows } = await pool.query<{ company_id: number }>(sql, [assignmentId]);
  if (!rows[0]?.company_id) throw new Error('Assignment not found or missing company_id');
  return rows[0].company_id;
}

async function insertTimeLog(opts: {
  companyId: number;
  assignmentId: number;
  eventType: EventType;
  filename: string | null;
  eventTime?: Date;
  userId?: number;
}) {
  const { companyId, assignmentId, eventType, filename, eventTime, userId } = opts;

  const sql = `
    INSERT INTO roster_shift_time_logs
      (company_id, roster_shift_assignment_id, event_type, event_time, event_notes, media_path, meta_json)
    VALUES
      ($1, $2, $3, COALESCE($4, NOW()), $5, $6, $7)
    RETURNING log_id
  `;
  const meta = userId ? { by_user_id: userId, source: 'web_pwa' } : { source: 'web_pwa' };
  const params = [
    companyId,
    assignmentId,
    eventType,
    eventTime ?? null,
    filename ?? null,
    filename ?? null,
    JSON.stringify(meta),
  ];
  const { rows } = await pool.query<{ log_id: number }>(sql, params);
  return rows[0]?.log_id;
}

async function updateAssignmentBookFields(opts: {
  assignmentId: number;
  eventType: EventType;
  filename: string | null;
}) {
  const { assignmentId, eventType, filename } = opts;
  if (eventType === 'book_on') {
    await pool.query(
      `UPDATE roster_shift_assignments
       SET book_on_photo = $1, book_on_at = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE roster_shift_assignment_id = $2`,
      [filename ?? null, assignmentId]
    );
  } else {
    await pool.query(
      `UPDATE roster_shift_assignments
       SET book_off_photo = $1, book_off_at = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE roster_shift_assignment_id = $2`,
      [filename ?? null, assignmentId]
    );
  }
}

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

async function handleBook(
  req: Request,
  res: Response,
  _next: NextFunction,
  eventType: EventType
): Promise<void> {
  const assignmentId = parseAssignmentId(req);
  if (!assignmentId) {
    res.status(400).json({ ok: false, error: 'Invalid assignmentId' });
    return;
  }

  // Ensure eventType is allowed in your CHECK constraint (see migration below)
  const companyId = await getCompanyId(assignmentId);
  const filename = (req as any).file?.filename ?? null;
  const userId = (req as any).userId as number | undefined;

  const logId = await insertTimeLog({
    companyId,
    assignmentId,
    eventType,
    filename,
    userId,
  });

  await updateAssignmentBookFields({ assignmentId, eventType, filename });

  res.json({
    ok: true,
    data: {
      log_id: logId,
      assignment_id: assignmentId,
      company_id: companyId,
      event_type: eventType,
      photo: filename,
    },
  });
}

export const bookOnController: RequestHandler = asyncHandler(async (req, res, next) => {
  await handleBook(req, res, next, 'book_on');
});

export const bookOffController: RequestHandler = asyncHandler(async (req, res, next) => {
  await handleBook(req, res, next, 'book_off');
});
