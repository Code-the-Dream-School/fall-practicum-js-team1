/*
Test format (depending on test type):
  - models, utils, etc.: `import { describe, it, expect } from '@jest/globals';`
  - controllers: `import request from 'supertest';`
*/

import { test, expect } from '@jest/globals';
import dotenv from 'dotenv';

import example from './example.js';

dotenv.config();

test('this is just an example', () => {
  expect(example()).toBe(true);
});
