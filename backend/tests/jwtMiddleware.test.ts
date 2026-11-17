import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const findUnique = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.unstable_mockModule('../src/config/db.prisma.js', () => ({
  prisma: {
    user: {
      findUnique,
    },
  },
}));

const { requireAuth, requireCsrf, requireAdmin, optionalAuth, jwtMiddleware } =
  await import('../src/middleware/jwtMiddleware.js');

const { errorHandler } = await import('../src/middleware/errorHandler.js');

const app = express();

app.use(cookieParser());

app.get('/auth', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/csrf', requireAuth, requireCsrf, (_req, res) => {
  res.json({ success: true });
});

app.get('/admin', requireAuth, requireAdmin, (_req, res) => {
  res.json({ success: true });
});

app.get('/optional', optionalAuth, (req, res) => {
  res.json({ success: true, user: req.user ?? null });
});

app.post('/legacy', jwtMiddleware, (_req, res) => {
  res.json({ success: true });
});

app.use(errorHandler);

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  deactivatedAt: null,
};

const csrfToken = 'test-csrf-token';

const makeCookie = () => {
  const token = jwt.sign({ id: user.id, csrfToken }, process.env.JWT_SECRET!);

  return `jwt=${token}`;
};

const originalSecret = process.env.JWT_SECRET;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
});

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

beforeEach(() => {
  findUnique.mockReset();
  findUnique.mockResolvedValue(user);
});

describe('JIRA-59 authentication middleware', () => {
  test('requireAuth returns 401 without a cookie', async () => {
    const response = await request(app).get('/auth');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Please sign in');
  });

  test('requireAuth loads the authenticated user', async () => {
    const response = await request(app)
      .get('/auth')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
  });

  test('requireAuth rejects deactivated users', async () => {
    findUnique.mockResolvedValue({
      ...user,
      deactivatedAt: new Date(),
    });

    const response = await request(app)
      .get('/auth')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(401);
  });

  test('requireCsrf rejects a missing CSRF header', async () => {
    const response = await request(app)
      .post('/csrf')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(403);
  });

  test('requireCsrf accepts a matching CSRF header', async () => {
    const response = await request(app)
      .post('/csrf')
      .set('Cookie', makeCookie())
      .set('X-CSRF-TOKEN', csrfToken);

    expect(response.status).toBe(200);
  });

  test('requireAdmin rejects a regular user', async () => {
    const response = await request(app)
      .get('/admin')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(403);
  });

  test('requireAdmin accepts an admin', async () => {
    findUnique.mockResolvedValue({
      ...user,
      role: 'admin',
    });

    const response = await request(app)
      .get('/admin')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(200);
  });

  test('optionalAuth allows anonymous requests', async () => {
    const response = await request(app).get('/optional');

    expect(response.status).toBe(200);
    expect(response.body.user).toBeNull();
  });

  test('optionalAuth loads a valid signed-in user', async () => {
    const response = await request(app)
      .get('/optional')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
  });

  test('jwtMiddleware preserves CSRF protection', async () => {
    const response = await request(app)
      .post('/legacy')
      .set('Cookie', makeCookie());

    expect(response.status).toBe(403);
  });
});
