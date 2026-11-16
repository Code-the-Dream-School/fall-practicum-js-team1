import { describe, test, expect, beforeEach } from '@jest/globals';
import { encryptMessage, decryptMessage } from '../src/utils/messageCrypto.js';

const TEST_KEY = 'ab'.repeat(32);

describe('messageCrypto', () => {
  beforeEach(() => {
    process.env.MESSAGE_ENCRYPTION_KEY = TEST_KEY;
  });

  test('decrypting gives back the original text', () => {
    const text = 'Is the stroller still available?';
    expect(decryptMessage(encryptMessage(text))).toBe(text);
  });

  test('handles emoji and non-English text', () => {
    const text = 'Hola, ¿sigue disponible? 👶';
    expect(decryptMessage(encryptMessage(text))).toBe(text);
  });

  test('the stored text does not contain the message', () => {
    expect(encryptMessage('secret pickup spot')).not.toContain('secret');
  });

  test('the same text encrypts differently each time (random IV)', () => {
    expect(encryptMessage('Hello')).not.toBe(encryptMessage('Hello'));
  });

  test('throws when the stored text was changed', () => {
    const [iv, tag, data] = encryptMessage('Hello').split(':');
    const flipped = data?.startsWith('A')
      ? `B${data.slice(1)}`
      : `A${data?.slice(1)}`;
    expect(() => decryptMessage(`${iv}:${tag}:${flipped}`)).toThrow();
  });

  test('throws when decrypting with a different key', () => {
    const stored = encryptMessage('Hello');
    process.env.MESSAGE_ENCRYPTION_KEY = 'cd'.repeat(32);
    expect(() => decryptMessage(stored)).toThrow();
  });

  test('throws when the key is missing', () => {
    delete process.env.MESSAGE_ENCRYPTION_KEY;
    expect(() => encryptMessage('Hello')).toThrow('not set');
  });

  test('throws when the key is the wrong length', () => {
    process.env.MESSAGE_ENCRYPTION_KEY = 'abcd';
    expect(() => encryptMessage('Hello')).toThrow('64 hex');
  });

  test('throws on text that is not in the stored format', () => {
    expect(() => decryptMessage('not encrypted')).toThrow();
  });
});
