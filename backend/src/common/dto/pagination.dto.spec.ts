import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  PaginationDto,
  PaginationQueryDto,
  LimitQueryDto,
  DaysQueryDto,
} from './pagination.dto';

describe('Pagination DTOs', () => {
  describe('PaginationDto', () => {
    it('should use default page 1 and limit 20 with offset 0', () => {
      const dto = new PaginationDto();
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.offset).toBe(0);
    });

    it('should calculate offset correctly for page 3 and limit 15', () => {
      const dto = new PaginationDto();
      dto.page = 3;
      dto.limit = 15;
      expect(dto.offset).toBe(30);
    });

    it('should transform plain object string numbers into numbers', async () => {
      const plain = { page: '2', limit: '50' };
      const dto = plainToInstance(PaginationDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(50);
      expect(dto.offset).toBe(50);
    });

    it('should fail validation when page or limit is less than 1', async () => {
      const plain = { page: '0', limit: '-5' };
      const dto = plainToInstance(PaginationDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when limit exceeds 100', async () => {
      const plain = { page: '1', limit: '150' };
      const dto = plainToInstance(PaginationDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('PaginationQueryDto', () => {
    it('should validate valid sortOrder and sortBy', async () => {
      const plain = {
        page: '1',
        limit: '10',
        sortBy: 'created_at',
        sortOrder: 'asc',
      };
      const dto = plainToInstance(PaginationQueryDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('created_at');
      expect(dto.sortOrder).toBe('asc');
    });

    it('should reject invalid sortOrder', async () => {
      const plain = { sortOrder: 'invalid_direction' };
      const dto = plainToInstance(PaginationQueryDto, plain);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('LimitQueryDto and DaysQueryDto', () => {
    it('should transform and validate LimitQueryDto', async () => {
      const dto = plainToInstance(LimitQueryDto, { limit: '25' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(25);
    });

    it('should transform and validate DaysQueryDto', async () => {
      const dto = plainToInstance(DaysQueryDto, { days: '60' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.days).toBe(60);
    });
  });
});
