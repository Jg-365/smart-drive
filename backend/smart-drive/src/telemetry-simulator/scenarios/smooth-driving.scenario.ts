import { BaseScenario } from './base-scenario';

export class SmoothDrivingScenario extends BaseScenario {
    private speed = 20;

    next() {
        this.speed += Math.random() * 2 - 1;

        return this.createPayload(
        this.speed,
        0.2,
        0.1,
        9.8,
        0.02,
        0.01,
        0.03,
        );
    }
}