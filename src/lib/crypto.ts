import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
  const source = process.env.ENCRYPTION_KEY;
  if (source && /^[a-f0-9]{64}$/i.test(source)) {
    return Buffer.from(source, 'hex');
  }
  return crypto.createHash('sha256').update('quit-codex-local-dev-key').digest();
}

export function encryptPhone(phone: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptPhone(encoded: string) {
  const data = Buffer.from(encoded, 'base64');
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function hashPhone(phone: string) {
  return crypto.createHash('sha256').update(`${phone}:${getKey().toString('hex')}`).digest('hex');
}

export function hashIp(ip: string) {
  return crypto.createHash('sha256').update(`${ip}:${getKey().toString('hex')}`).digest('hex');
}
