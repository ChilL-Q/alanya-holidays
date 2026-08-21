import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateUserProfileDto } from './update-user-profile.dto';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('UpdateUserProfileDto & UsersService - Adversarial Stress Tests', () => {
  describe('DTO Validation Stress Tests', () => {
    it('should pass validation with complete valid profile update payload', async () => {
      const payload = {
        full_name: 'Ruslan Nazarov',
        phone: '+905551234567',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Alanya travel enthusiast and local guide.',
        company_name: 'Alanya Holidays LLC',
        social_links: {
          instagram: 'https://instagram.com/alanyaholidays',
          facebook: 'https://facebook.com/alanyaholidays',
          telegram: 'https://t.me/alanyaholidays',
        },
      };

      const dto = plainToInstance(UpdateUserProfileDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with empty object (all fields optional)', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {});
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with Unicode, Cyrillic, Turkish characters and Emojis in text fields', async () => {
      const payload = {
        full_name: 'Александр Özkan 🌴🌞',
        bio: 'Alanya\'da tatil rehberi & guide: Çay, deniz, güneş! 🇹🇷 Özel turlar: "Kleopatra Plajı" <3',
        company_name: 'Akdeniz Seyahat Ltd. Şti. / ООО «Аланья Тур»',
      };

      const dto = plainToInstance(UpdateUserProfileDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.full_name).toContain('🌴🌞');
      expect(dto.bio).toContain('Çay, deniz, güneş!');
    });

    it('should accept huge string payloads without crashing (DoS / Buffer test)', async () => {
      const hugeString = 'A'.repeat(100_000);
      const payload = {
        full_name: 'Normal Name',
        bio: hugeString,
        company_name: hugeString,
      };

      const dto = plainToInstance(UpdateUserProfileDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.bio?.length).toBe(100_000);
    });

    it('should accept special characters and potential injection vectors in string fields (safe at DTO level)', async () => {
      const payload = {
        full_name: "<script>alert('XSS')</script>",
        bio: "'; DROP TABLE profiles; -- SELECT * FROM users WHERE '1'='1",
        avatar_url: 'javascript:void(0)',
        company_name: '"><img src=x onerror=alert(1)>',
      };

      const dto = plainToInstance(UpdateUserProfileDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.bio).toContain('DROP TABLE profiles');
    });

    it('should fail validation when string fields receive non-string types (numbers, booleans, arrays)', async () => {
      const invalidPayloads = [
        { full_name: 12345 },
        { phone: true },
        { avatar_url: ['http://invalid.url'] },
        { bio: { text: 'invalid nested object' } },
        { company_name: 999.99 },
      ];

      for (const payload of invalidPayloads) {
        const dto = plainToInstance(UpdateUserProfileDto, payload);
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should fail validation when social_links is not an object', async () => {
      const invalidSocialLinks = [
        'https://instagram.com/user',
        12345,
        true,
        ['https://instagram.com', 'https://facebook.com'],
      ];

      for (const social of invalidSocialLinks) {
        const dto = plainToInstance(UpdateUserProfileDto, {
          social_links: social,
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((e) => e.property === 'social_links')).toBe(true);
      }
    });

    it('should accept valid empty social_links object', async () => {
      const dto = plainToInstance(UpdateUserProfileDto, {
        social_links: {},
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should ignore prototype pollution attempts safely', async () => {
      const payload: unknown = JSON.parse(
        '{"full_name":"Safe Name","__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted2":"yes"}}}',
      );

      const dto = plainToInstance(UpdateUserProfileDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(Reflect.get(Object.prototype, 'polluted')).toBeUndefined();
      expect(Reflect.get(Object.prototype, 'polluted2')).toBeUndefined();
    });
  });

  describe('UsersService Authorization & Privilege Escalation Challenges', () => {
    let service: UsersService;
    let mockRepository: {
      getUserRole: jest.Mock;
      updateUserProfile: jest.Mock;
    };

    beforeEach(async () => {
      mockRepository = {
        getUserRole: jest.fn(),
        updateUserProfile: jest.fn().mockResolvedValue({}),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: UsersRepository,
            useValue: mockRepository,
          },
        ],
      }).compile();

      service = module.get<UsersService>(UsersService);
    });

    it('should strictly strip role escalation attempt when non-admin submits role="admin"', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const dto: UpdateUserProfileDto = {
        full_name: 'Attacker User',
        role: 'admin',
        bio: 'I want to be admin',
      };

      const result = await service.updateUserProfile('user-1', dto, 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateUserProfile).toHaveBeenCalledWith('user-1', {
        full_name: 'Attacker User',
        bio: 'I want to be admin',
      });
      expect(mockRepository.updateUserProfile).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ role: 'admin' }),
      );
    });

    it('should preserve role update when an admin updates a user profile', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');

      const dto: UpdateUserProfileDto = {
        full_name: 'Promoted User',
        role: 'host',
      };

      const result = await service.updateUserProfile('user-2', dto, 'admin-1');

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateUserProfile).toHaveBeenCalledWith('user-2', {
        full_name: 'Promoted User',
        role: 'host',
      });
    });

    it('should throw UnauthorizedException when a regular user attempts to update another user profile', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      const dto: UpdateUserProfileDto = {
        full_name: 'Victim User Hacked Name',
      };

      await expect(
        service.updateUserProfile('victim-user-id', dto, 'attacker-user-id'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockRepository.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should allow admin to update any user profile', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');

      const dto: UpdateUserProfileDto = {
        full_name: 'Admin Corrected Name',
        company_name: 'Verified Partner',
      };

      const result = await service.updateUserProfile(
        'user-99',
        dto,
        'admin-id',
      );

      expect(result).toEqual({ success: true });
      expect(mockRepository.updateUserProfile).toHaveBeenCalledWith('user-99', {
        full_name: 'Admin Corrected Name',
        company_name: 'Verified Partner',
      });
    });
  });
});
