import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateContactMessageDto } from './create-contact-message.dto';

describe('CreateContactMessageDto', () => {
  const validPayload = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Airport transfer',
    message: 'Please contact me about an airport transfer.',
    visa_type: 'tourist',
    phone: '+90 555 123 4567',
  };

  it('accepts a valid bounded contact message', async () => {
    const errors = await validate(
      plainToInstance(CreateContactMessageDto, validPayload),
    );
    expect(errors).toEqual([]);
  });

  it.each([
    ['name', 'x'.repeat(201)],
    ['email', `${'a'.repeat(310)}@example.com`],
    ['subject', 'x'.repeat(501)],
    ['message', 'x'.repeat(10001)],
    ['visa_type', 'x'.repeat(101)],
    ['phone', `+${'1'.repeat(50)}`],
  ])('rejects oversized %s', async (field, value) => {
    const dto = plainToInstance(CreateContactMessageDto, {
      ...validPayload,
      [field]: value,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain(field);
  });

  it('normalizes email and phone and rejects malformed phone values', async () => {
    const normalized = plainToInstance(CreateContactMessageDto, {
      ...validPayload,
      email: '  JOHN@EXAMPLE.COM ',
      phone: '  +90 555 123 4567  ',
    });
    expect(normalized.email).toBe('john@example.com');
    expect(normalized.phone).toBe('+90 555 123 4567');

    const invalid = plainToInstance(CreateContactMessageDto, {
      ...validPayload,
      phone: 'call-me-now',
    });
    const errors = await validate(invalid);
    expect(errors.map((error) => error.property)).toContain('phone');
  });
});
