import { TelemetryPayload } from "src/telemetry-simulator/interfaces/telemetry.interface";
import { DrivingEvent } from "../interfaces/driving-event.interface";
import { DrivingEventType } from "../enums/driving-event-type.enum";

export class HardBrakeDetector {
    private threshold: number;

    constructor(threshold = 3.8){
        this.threshold = -threshold;
    }

    public detect(data: TelemetryPayload): DrivingEvent | null{
        if(data.sensors.accelX < this.threshold) {
            return({
                type: DrivingEventType.HARD_BRAKE,
                measuredValue: data.sensors.accelX,
                threshold: this.threshold,
                timestamp: data.timestamp,
                severity: data.sensors.accelX / this.threshold
            })
        } else {
            return null
        }
    }
}