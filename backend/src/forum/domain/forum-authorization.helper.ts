import { UnauthorizedException } from '@nestjs/common';

export function assertAuthorOrAdmin(
  authorId: string,
  userId: string,
  role?: string,
): void {
  if (authorId !== userId && role !== 'admin') {
    throw new UnauthorizedException('Not authorized');
  }
}

export function assertAdmin(role?: string): void {
  if (role !== 'admin') {
    throw new UnauthorizedException('Not authorized');
  }
}
