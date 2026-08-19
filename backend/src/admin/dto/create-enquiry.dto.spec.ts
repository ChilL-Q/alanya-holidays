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
