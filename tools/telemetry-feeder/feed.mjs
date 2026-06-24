#!/usr/bin/env node
// Dev feeder — faz POST /telemetry em loop simulando uma direção, para ver o
// dashboard ao vivo sem ESP32 nem simulador do Nathan. Exercita o caminho real:
// POST /telemetry → TelemetryGateway → WS telemetry:new → store → dashboard.
//
// Uso:
//   node tools/telemetry-feeder/feed.mjs
//   API_URL=http://localhost:3001 TRIP_ID=demo-session-001 HZ=5 node tools/telemetry-feeder/feed.mjs
//
// Combine com o frontend rodando com NEXT_PUBLIC_DEV_TRIP_ID = mesmo TRIP_ID.
// (Backend precisa estar de pé — npm run start:dev em backend/smart-drive.)

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const TRIP_ID = process.env.TRIP_ID ?? 'demo-session-001';
const DEVICE_ID = process.env.DEVICE_ID ?? 'esp32-demo-001';
const VEHICLE_ID = process.env.VEHICLE_ID ?? 'vehicle-001';
const HZ = Number(process.env.HZ ?? 5);
const G = 9.80665;

// Trajeto base (Fortaleza/CE) — caminha um pouco a cada passo.
let lat = -3.73192;
let lng = -38.52674;
let speed = 0; // km/h
let t = 0;

function nextSample() {
  t += 1;
  // velocidade: sobe/desce suavemente entre 0 e ~80
  const target = 40 + 35 * Math.sin(t / 40);
  speed += (target - speed) * 0.1;
  speed = Math.max(0, speed);

  // anda na direção ~SE proporcional à velocidade
  lat -= speed * 1e-6;
  lng += speed * 8e-7;

  // aceleração base (ruído) + eventos esporádicos
  let ax = (Math.random() - 0.5) * 1.5;
  let ay = (Math.random() - 0.5) * 1.5;
  const az = G + (Math.random() - 0.5) * 0.6;

  const events = {
    hardAcceleration: false,
    hardBrake: false,
    sharpTurn: false,
    impactSuspected: false,
  };
  const roll = Math.random();
  if (roll < 0.04) { events.hardBrake = true; ax = -7.5; }
  else if (roll < 0.08) { events.hardAcceleration = true; ax = 6.5; }
  else if (roll < 0.12) { events.sharpTurn = true; ay = 5.5; }

  return {
    deviceId: DEVICE_ID,
    vehicleId: VEHICLE_ID,
    sessionId: TRIP_ID,
    timestamp: Date.now(),
    gps: { lat, lng, speedKmh: Math.round(speed * 10) / 10, satellites: 9, hdop: 1.1 },
    imu: { accelX: ax, accelY: ay, accelZ: az, gyroX: 0, gyroY: 0, gyroZ: 0 },
    events,
    battery: { voltage: 3.9, percentage: 80 },
  };
}

async function post(sample) {
  try {
    const res = await fetch(`${API_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
    });
    const flags = Object.entries(sample.events)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',');
    process.stdout.write(
      `\r[${res.status}] ${String(Math.round(sample.gps.speedKmh)).padStart(3)} km/h  ` +
        `lat ${sample.gps.lat.toFixed(5)}  ${flags ? '⚡ ' + flags : '          '}   `,
    );
  } catch (err) {
    process.stdout.write(`\n⚠ falha no POST (${API_URL} de pé?): ${err.message}\n`);
  }
}

console.log(`Feeding ${API_URL}/telemetry  trip=${TRIP_ID}  @${HZ}Hz  (Ctrl+C para parar)`);
const interval = setInterval(() => void post(nextSample()), Math.round(1000 / HZ));
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\nparado.');
  process.exit(0);
});
