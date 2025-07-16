/**
 * Temperature Simulator Microservice
 * -----------------------------------
 * This Node.js script simulates engine temperature readings and sends them
 * to the Davra platform via the IoT Data API every 10 minutes.
 *
 * Configuration:
 * - Replace the USERNAME and PASSWORD with your Davra credentials.
 * - Set the TENANT to your Davra tenant name (used in the API URL).
 * - Provide the DEVICE_UUID for the device you're simulating data for.
 * - Set the METRIC_NAME to the appropriate metric name created in your platform.
 *
 * This script sends a random temperature value between 25°C and 35°C, with
 * occasional spikes between 50°C and 60°C to simulate overheating events.
 */

// === Configuration - REPLACE THESE VALUES ===
const USERNAME = "REPLACE_WITH_YOUR_USERNAME";
const PASSWORD = "REPLACE_WITH_YOUR_PASSWORD";
const TENANT = "REPLACE_WITH_YOUR_TENANT_NAME";                 // e.g. training
const DEVICE_UUID = "REPLACE_WITH_YOUR_DEVICE_UUID";
const METRIC_NAME = "REPLACE_WITH_YOUR_METRIC_NAME";            // e.g. jd.engine.temperature_celsius

const API_URL = `https://${TENANT}.davra.com/api/v1/iotdata`;   // e.g. https://training.davra.com/api/v1/iotdata
const AUTH_HEADER = "Basic " + Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");

// === Simulation settings ===
const SEND_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

// Simulate temperature values with occasional spikes
function simulateTemperature() {
  let temperature;
  if (Math.random() < 0.20) {
    // 20% chance: spike between 50–60°C
    temperature = +(50 + Math.random() * 10).toFixed(1);
  } else {
    // 80% chance: normal range 25–35°C
    temperature = +(25 + Math.random() * 10).toFixed(1);
  }
  if (temperature >= 40) {
    console.warn(`ALERT: Engine temperature spike! Temp = ${temperature}°C`);
  }
  return temperature;
}

// Generate the data payload according to Davra API
function generatePayload(uuid, metricName, value) {
  return {
    UUID: uuid,
    timestamp: Date.now(),
    name: metricName,
    value,
    msg_type: "datum"
  };
}

// Send the data to Davra platform
async function sendIoTData(payload) {
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Authorization": AUTH_HEADER,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([payload])
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`Data sent: ${payload.UUID} - ${payload.name}: ${payload.value}`);
  } catch (err) {
    console.error("Error sending IoT data:", err.message);
  }
}

// Main loop - send simulated data every SEND_INTERVAL_MS
setInterval(() => {
  const temp = simulateTemperature();
  const payload = generatePayload(DEVICE_UUID, METRIC_NAME, temp);
  sendIoTData(payload);
}, SEND_INTERVAL_MS);

// Initial run immediately on start
(() => {
  const temp = simulateTemperature();
  const payload = generatePayload(DEVICE_UUID, METRIC_NAME, temp);
  sendIoTData(payload);
})();
