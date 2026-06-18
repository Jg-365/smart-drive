import { TelemetryPayload } from "src/telemetry-simulator/interfaces/telemetry.interface";
import { DrivingEvent } from "../interfaces/driving-event.interface";
import { DrivingEventType } from "../enums/driving-event-type.enum";

export class GpsLossDetector {

    public detect(data: TelemetryPayload): DrivingEvent | null{
        if(data.gps.latitude == 0 && data.gps.longitude == 0 && data.gps.heading == 0 && data.gps.speed == 0) {
            return({
                type: DrivingEventType.GPS_LOSS,
                measuredValue: 0,
                timestamp: data.timestamp,
                severity: 1
            })
        } else {
            return null
        }
    }
}