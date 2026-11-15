import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;
const SEPARATOR = ':';
const ENCODING = 'base64';

const getKey = (): Buffer => {
  const hex = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!hex) {
    throw new Error('MESSAGE_ENCRYPTION_KEY is not set');
  }

  const key = Buffer.from(hex, 'hex');

  if (key.length !== KEY_BYTES) {
    throw new Error('MESSAGE_ENCRYPTION_KEY must be 64 hex characters');
  }

  return key;
};

export const encryptMessage = (plainText: string): string => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted]
    .map((part) => part.toString(ENCODING))
    .join(SEPARATOR);
};

export const decryptMessage = (stored: string): string => {
  const [iv, authTag, encrypted] = stored
    .split(SEPARATOR)
    .map((part) => Buffer.from(part, ENCODING));

  if (!iv || !authTag || !encrypted) {
    throw new Error('Stored message is not in the expected format');
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
};
