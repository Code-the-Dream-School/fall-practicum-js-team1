import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { getUploadSignature } from '../src/controllers/upload.controller.js';

const envKeys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

const originalEnv = Object.fromEntries(
  envKeys.map((key) => [key, process.env[key]]),
);

function makeResponse() {
  const body = jest.fn();
  const setHeader = jest.fn();
  const status = jest.fn().mockReturnValue({ json: body });

  const res = { setHeader, status } as unknown as Response;

  return { res, body, setHeader, status };
}

describe('getUploadSignature', () => {
  beforeEach(() => {
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    jest
      .spyOn(cloudinary.utils, 'api_sign_request')
      .mockReturnValue('mock-signature');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();

    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  test('signs the timestamp, fixed folder, and allowed formats', async () => {
    const { res } = makeResponse();

    await getUploadSignature({} as Request, res);

    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledTimes(1);
    expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
      {
        timestamp: 1767225600,
        folder: 'hand-me-down/items',
        allowed_formats: 'jpg,png,webp',
      },
      'test-secret',
    );
  });

  test('returns upload fields without exposing the API secret', async () => {
    const { res, body, status, setHeader } = makeResponse();

    await getUploadSignature({} as Request, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(body).toHaveBeenCalledWith({
      success: true,
      data: {
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        timestamp: 1767225600,
        folder: 'hand-me-down/items',
        allowedFormats: 'jpg,png,webp',
        signature: 'mock-signature',
      },
    });
    expect(JSON.stringify(body.mock.calls)).not.toContain('test-secret');
  });

  test.each(envKeys)('returns 503 when %s is missing', async (key) => {
    delete process.env[key];
    const { res, body } = makeResponse();

    await expect(getUploadSignature({} as Request, res)).rejects.toMatchObject({
      status: 503,
      message: 'Photo uploads are not configured.',
    });

    expect(cloudinary.utils.api_sign_request).not.toHaveBeenCalled();
    expect(body).not.toHaveBeenCalled();
  });
});
