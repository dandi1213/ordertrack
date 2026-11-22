import { createHash, createHmac, randomBytes } from 'crypto';

/**
 * Token publik tidak disimpan mentah di database.
 * Token diturunkan secara deterministik dari order id + kunci server, sehingga
 * tautan tetap bisa ditampilkan kembali tanpa menyimpan token mentah.
 */
export function deriveTrackingToken(orderId: string): string {
  const secret = process.env.TRACKING_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('TRACKING_TOKEN_SECRET is not configured.');
  return createHmac('sha256', secret).update(orderId).digest('hex');
}

export function hashTrackingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateTokenSalt(): string {
  return randomBytes(16).toString('hex');
}
