import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';
import { AuthUser } from '../types/auth-user.interface';

type CurrentUserFactory = (
  data: keyof AuthUser | string | undefined,
  ctx: ExecutionContext,
) => unknown;

type ParamDecoratorFn = (...pipes: unknown[]) => ParameterDecorator;

type RouteArgsMetadataEntry = {
  factory: CurrentUserFactory;
};

function getParamDecoratorFactory(
  decorator: ParamDecoratorFn,
): CurrentUserFactory {
  class TestClass {
    testMethod(@decorator() _param: unknown): void {}
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestClass,
    'testMethod',
  ) as Record<string, RouteArgsMetadataEntry> | undefined;

  if (!metadata) {
    throw new Error('Decorator metadata was not created');
  }

  const firstKey = Object.keys(metadata)[0];
  return metadata[firstKey].factory;
}

describe('CurrentUser Decorator', () => {
  const factory = getParamDecoratorFactory(CurrentUser as ParamDecoratorFn);

  const mockUser: AuthUser = {
    id: 'usr-123',
    email: 'user@example.com',
    role: 'authenticated',
  };

  const createMockContext = (reqUser?: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: reqUser,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should return the full AuthUser when no property data is specified', () => {
    const ctx = createMockContext(mockUser);
    const result = factory(undefined, ctx);
    expect(result).toEqual(mockUser);
  });

  it('should return a specific property (e.g. id) when specified in decorator data', () => {
    const ctx = createMockContext(mockUser);
    const result = factory('id', ctx);
    expect(result).toBe('usr-123');
  });

  it('should return email property when specified', () => {
    const ctx = createMockContext(mockUser);
    const result = factory('email', ctx);
    expect(result).toBe('user@example.com');
  });

  it('should return undefined when request has no user (unauthenticated / optional auth)', () => {
    const ctx = createMockContext(undefined);
    const result = factory(undefined, ctx);
    expect(result).toBeUndefined();
  });

  it('should return undefined when requesting a property from undefined user', () => {
    const ctx = createMockContext(undefined);
    const result = factory('id', ctx);
    expect(result).toBeUndefined();
  });

  it('should return undefined when property does not exist on user', () => {
    const ctx = createMockContext(mockUser);
    const result = factory('nonExistentKey', ctx);
    expect(result).toBeUndefined();
  });

  it('should preserve falsy values (boolean false, 0, empty string) when extracting properties', () => {
    const userWithFalsyProps: AuthUser = {
      id: 'usr-999',
      is_active: false,
      login_count: 0,
      bio: '',
    };
    const ctx = createMockContext(userWithFalsyProps);
    expect(factory('is_active', ctx)).toBe(false);
    expect(factory('login_count', ctx)).toBe(0);
    expect(factory('bio', ctx)).toBe('');
  });

  it('should correctly extract complex nested objects (user_metadata, app_metadata)', () => {
    const userWithMetadata: AuthUser = {
      id: 'usr-meta',
      user_metadata: { role: 'admin', display_name: 'Admin User' },
      app_metadata: { provider: 'email', permissions: ['read', 'write'] },
    };
    const ctx = createMockContext(userWithMetadata);
    expect(factory('user_metadata', ctx)).toEqual({
      role: 'admin',
      display_name: 'Admin User',
    });
    expect(factory('app_metadata', ctx)).toEqual({
      provider: 'email',
      permissions: ['read', 'write'],
    });
  });

  it('should return full user when data is empty string or undefined', () => {
    const ctx = createMockContext(mockUser);
    expect(factory('', ctx)).toEqual(mockUser);
    expect(factory(undefined, ctx)).toEqual(mockUser);
  });

  it('should safely handle missing getRequest or malformed context without throwing', () => {
    const malformedCtx1 = {
      switchToHttp: () => ({
        getRequest: () => undefined,
      }),
    } as unknown as ExecutionContext;
    expect(factory(undefined, malformedCtx1)).toBeUndefined();
    expect(factory('id', malformedCtx1)).toBeUndefined();

    const malformedCtx2 = {} as unknown as ExecutionContext;
    expect(factory(undefined, malformedCtx2)).toBeUndefined();
    expect(factory('id', malformedCtx2)).toBeUndefined();
  });
});
