import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateDeviceDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  name?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}
