import { describe, expect, it } from 'vitest';
import { ApiError } from './api';

describe('api error handling', () => {
  it('surfaces the backend conflict message when the server rejects duplicate accounts', () => {
    const error = new ApiError('An account with that email or phone already exists.', 409);
    expect(error.message).toContain('account with that email or phone already exists');
    expect(error.status).toBe(409);
  });
});
