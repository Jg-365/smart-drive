import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Espelha telemetry_contract v1.0 (docs/CLAUDE.json). IMUTÁVEL sem alinhamento
// entre João, Nathan e Pedro. GPS pode ser null (ambiente fechado, sem fix) —
// isso é condição esperada, não erro.

class GpsDto {
  @IsOptional()
  @IsNumber()
  lat?: number | null;

  @IsOptional()
  @IsNumber()
  lng?: number | null;

  @IsOptional()
  @IsNumber()
  speedKmh?: number | null;

  @IsOptional()
  @IsNumber()
  satellites?: number | null;

  @IsOptional()
  @IsNumber()
  hdop?: number | null;
}

class ImuDto {
  @IsNumber()
  accelX!: number;

  @IsNumber()
  accelY!: number;

  @IsNumber()
  accelZ!: number;

  @IsOptional()
  @IsNumber()
  gyroX?: number;

  @IsOptional()
  @IsNumber()
  gyroY?: number;

  @IsOptional()
  @IsNumber()
  gyroZ?: number;
}

class EventsDto {
  @IsOptional()
  @IsBoolean()
  hardAcceleration?: boolean;

  @IsOptional()
  @IsBoolean()
  hardBrake?: boolean;

  @IsOptional()
  @IsBoolean()
  sharpTurn?: boolean;

  @IsOptional()
  @IsBoolean()
  impactSuspected?: boolean;
}

class BatteryDto {
  @IsOptional()
  @IsNumber()
  voltage?: number | null;

  @IsOptional()
  @IsNumber()
  percentage?: number | null;
}

export class TelemetryPayloadDto {
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  vehicleId!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsNumber()
  @IsPositive()
  timestamp!: number;

  @IsObject()
  @ValidateNested()
  @Type(() => ImuDto)
  imu!: ImuDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GpsDto)
  gps?: GpsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EventsDto)
  events?: EventsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BatteryDto)
  battery?: BatteryDto;
}
