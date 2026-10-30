import { describe, test, expect } from '@jest/globals';
import dotenv from 'dotenv';

import example from './example.js';

dotenv.config();

describe('this is an example describe block', () => {
  test('this is just an example', () => {
    expect(example()).toBe(true);
  });
});
