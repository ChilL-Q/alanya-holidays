import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import { BillingService } from './billing.service';
import { CreateSubscriptionCheckoutDto } from './dto/billing.dto';

@UseGuards(AuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscription/checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckout(
    @Body() dto: CreateSubscriptionCheckoutDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.billingService.createCheckout(user.id, user.email, dto.plan);
  }

  @Post('subscription/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: AuthUser) {
    return this.billingService.cancel(user.id);
  }

  @Get('subscription/me')
  async getMySubscription(@CurrentUser() user: AuthUser) {
    return this.billingService.getMySubscription(user.id);
  }

  @Post('subscription/portal')
  @HttpCode(HttpStatus.OK)
  async createPortal(@CurrentUser() user: AuthUser) {
    return this.billingService.createPortal(user.id);
  }
}
