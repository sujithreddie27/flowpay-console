import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the payment schema validation directly
const paymentSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(1_000_000, 'Amount cannot exceed 1,000,000'),
  currency: z.string().min(1, 'Currency is required'),
  method: z.enum(['card', 'bank_transfer', 'wallet', 'upi'] as const, {
    errorMap: () => ({ message: 'Payment method is required' }),
  }),
  accountId: z.string().min(1, 'Source account is required'),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
});

describe('Payment Form Validation', () => {
  it('passes with valid complete data', () => {
    const validData = {
      recipientId: 'rec-1',
      recipientName: 'Jane Smith',
      amount: 5000,
      currency: 'INR',
      method: 'bank_transfer' as const,
      accountId: 'acc-1',
      description: 'Test payment',
    };

    const result = paymentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('passes without optional description', () => {
    const validData = {
      recipientId: 'rec-1',
      recipientName: 'Jane Smith',
      amount: 1000,
      currency: 'USD',
      method: 'card' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('fails when recipientId is empty', () => {
    const invalidData = {
      recipientId: '',
      recipientName: 'Jane',
      amount: 1000,
      currency: 'INR',
      method: 'card' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.recipientId).toContain('Recipient is required');
    }
  });

  it('fails when amount is zero', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 0,
      currency: 'INR',
      method: 'bank_transfer' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.amount).toContain('Amount must be greater than 0');
    }
  });

  it('fails when amount is negative', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: -500,
      currency: 'INR',
      method: 'wallet' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.amount).toContain('Amount must be greater than 0');
    }
  });

  it('fails when amount exceeds 1,000,000', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1_000_001,
      currency: 'INR',
      method: 'upi' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.amount).toContain('Amount cannot exceed 1,000,000');
    }
  });

  it('fails when amount is not a number', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 'not-a-number',
      currency: 'INR',
      method: 'card' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.amount).toContain('Amount is required');
    }
  });

  it('fails when currency is empty', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1000,
      currency: '',
      method: 'card' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.currency).toContain('Currency is required');
    }
  });

  it('fails when method is invalid', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1000,
      currency: 'INR',
      method: 'invalid_method',
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.method).toContain('Payment method is required');
    }
  });

  it('fails when source account is empty', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1000,
      currency: 'INR',
      method: 'card' as const,
      accountId: '',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.accountId).toContain('Source account is required');
    }
  });

  it('fails when description exceeds 200 characters', () => {
    const invalidData = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1000,
      currency: 'INR',
      method: 'bank_transfer' as const,
      accountId: 'acc-1',
      description: 'A'.repeat(201),
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.description).toContain('Description cannot exceed 200 characters');
    }
  });

  it('accepts all valid payment methods', () => {
    const methods = ['card', 'bank_transfer', 'wallet', 'upi'] as const;

    for (const method of methods) {
      const data = {
        recipientId: 'rec-1',
        recipientName: 'Jane',
        amount: 1000,
        currency: 'INR',
        method,
        accountId: 'acc-1',
      };

      const result = paymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });

  it('accepts boundary amount of exactly 1,000,000', () => {
    const data = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 1_000_000,
      currency: 'INR',
      method: 'card' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts minimum positive amount', () => {
    const data = {
      recipientId: 'rec-1',
      recipientName: 'Jane',
      amount: 0.01,
      currency: 'INR',
      method: 'upi' as const,
      accountId: 'acc-1',
    };

    const result = paymentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('reports multiple validation errors simultaneously', () => {
    const invalidData = {
      recipientId: '',
      recipientName: '',
      amount: -1,
      currency: '',
      method: 'invalid',
      accountId: '',
    };

    const result = paymentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(Object.keys(errors).length).toBeGreaterThanOrEqual(5);
    }
  });
});
