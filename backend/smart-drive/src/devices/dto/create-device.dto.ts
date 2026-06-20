import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDeviceDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  deviceCode!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;
}
