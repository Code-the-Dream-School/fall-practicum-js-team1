
import type { UserRole } from '../generated/prisma/client.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        deactivatedAt: Date | null;
      };

      authCsrfToken?: string;
    }
  }
}

export {};
