import { IsIn, IsOptional, IsString } from 'class-validator';

export type DemoProfile = 'smooth' | 'normal' | 'aggressive';

export class StartDemoDto {
  @IsIn(['smooth', 'normal', 'aggressive'])
  scenario!: DemoProfile;

  /** Opcional: ausente → veículo demo padrão (JOA-RF-05 edge). */
  @IsOptional()
  @IsString()
  vehicleId?: string;
}
