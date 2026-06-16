import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceStatus } from '../../../generated/prisma/client';

// DTO do endpoint de DEV que dispara device:statusChanged. Some quando o fluxo
// real de status (Pedro/firmware) existir.
export class DeviceStatusDto {
  @IsString()
  @IsNotEmpty()
  tripId!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsEnum(DeviceStatus)
  status!: DeviceStatus;
}
