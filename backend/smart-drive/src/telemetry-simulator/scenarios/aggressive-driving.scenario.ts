import { BaseScenario } from './base-scenario';

export class AggressiveDrivingScenario extends BaseScenario {
  private speed = 40;

  next() {
    const random = Math.random();

    if (random < 0.3) {
      this.speed += 12;

      return this.createPayload(
        this.speed,
        4.5,
        0.5,
        9.8,
        0.3,
        0.1,
        0.1,
      );
    }

    if (random < 0.6) {
      this.speed -= 10;

      return this.createPayload(
        this.speed,
        -4.2,
        0.3,
        9.8,
        0.2,
        0.1,
        0.1,
      );
    }

    return this.createPayload(
      this.speed,
      0.5,
      2.5,
      9.8,
      0.1,
      0.3,
      0.2,
    );
  }
}