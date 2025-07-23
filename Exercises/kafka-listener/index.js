/**
 * Engine Temperature Microservice
 * -----------------------------------
 * This Node.js microservice simulates engine temperature readings and listens for
 * Kafka metric updates, sending both simulated and event-driven data to the Davra
 * platform via the IoT Data API.
 *
 * Features:
 * - Simulates a temperature value every 10 minutes (25°C–35°C normal range, occasional spikes 50°C–60°C)
 * - Listens to a Kafka topic for metric changes and sends structured "event" messages when values change
 *
 * Configuration:
 * - Update the `.env` file with the following values:
 *     - API_HOST: Full base URL of your tenant (e.g., https://training.davra.com)
 *     - BEARER_TOKEN: Your Davra API token (used during local development)
 *     - DEVICE_UUID: UUID of the device you're simulating data for
 *     - METRIC_NAME: Metric name as defined in your Davra platform
 *     - EVENT_NAME: Event name (e.g., jd.event.engine_temperature_change)
 *
 * - When deployed as a Davra microservice, the script will automatically use:
 *     - Auth token from /etc/connecthing-api/token
 *     - Internal API host http://api.connecthing
 *     - TLS certificates from /etc/davra/tls
 *     - Kafka host, consumer group ID, and topic name
 *
 * This microservice combines scheduled telemetry and reactive event detection,
 * providing a realistic foundation for IoT workflows and automation testing.
 */

require("dotenv").config();
const { readFileSync } = require("fs");
const kafka = require("kafka-node");

// === 1. CONFIGURATION ===

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

// === 2. TEMPERATURE SIMULATOR ===
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

// Generate a Davra IoT Data API payload (datum or event)
function generatePayload(uuid, name, value, type) {
  return {
    UUID: uuid,
    timestamp: Date.now(),
    name,
    value,
    msg_type: type
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

    const sourceLabel = payload.msg_type === "event" ? "EVENT" : "SIMULATOR";
    console.log(`[${sourceLabel}] Data sent to ${payload.UUID} (${payload.name})`, payload.value);
  } catch (err) {
    console.error("[SIMULATOR] Error sending IoT data:", err.message);
  }
}

// Start the simulator loop
function startTemperatureSimulation() {
  const temp = simulateTemperature();
  const payload = generatePayload(DEVICE_UUID, METRIC_NAME, temp, "datum");
  sendIoTData(payload);
  setInterval(() => {
    const temp = simulateTemperature();
    const payload = generatePayload(DEVICE_UUID, METRIC_NAME, temp, "datum");
    sendIoTData(payload);
  }, SEND_INTERVAL_MS);
}

// === 3. KAFKA CONSUMER SETUP ===
let lastDatumValue = null;
const TLS_PATH = '/etc/davra/tls';

function startKafkaListener() {
  const ConsumerGroup = kafka.ConsumerGroup;
  const consumer = new ConsumerGroup({
    kafkaHost: process.env.KAFKA_HOST,
    groupId: process.env.KAFKA_CONSUMER_GROUP_ID,
    fromOffset: "earliest",
    ssl: true,
    sslOptions: {
      key: readFileSync(`${TLS_PATH}/tls.key`),
      cert: readFileSync(`${TLS_PATH}/tls.crt`),
      ca: [readFileSync(`${TLS_PATH}/ca-cert`)],
      rejectUnauthorized: false
    }
  }, [process.env.IoT_DATA_TOPIC_NAME]);

  consumer.on("error", function (err) {
    console.error("[KAFKA] Consumer error:", err);
    process.exit(1);
  });

  consumer.on("message", function (message) {
    try {
      const datum = JSON.parse(message.value);
      if (datum.name === METRIC_NAME) {
        console.log(`[KAFKA] Received metric ${datum.name} = ${datum.value}`);

        //if (datum.value !== lastDatumValue && (datum.value == 1 || datum.value == 2)) {
        if (datum.value !== lastDatumValue) {
          const value = {
            newValue: datum.value,
            oldValue: lastDatumValue
          };
          const payload = generatePayload(DEVICE_UUID, METRIC_NAME, value, "event");
          sendIoTData(payload);

          lastDatumValue = datum.value;
        }
      }
    } catch (err) {
      console.error("[KAFKA] Failed to parse message:", err.message);
    }
  });
}

// === 4. STARTUP ===
console.log("[SYSTEM] Starting Temperature Simulator + Kafka Listener...");
startTemperatureSimulation();
startKafkaListener();