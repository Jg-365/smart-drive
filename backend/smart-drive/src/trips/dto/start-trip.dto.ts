import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TripMode } from '../../../generated/prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class StartTripDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsEnum(TripMode)
  mode?: TripMode;
}
