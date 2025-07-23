/**
 * Temperature Simulator Microservice
 * -----------------------------------
 * This Node.js script simulates engine temperature readings and sends them
 * to the Davra platform via the IoT Data API every 10 minutes.
 *
 * Configuration:
 * - Update the `.env` file with the following values:
 *     - API_HOST: Full base URL of your tenant (e.g., https://training.davra.com)
 *     - BEARER_TOKEN: Your Davra API token (used during local development)
 *     - DEVICE_UUID: UUID of the device you're simulating data for
 *     - METRIC_NAME: Metric name as defined in your Davra platform
 *
 * - When deployed as a Davra microservice, the script will automatically use
 *   the token stored at /etc/connecthing-api/token and the internal API host
 *   http://api.connecthing instead of values from the `.env` file.
 *
 * This script sends a random temperature value between 25°C and 35°C, with
 * occasional spikes between 50°C and 60°C to simulate overheating events.
 */

const { readFileSync } = require("fs");
require("dotenv").config();

// === Configuration ===

let apiUrl;
let token;

try {
  // Try reading token from file (used when running inside a Davra microservice container)
  apiUrl = "http://api.connecthing/api/v1/iotdata";
  token = readFileSync("/etc/connecthing-api/token", "utf8").trim();
  console.log("[INFO] Using microservice token from file");
} catch (err) {
  // Fallback to environment variables
  apiUrl = `${process.env.API_HOST}/api/v1/iotdata`;
  token = process.env.BEARER_TOKEN;
  console.log("[INFO] Using environment token and host");
}

const DEVICE_UUID = process.env.DEVICE_UUID;
const METRIC_NAME = process.env.METRIC_NAME;

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
  if (temperature >= 50) {
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
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([payload])
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    console.log(`Data sent to ${payload.UUID} (${payload.name}): ${payload.value}`);
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
