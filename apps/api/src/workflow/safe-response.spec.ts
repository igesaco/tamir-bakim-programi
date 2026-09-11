import { beforeAll, describe, expect, it } from '@jest/globals';
import { safeResponse } from './safe-response.interceptor';

describe('safe API projection', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-media-secret-at-least-thirty-two-chars';
  });

  it('removes secrets recursively', () => {
    const result = safeResponse({
      assignedTechnician: { id: 'u1', firstName: 'Ali', passwordHash: 'secret' },
      children: [{ tokenHash: 'secret', value: 1 }],
    });
    expect(result.assignedTechnician).toEqual({ id: 'u1', firstName: 'Ali' });
    expect(result.children).toEqual([{ value: 1 }]);
  });

  it('hides internal notes and replaces raw storage keys for customers', () => {
    const result = safeResponse(
      { id: 'm1', fileName: 'photo.jpg', storageKey: 'db/org/private', internalNote: 'office only' },
      { organizationId: 'org', customerId: 'c1' },
    );
    expect(result.internalNote).toBeUndefined();
    expect(result.storageKey).not.toContain('db/org/private');
    expect(result.storageKey).toContain('media/content/m1?access=');
  });
});
