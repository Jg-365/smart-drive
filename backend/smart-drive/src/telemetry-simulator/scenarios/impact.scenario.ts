import { BaseScenario } from './base-scenario';

export class ImpactScenario extends BaseScenario {
  next() {
    return this.createPayload(
      0,
      15,
      12,
      18,
      5,
      4,
      5,
    );
  }
}