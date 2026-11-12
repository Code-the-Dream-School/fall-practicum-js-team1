
import { describe, test, expect, beforeEach } from '@jest/globals';
import { createItemSchema } from '../src/validator/item.validator.js';

describe('createItemSchema - Cloudinary photos', () => {
  beforeEach(() => {
    // Use a fake Cloudinary account for testing.
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  });

  const validItem = {
    title: 'Baby stroller',
    description: 'A gently used stroller',
    categoryKey: 'baby',
    condition: 'good',
    addressId: '550e8400-e29b-41d4-a716-446655440000',
    photos: [
      {
        url: 'https://res.cloudinary.com/test-cloud/image/upload/photo.jpg',
        publicId: 'photo',
        altText: 'Baby stroller',
      },
    ],
  };

  test('accepts a valid Cloudinary photo URL', () => {
    const result = createItemSchema.safeParse(validItem);

    expect(result.success).toBe(true);
  });

  test('rejects a URL from another Cloudinary account', () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      photos: [
        {
          ...validItem.photos[0],
          url: 'https://res.cloudinary.com/another-cloud/image/upload/photo.jpg',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test('rejects a URL from another website', () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      photos: [
        {
          ...validItem.photos[0],
          url: 'https://example.com/photo.jpg',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test('rejects a photo with a missing publicId', () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      photos: [
        {
          url: 'https://res.cloudinary.com/test-cloud/image/upload/photo.jpg',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  test('rejects an item with no photos', () => {
    const result = createItemSchema.safeParse({
      ...validItem,
      photos: [],
    });

    expect(result.success).toBe(false);
  });
});
