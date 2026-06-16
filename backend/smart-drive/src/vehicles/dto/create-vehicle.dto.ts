import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { FuelType } from '../../../generated/prisma/client';
import { sanitizeText } from './sanitize-text';

const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 1;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateVehicleDto {
  @Transform(({ value }) => sanitizeText(value))
  @IsString()
  @IsNotEmpty()
  brand!: string;

  @Transform(({ value }) => sanitizeText(value))
  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsInt()
  @Min(MIN_YEAR)
  @Max(MAX_YEAR)
  year!: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  engine!: string;

  @IsEnum(FuelType)
  fuelType!: FuelType;

  @IsNumber()
  @IsPositive()
  tankCapacityLiters!: number;

  @IsNumber()
  @IsPositive()
  baseUrbanConsumptionKmL!: number;

  @IsNumber()
  @IsPositive()
  baseHighwayConsumptionKmL!: number;

  @IsNumber()
  @IsPositive()
  baseMixedConsumptionKmL!: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weightKg?: number;
}
