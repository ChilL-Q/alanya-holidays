import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
  IsEmail,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderRecipientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsIn(['whatsapp', 'phone_call', 'email'])
  contact_method!: 'whatsapp' | 'phone_call' | 'email';
}

export class CreateOrderItemDto {
  @IsNotEmpty()
  productId!: string | number;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsOptional()
  skuId?: string | number | null;

  @IsOptional()
  @IsString()
  skuLabel?: string | null;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  finalPrice!: number;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}

export class CreateProductOrderDto {
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsOptional()
  @IsString()
  customerNotes?: string | null;

  @ValidateNested()
  @Type(() => OrderRecipientDto)
  recipient!: OrderRecipientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
