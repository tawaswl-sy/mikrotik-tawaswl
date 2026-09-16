import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Derive a 32-byte key from JWT_SECRET or a fallback encryption secret
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'tawaswl_mikrotik_manager_secure_aes256_key';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plaintext string (e.g. router password)
 * Returns string in format: iv:ciphertext:tag (all hex encoded)
 */
export function encryptText(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt an encrypted string created by encryptText
 */
export function decryptText(cipherBundle: string): string {
  if (!cipherBundle) return '';
  try {
    const parts = cipherBundle.split(':');
    if (parts.length !== 3) {
      // Fallback if plaintext or different format
      return cipherBundle;
    }
    const [ivHex, encryptedHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed, returning empty string', err);
    return '';
  }
}
