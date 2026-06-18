import { TelemetryPayload } from "src/telemetry-simulator/interfaces/telemetry.interface";
import { DrivingEvent } from "../interfaces/driving-event.interface";
import { DrivingEventType } from "../enums/driving-event-type.enum";

export class HardAccelerationDetector {
    private threshold: number;

    constructor(threshold = 3){
        this.threshold = threshold;
    }

    public detect(data: TelemetryPayload): DrivingEvent | null {
        if(data.sensors.accelX > this.threshold) {
            return({
                type: DrivingEventType.HARD_ACCELERATION,
                measuredValue: data.sensors.accelX,
                timestamp: data.timestamp,
                severity: data.sensors.accelX / this.threshold
            })
        } else {
            return null
        }
    }
}