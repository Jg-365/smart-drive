import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class PairDeviceDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  vehicleId!: string;
}
