import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class EndTripDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageSpeedKmh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSpeedKmh?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedConsumptionKmL?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedFuelSpentLiters?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  drivingScore?: number;
}
