import { describe, expect, it } from '@jest/globals';
import { assertOpen, assertTransition } from './order-rules';

describe('service order state machine', () => {
  it('allows only the next controlled step', () => {
    expect(() => assertTransition('APPROVED', 'IN_PROGRESS')).not.toThrow();
    expect(() => assertTransition('APPROVED', 'DELIVERED')).toThrow();
    expect(() => assertTransition('QUALITY_CONTROL', 'IN_PROGRESS')).not.toThrow();
  });

  it('keeps delivered and cancelled orders immutable', () => {
    expect(() => assertOpen('DELIVERED')).toThrow();
    expect(() => assertOpen('CANCELLED')).toThrow();
  });
});
