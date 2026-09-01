import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEnquiryDto } from './create-enquiry.dto';

describe('CreateEnquiryDto', () => {
  it('should validate a complete and valid DTO', async () => {
    const payload = {
      name: 'Elena Rostova',
      email: 'elena@example.com',
      phone: '+905551234567',
      subject: 'Luxury Yacht Charter',
      message: 'Interested in booking a sunset yacht tour in Alanya harbor.',
      enquiry_type: 'yacht',
      service_type: 'vip',
      dates: '2026-09-01 to 2026-09-03',
      duration: '3 hours',
      party_size: 4,
      preferred_contact: 'whatsapp',
    };

    const dto = plainToInstance(CreateEnquiryDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate minimal valid DTO with required fields only', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, need information on airport transfers.',
    };

    const dto = plainToInstance(CreateEnquiryDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if email is invalid', async () => {
    const payload = {
      name: 'John Doe',
      email: 'invalid-email',
      message: 'Some message',
    };

    const dto = plainToInstance(CreateEnquiryDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should fail validation if name is missing or empty', async () => {
    const payload = {
      name: '',
      email: 'john@example.com',
      message: 'Some message',
    };

    const dto = plainToInstance(CreateEnquiryDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it.each([
    ['name', 'x'.repeat(201)],
    ['email', `${'a'.repeat(310)}@example.com`],
    ['phone', `+${'1'.repeat(50)}`],
    ['subject', 'x'.repeat(501)],
    ['message', 'x'.repeat(10001)],
    ['enquiry_type', 'x'.repeat(101)],
    ['service_type', 'x'.repeat(101)],
    ['dates', 'x'.repeat(101)],
    ['duration', 'x'.repeat(101)],
    ['preferred_contact', 'x'.repeat(101)],
  ])('should reject oversized %s', async (field, value) => {
    const dto = plainToInstance(CreateEnquiryDto, {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Some message',
      [field]: value,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain(field);
  });

  it('should normalize email and phone values', () => {
    const dto = plainToInstance(CreateEnquiryDto, {
      name: 'John Doe',
      email: '  JOHN@EXAMPLE.COM ',
      phone: '  +90 555 123 4567  ',
      message: 'Some message',
    });

    expect(dto.email).toBe('john@example.com');
    expect(dto.phone).toBe('+90 555 123 4567');
  });

  it('should reject malformed phone values', async () => {
    const dto = plainToInstance(CreateEnquiryDto, {
      name: 'John Doe',
      email: 'john@example.com',
      phone: 'call-me-now',
      message: 'Some message',
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain('phone');
  });

  it('should fail validation if message is missing or empty', async () => {
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      message: '',
    };

    const dto = plainToInstance(CreateEnquiryDto, payload);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'message')).toBe(true);
  });
});
