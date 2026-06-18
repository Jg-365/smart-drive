import { Injectable } from "@nestjs/common";
import { HardAccelerationDetector } from "../detectors/hard-acceleration.detector";
import { HardBrakeDetector } from "../detectors/hard-brake.detector";
import { SharpTurnDetector } from "../detectors/sharp-turn.detector";
import { TelemetryPayload } from "src/telemetry-simulator/interfaces/telemetry.interface";
import { DrivingEvent } from "../interfaces/driving-event.interface";
import { GpsLossDetector } from "../detectors/gps-loss.detector";

@Injectable()
export class DrivingEventDetectorService {

  private detectors = [
    new HardAccelerationDetector(),
    new HardBrakeDetector(),
    new SharpTurnDetector(),
    new GpsLossDetector()
  ];

  detect(
    telemetry: TelemetryPayload,
  ): DrivingEvent[] {

    const events: DrivingEvent[] = [];

    for (const detector of this.detectors) {
      const event = detector.detect(telemetry);

      if (event) {
        events.push(event);
      }
    }

    return events;
  }
}