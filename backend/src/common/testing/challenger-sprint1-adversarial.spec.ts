import {
  ForbiddenException,
  UnauthorizedException,
  ValidationPipe,
  ArgumentMetadata,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

// 1. CORS Delegate & Security
import {
  createCorsOriginDelegate,
  parseAllowedOrigins,
} from '../security/security.config';

// 2. DTOs
import {
  UpdateBookingStatusDto,
  BOOKING_STATUSES,
} from '../../bookings/dto/update-booking-status.dto';
import {
  UpdatePropertyStatusDto,
  PROPERTY_STATUSES,
} from '../../properties/dto/update-property-status.dto';
import {
  UpdateServiceStatusDto,
  SERVICE_STATUSES,
} from '../../services/dto/update-service-status.dto';
import {
  UpdateEnquiryStatusDto,
  ENQUIRY_STATUSES,
} from '../../admin/dto/update-enquiry-status.dto';
import { AssignEnquiryDto } from '../../admin/dto/assign-enquiry.dto';
import {
  UpdateListingStatusDto,
  LISTING_STATUSES,
} from '../../directory/dto/update-listing-status.dto';
import {
  UpdateClaimStatusDto,
  CLAIM_STATUSES,
} from '../../directory/dto/update-claim-status.dto';

// 3. Controllers & Guards
import { AdminController } from '../../admin/admin.controller';
import { BookingsController } from '../../bookings/bookings.controller';
import { PropertiesController } from '../../properties/properties.controller';
import { ServicesController } from '../../services/services.controller';
import { RolesGuard } from '../../auth/roles.guard';
import { ROLE_KEY } from '../../auth/decorators/require-role.decorator';
import { UserRolesRepository } from '../auth/user-roles.repository';

function getMethodRef(
  target: object,
  methodName: string,
): (...args: unknown[]) => unknown {
  const descriptor = Object.getOwnPropertyDescriptor(target, methodName);
  return descriptor?.value as (...args: unknown[]) => unknown;
}

describe('Empirical Challenger - Sprint 1 Adversarial Stress Tests', () => {
  // =========================================================================
  // CHALLENGE 1: CORS Rejection, Origin Validation & Adversarial Payloads
  // =========================================================================
  describe('Challenge 1: CORS Rejection & Edge Case Matrix', () => {
    const allowedOrigins = [
      'https://alanyaholidays.com',
      'http://localhost:3000',
      'https://app.alanyaholidays.com',
    ];
    const corsDelegate = createCorsOriginDelegate(allowedOrigins);

    it('should permit missing/undefined origin without throwing errors (CURL, Mobile, SSR)', () => {
      const callback = jest.fn();
      corsDelegate(undefined, callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should permit empty string origin gracefully', () => {
      const callback = jest.fn();
      corsDelegate('', callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should permit exact whitelisted origins and normalized trailing slashes', () => {
      for (const origin of allowedOrigins) {
        const callback1 = jest.fn();
        corsDelegate(origin, callback1);
        expect(callback1).toHaveBeenCalledWith(null, true);

        const callback2 = jest.fn();
        corsDelegate(`${origin}/`, callback2);
        expect(callback2).toHaveBeenCalledWith(null, true);
      }
    });

    const maliciousOrigins = [
      'https://evil.com',
      'http://evil.com',
      'https://alanyaholidays.com.evil.com', // Prefix matching attack
      'https://evil-alanyaholidays.com', // Hyphen spoofing
      'https://subdomain.alanyaholidays.com', // Unlisted subdomain
      'http://alanyaholidays.com', // Protocol downgrade (HTTP vs HTTPS)
      'http://localhost:3001', // Port bypass attempt
      'http://localhost:8080',
      'null', // Browser sandbox iframe "null" origin
      'javascript:alert(1)', // Scheme injection
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'https://alanyaholidays.com:4433', // Alternative port
      'https://аlаnyаhоlidаys.com', // Cyrillic homograph attack
      'https://user:pass@alanyaholidays.com',
      'https://alanyaholidays.com%00.attacker.com', // Null byte injection
    ];

    test.each(maliciousOrigins)(
      'should reject unauthorized origin "%s" with HTTP 403 ForbiddenException',
      (badOrigin) => {
        const callback = jest.fn<void, [Error | null, boolean?]>();
        corsDelegate(badOrigin, callback);

        expect(callback).toHaveBeenCalledTimes(1);
        const [error, allowed] = callback.mock.calls[0] ?? [];
        expect(error).toBeInstanceOf(ForbiddenException);
        const forbidden = error as ForbiddenException;
        expect(forbidden.getStatus()).toBe(403);
        expect(forbidden.message).toBe(
          `Origin ${badOrigin} is not allowed by CORS`,
        );
        expect(allowed).toBeUndefined();
      },
    );

    it('should correctly parse allowed origins from comma-separated env strings', () => {
      const parsed = parseAllowedOrigins({
        CORS_ALLOWED_ORIGINS:
          ' https://one.com , https://two.com/ ,http://localhost:4000/ ',
        APP_URL: 'https://three.com',
      });

      expect(parsed).toContain('https://one.com');
      expect(parsed).toContain('https://two.com');
      expect(parsed).toContain('http://localhost:4000');
      expect(parsed).toContain('https://three.com');
      expect(parsed).toContain('http://localhost:3000'); // Default
    });
  });

  // =========================================================================
  // CHALLENGE 2: Status DTO Whitelists & Injection Payload Stress Testing
  // =========================================================================
  describe('Challenge 2: Status DTO Whitelists Validation Matrix', () => {
    const adversarialPayloads = [
      '', // Empty string
      '   ', // Whitespace
      '\t\n',
      'hacked',
      'admin',
      'ADMIN',
      'root',
      'deleted',
      'null', // String 'null'
      'undefined',
      'true',
      'false',
      '0',
      '1',
      'approved; DROP TABLE properties; --', // SQL Injection
      "pending' OR '1'='1", // SQL Injection
      "status' UNION SELECT * FROM users --", // SQL Injection
      '<script>alert(1)</script>', // XSS
      '__proto__', // Prototype pollution
      'constructor',
      'prototype',
      'A'.repeat(5000), // Buffer/DoS payload
      'approved\0', // Null byte
      ' approved', // Leading space
      'approved ', // Trailing space
    ];

    const validationPipe = new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    });

    describe('UpdateBookingStatusDto', () => {
      it('should ACCEPT all valid whitelisted booking statuses', () => {
        for (const status of BOOKING_STATUSES) {
          const dto = plainToInstance(UpdateBookingStatusDto, {
            status,
            reason: 'Valid reason',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdateBookingStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );

      it('should REJECT case-mismatched statuses (e.g. "CONFIRMED", "Pending")', () => {
        for (const status of BOOKING_STATUSES) {
          const uppercaseDto = plainToInstance(UpdateBookingStatusDto, {
            status: status.toUpperCase(),
          });
          expect(validateSync(uppercaseDto).length).toBeGreaterThan(0);

          const capitalizedDto = plainToInstance(UpdateBookingStatusDto, {
            status: status.charAt(0).toUpperCase() + status.slice(1),
          });
          expect(validateSync(capitalizedDto).length).toBeGreaterThan(0);
        }
      });

      it('should REJECT non-string reason', () => {
        const dto = plainToInstance(UpdateBookingStatusDto, {
          status: 'confirmed',
          reason: 12345,
        });
        const errors = validateSync(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('reason');
      });

      it('should strip non-whitelisted properties via ValidationPipe', async () => {
        const metadata: ArgumentMetadata = {
          type: 'body',
          metatype: UpdateBookingStatusDto,
        };
        const transformed = (await validationPipe.transform(
          {
            status: 'confirmed',
            reason: 'ok',
            isAdmin: true,
            role: 'superuser',
            extraField: 'malicious',
          },
          metadata,
        )) as Record<string, unknown>;

        expect(transformed.status).toBe('confirmed');
        expect(transformed.reason).toBe('ok');
        expect(transformed.isAdmin).toBeUndefined();
        expect(transformed.role).toBeUndefined();
        expect(transformed.extraField).toBeUndefined();
      });
    });

    describe('UpdatePropertyStatusDto', () => {
      it('should ACCEPT all valid whitelisted property statuses', () => {
        for (const status of PROPERTY_STATUSES) {
          const dto = plainToInstance(UpdatePropertyStatusDto, {
            status,
            reason: 'Reviewed by admin',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdatePropertyStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );

      it('should REJECT cross-entity statuses (e.g. "confirmed", "draft", "new")', () => {
        const invalidStatuses = [
          'confirmed',
          'draft',
          'new',
          'in_progress',
          'cancelled',
        ];
        for (const status of invalidStatuses) {
          const dto = plainToInstance(UpdatePropertyStatusDto, { status });
          expect(validateSync(dto).length).toBeGreaterThan(0);
        }
      });
    });

    describe('UpdateServiceStatusDto', () => {
      it('should ACCEPT all valid whitelisted service statuses', () => {
        for (const status of SERVICE_STATUSES) {
          const dto = plainToInstance(UpdateServiceStatusDto, {
            status,
            reason: 'Service validated',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdateServiceStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );
    });

    describe('UpdateEnquiryStatusDto', () => {
      it('should ACCEPT all valid whitelisted enquiry statuses', () => {
        for (const status of ENQUIRY_STATUSES) {
          const dto = plainToInstance(UpdateEnquiryStatusDto, {
            status,
            reason: 'Handled enquiry',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdateEnquiryStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );

      it('should REJECT legacy or invalid enquiry statuses (e.g. "pending", "open", "resolved")', () => {
        const invalidStatuses = ['pending', 'open', 'resolved', 'approved'];
        for (const status of invalidStatuses) {
          const dto = plainToInstance(UpdateEnquiryStatusDto, { status });
          expect(validateSync(dto).length).toBeGreaterThan(0);
        }
      });
    });

    describe('AssignEnquiryDto', () => {
      it('should ACCEPT string or null or undefined assigned_to', () => {
        const valid1 = plainToInstance(AssignEnquiryDto, {
          assigned_to: 'agent-123',
        });
        expect(validateSync(valid1)).toHaveLength(0);

        const valid2 = plainToInstance(AssignEnquiryDto, {
          assigned_to: null,
        });
        expect(validateSync(valid2)).toHaveLength(0);

        const valid3 = plainToInstance(AssignEnquiryDto, {});
        expect(validateSync(valid3)).toHaveLength(0);
      });

      it('should REJECT non-string non-null assigned_to', () => {
        const invalid = plainToInstance(AssignEnquiryDto, {
          assigned_to: 12345,
        });
        expect(validateSync(invalid).length).toBeGreaterThan(0);
      });
    });

    describe('UpdateListingStatusDto', () => {
      it('should ACCEPT all valid whitelisted listing statuses', () => {
        for (const status of LISTING_STATUSES) {
          const dto = plainToInstance(UpdateListingStatusDto, {
            status,
            reason: 'Listing moderated',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdateListingStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );
    });

    describe('UpdateClaimStatusDto', () => {
      it('should ACCEPT all valid whitelisted claim statuses', () => {
        for (const status of CLAIM_STATUSES) {
          const dto = plainToInstance(UpdateClaimStatusDto, {
            status,
            reason: 'Claim processed',
          });
          const errors = validateSync(dto);
          expect(errors).toHaveLength(0);
        }
      });

      test.each(adversarialPayloads)(
        'should REJECT adversarial status "%s"',
        (statusPayload) => {
          const dto = plainToInstance(UpdateClaimStatusDto, {
            status: statusPayload,
          });
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
          expect(errors[0].property).toBe('status');
          expect(errors[0].constraints?.isIn).toBeDefined();
        },
      );
    });
  });

  // =========================================================================
  // CHALLENGE 3: Controller Role Guards Reflection & Authorization Enforcement
  // =========================================================================
  describe('Challenge 3: Role Guarding & Controller Protection Matrix', () => {
    const reflector = new Reflector();

    describe('Route Decorators & Metadata Verification', () => {
      it('AdminController: all routes must be guarded with RequireRole("admin") at class level', () => {
        const classRoles = reflector.get<string[] | undefined>(
          ROLE_KEY,
          AdminController,
        );
        expect(classRoles).toEqual(['admin']);
      });

      it('BookingsController.getAdminBookings: must have RequireRole("admin")', () => {
        const target = getMethodRef(
          BookingsController.prototype,
          'getAdminBookings',
        );
        const routeRoles = reflector.get<string[] | undefined>(
          ROLE_KEY,
          target,
        );
        expect(routeRoles).toEqual(['admin']);
      });

      it('BookingsController.updatePayoutStatus: must have RequireRole("admin")', () => {
        const target = getMethodRef(
          BookingsController.prototype,
          'updatePayoutStatus',
        );
        const routeRoles = reflector.get<string[] | undefined>(
          ROLE_KEY,
          target,
        );
        expect(routeRoles).toEqual(['admin']);
      });

      it('PropertiesController.updatePropertyStatus: must have RequireRole("admin")', () => {
        const target = getMethodRef(
          PropertiesController.prototype,
          'updatePropertyStatus',
        );
        const routeRoles = reflector.get<string[] | undefined>(
          ROLE_KEY,
          target,
        );
        expect(routeRoles).toEqual(['admin']);
      });

      it('ServicesController.updateServiceStatus: must have RequireRole("admin")', () => {
        const target = getMethodRef(
          ServicesController.prototype,
          'updateServiceStatus',
        );
        const routeRoles = reflector.get<string[] | undefined>(
          ROLE_KEY,
          target,
        );
        expect(routeRoles).toEqual(['admin']);
      });
    });

    describe('RolesGuard Execution & Bypass Defense', () => {
      let getRoleMock: jest.Mock;
      let mockUserRolesRepo: UserRolesRepository;
      let rolesGuard: RolesGuard;

      beforeEach(() => {
        getRoleMock = jest.fn();
        mockUserRolesRepo = {
          getRole: getRoleMock,
        } as unknown as UserRolesRepository;
        rolesGuard = new RolesGuard(reflector, mockUserRolesRepo);
      });

      const createContext = (
        userId?: string,
        extraUserFields?: Record<string, unknown>,
        handler?: () => void,
      ): ExecutionContext => {
        const request: Record<string, unknown> = userId
          ? { user: { id: userId, ...(extraUserFields || {}) } }
          : {};
        return {
          switchToHttp: () => ({
            getRequest: () => request,
          }),
          getHandler: () => handler || jest.fn(),
          getClass: () => jest.fn().constructor,
        } as unknown as ExecutionContext;
      };

      it('should REJECT unauthenticated request (user is undefined) on protected routes', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        const context = createContext(undefined);

        await expect(rolesGuard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(getRoleMock).not.toHaveBeenCalled();
      });

      it('should REJECT request with empty user id', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        const context = createContext('');

        await expect(rolesGuard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should REJECT user with role "user" on AdminController routes', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        getRoleMock.mockResolvedValue('user');

        const context = createContext('usr-1');

        await expect(rolesGuard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(getRoleMock).toHaveBeenCalledWith('usr-1');
      });

      it('should REJECT user with role "moderator", "host", or "provider" on updatePayoutStatus', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        const nonAdminRoles = [
          'moderator',
          'host',
          'provider',
          'guest',
          'staff',
        ];

        for (const role of nonAdminRoles) {
          getRoleMock.mockResolvedValue(role);

          const context = createContext(`usr-${role}`);

          await expect(rolesGuard.canActivate(context)).rejects.toThrow(
            UnauthorizedException,
          );
        }
      });

      it('should REJECT when database role is undefined (user not found in user_roles table)', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        getRoleMock.mockResolvedValue(undefined);

        const context = createContext('usr-orphan');

        await expect(rolesGuard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should IGNORE client-spoofed token role and ALWAYS check DB role', async () => {
        // Attacker sends a token or object claiming role: 'admin', but DB says role is 'user'
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        getRoleMock.mockResolvedValue('user');

        const context = createContext('usr-attacker', { role: 'admin' });

        await expect(rolesGuard.canActivate(context)).rejects.toThrow(
          UnauthorizedException,
        );
        expect(getRoleMock).toHaveBeenCalledWith('usr-attacker');
      });

      it('should PERMIT caller when database confirms role is "admin"', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
        getRoleMock.mockResolvedValue('admin');

        const context = createContext('admin-user-1');
        const result = await rolesGuard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should PASS THROUGH unconditionally on unguarded routes (no @RequireRole)', async () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

        const context = createContext(undefined);
        const result = await rolesGuard.canActivate(context);
        expect(result).toBe(true);
        expect(getRoleMock).not.toHaveBeenCalled();
      });
    });
  });
});
