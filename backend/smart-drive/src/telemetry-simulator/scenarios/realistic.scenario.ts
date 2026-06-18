import { TelemetryPayload } from "../interfaces/telemetry.interface";

type DrivingState = 'CRUISING' | 'ACCELERATING' | 'BRAKING' | 'TURNING_LEFT' | 'TURNING_RIGHT' | 'STOPPED';

export class RealisticDrivingScenario {
    private step = 0;
    private timestamp = Date.now();
    private currentState: DrivingState = 'CRUISING';
    private stateDuration = 0; 

    private routeProfile: 'aggressive' | 'cautious' | 'urban_traffic';

    // Estado interno do veículo
    private state = {
        lat: -23.550520,  
        lng: -46.633308,
        speed: 13.88,     
        heading: 0        
    };

    private readonly METERS_PER_DEGREE_LAT = 111132;
    private readonly METERS_PER_DEGREE_LNG = 111320 * Math.cos(-23.550520 * Math.PI / 180);

    // --- CONFIGURAÇÃO DO TIME STEP ---
    // deltaTime em segundos (ex: 1 = 1s, 0.1 = 100ms, 0.5 = 500ms)
    private readonly deltaTime: number; 

    constructor(deltaTimeSeconds = 1.0) {
        this.deltaTime = deltaTimeSeconds;

        const profiles: Array<'aggressive' | 'cautious' | 'urban_traffic'> = ['aggressive', 'cautious', 'urban_traffic'];
        this.routeProfile = profiles[Math.floor(Math.random() * profiles.length)];
        this.state.heading = Math.floor(Math.random() * 360);
    }

    private addNoise(value: number, intensity = 0.05): number {
        return value + (Math.random() - 0.5) * intensity;
    }

    /**
     * Máquina de estados adaptada para o deltaTime
     */
    private updateDrivingState(): void {
        if (this.stateDuration > 0) {
            this.stateDuration--;
            return;
        }

        const rand = Math.random();
        let durationInSeconds = 0;

        const weights = {
            aggressive: { cruising: 0.20, turn: 0.50, brake: 0.85 },   // Menos linha reta, mais curvas e frenagens
            urban_traffic: { cruising: 0.30, turn: 0.55, brake: 0.75 },// Muitas curvas e paradas frequentes
            cautious: { cruising: 0.60, turn: 0.75, brake: 0.95 }      // Predomina velocidade constante
        }

        const currentWeight = weights[this.routeProfile]

        switch (this.currentState) {
            case 'STOPPED':
                this.currentState = 'ACCELERATING';// Agressivo arranca muito mais rápido
                durationInSeconds = this.routeProfile === 'aggressive' 
                    ? Math.random() * 2 + 1   // 1 a 3s arrancando forte
                    : Math.random() * 4 + 3;  // 3 a 7s suave
                break;
            case 'ACCELERATING':
                // Se for agressivo, sai da aceleração direto para velocidade constante ou frenagem rápida
                if(this.routeProfile === 'aggressive') {
                    this.currentState = rand < 0.5 ? 'CRUISING' : 'BRAKING';
                    durationInSeconds = Math.random() * 6 + 4;
                } else {
                    this.currentState = rand < 0.7 ? 'CRUISING' : 'BRAKING';
                    durationInSeconds = Math.random() * 8 + 5;
                }
                break;
            default:
                if (rand < currentWeight.cruising) {
                    this.currentState = 'CRUISING';
                    durationInSeconds = Math.random() * 10 + 5;
                } else if (rand < currentWeight.turn) {
                    this.currentState = Math.random() < 0.5 ? 'TURNING_LEFT' : 'TURNING_RIGHT';
                    // Sharp Turn (Agressivo): Curva dura muito menos tempo porque é feita de forma violenta
                    durationInSeconds = this.routeProfile === 'aggressive' 
                        ? Math.random() * 1.5 + 0.8  // Curva rápida de 0.8s a 2.3s
                        : Math.random() * 4 + 3;     // Curva urbana comum/suave de 3 a 7s
                } else if (rand < currentWeight.brake) {
                    this.currentState = 'BRAKING';
                    durationInSeconds = Math.random() * 4 + 2;
                } else {
                    if (this.routeProfile === 'cautious' && Math.random() > 0.2) {
                        this.currentState = 'CRUISING';
                        durationInSeconds = Math.random() * 5 + 5;
                    } else {
                        this.currentState = 'STOPPED';
                        durationInSeconds = Math.random() * 6 + 4;
                    }
                }
                break;
        }

        // CONVERSÃO CRÍTICA: Transforma o tempo em segundos para a quantidade de "steps" necessários
        this.stateDuration = Math.floor(durationInSeconds / this.deltaTime);
    }

    public next(): TelemetryPayload {
        this.step++;
        
        // Avança o timestamp baseado na fração de segundo real (convertido para milissegundos)
        this.timestamp += (this.deltaTime * 1000); 

        this.updateDrivingState();

        let gyroZ = 0;       
        let accelX = 0;      
        let accelY = 0;      
        
        const targetSpeedMax = this.routeProfile === 'aggressive' ? 22.22 : 13.88;

        // --- APLICAÇÃO DA FÍSICA ---
        // Note que accelX e gyroZ continuam representando unidades "por segundo" (m/s² e rad/s),
        // mas a variação da velocidade no estado respeita a fração de tempo (multiplicada por deltaTime).
        switch (this.currentState) {
            case 'CRUISING':
                accelX = (Math.random() - 0.5) * 0.4; 
                this.state.speed += accelX * this.deltaTime; // Aplica fração do tempo
                break;

            case 'ACCELERATING':
                accelX = this.routeProfile === 'aggressive' ? 4.5 : 1.2;
                this.state.speed += accelX * this.deltaTime;
                if (this.state.speed > targetSpeedMax) this.state.speed = targetSpeedMax;
                break;

            case 'BRAKING':
                accelX = this.routeProfile === 'aggressive' ? -5.5 : -1.8;
                this.state.speed += accelX * this.deltaTime;
                if (this.state.speed < 2) this.state.speed = 2; 
                break;

            case 'STOPPED':
                accelX = 0;
                if (this.state.speed > 0) {
                    accelX = -this.state.speed / this.deltaTime; // Desaceleração imediata proporcional
                    this.state.speed = 0;
                }
                break;

            case 'TURNING_LEFT':
                if (this.state.speed > 8.33) { 
                    switch (this.routeProfile) {
                        case 'aggressive':
                            accelX = -0.5; // Quase não freia, entra "chutado" na curva
                            break;
                        case 'urban_traffic':
                            accelX = -2.5; // Frenagem forte comum de trânsito urbano / esquinas
                            break;
                        case 'cautious':
                            accelX = -1.5; // Desaceleração suave e segura
                            break;
                    }
                    this.state.speed += accelX * this.deltaTime;
                }

                // SHARP TURN: Velocidade angular (rad/s) drasticamente maior se for agressivo
                gyroZ = this.routeProfile === 'aggressive' ? -0.75 : -0.24; 
                
                // Força G Lateral (accelY) proporcional ao quadrado da velocidade e à severidade da curva
                accelY = - (Math.pow(this.state.speed, 2) / (this.routeProfile === 'aggressive' ? 15 : 40)); 
                break;

            case 'TURNING_RIGHT':
                if (this.state.speed > 8.33) { 
                    switch (this.routeProfile) {
                        case 'aggressive':
                            accelX = -0.5; // Quase não freia, entra "chutado" na curva
                            break;
                        case 'urban_traffic':
                            accelX = -2.5; // Frenagem forte comum de trânsito urbano / esquinas
                            break;
                        case 'cautious':
                            accelX = -1.5; // Desaceleração suave e segura
                            break;
                    }
                    this.state.speed += accelX * this.deltaTime;
                }

                // SHARP TURN: Velocidade angular (rad/s) drasticamente maior se for agressivo
                gyroZ = this.routeProfile === 'aggressive' ? 0.75 : 0.24; 
                
                // Força G Lateral (accelY) proporcional ao quadrado da velocidade e à severidade da curva
                accelY = (Math.pow(this.state.speed, 2) / (this.routeProfile === 'aggressive' ? 15 : 40)); 
                break;
        }

        // --- ATUALIZAÇÃO DO ESTADO GEOGRÁFICO ---
        
        // 1. Heading usando o deltaTime
        const deltaHeadingDegrees = gyroZ * (180 / Math.PI) * this.deltaTime;
        this.state.heading = (this.state.heading + deltaHeadingDegrees + 360) % 360;

        // 2. Deslocamento usando o deltaTime
        const headingRad = (this.state.heading * Math.PI) / 180;
        const deltaNorteMetros = this.state.speed * Math.cos(headingRad) * this.deltaTime;
        const deltaLesteMetros = this.state.speed * Math.sin(headingRad) * this.deltaTime;

        // 3. Atualização do GPS
        this.state.lat += deltaNorteMetros / this.METERS_PER_DEGREE_LAT;
        this.state.lng += deltaLesteMetros / this.METERS_PER_DEGREE_LNG;

        if (this.state.speed < 0) this.state.speed = 0;

        return {
            deviceId: `realistic-${this.routeProfile}`,
            timestamp: this.timestamp,
            sensors: {
                accelX: parseFloat(this.addNoise(accelX, 0.15).toFixed(3)),
                accelY: parseFloat(this.addNoise(accelY, 0.15).toFixed(3)),
                accelZ: parseFloat(this.addNoise(9.81, 0.25).toFixed(3)),
                gyroX: parseFloat(this.addNoise(0, 0.02).toFixed(4)),
                gyroY: parseFloat(this.addNoise(0, 0.02).toFixed(4)),
                gyroZ: parseFloat(this.addNoise(gyroZ, 0.01).toFixed(4))
            },
            gps: {
                latitude: this.state.lat,
                longitude: this.state.lng,
                speed: parseFloat((this.state.speed * 3.6).toFixed(2)),
                heading: Math.round(this.state.heading)
            }
        };
    }
}