import { IsIn, IsOptional, IsString } from 'class-validator';

export class StartDemoDto {
  @IsOptional()
  @IsIn(['smooth', 'normal', 'aggressive'])
  scenario?: 'smooth' | 'normal' | 'aggressive';

  @IsOptional()
  @IsString()
  vehicleId?: string;
}
