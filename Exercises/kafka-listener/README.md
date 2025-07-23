# Kafka Listener Exercise

This folder contains a simple Node.js-based microservice used as part of the **Advance Modules – Final Exercise** in the Davra training program.

This service extends the original Temperature Simulator developed in the Basic Modules exercise by adding a Kafka listener to react to real-time metric changes.
It reuses the same logic to periodically simulate and send engine temperature values via the Davra IoT Data API, and now also listens for live messages on a Kafka topic. When a relevant message is received, it sends an event-type payload with both the new and previous metric values.

This allows the service to behave both as a data simulator and a reactive event forwarder, showcasing a real-world combination of scheduled simulation and real-time automation.
<br><br>

## Overview

In this exercise, you will:

- Customize the simulator with your own device UUID and metric name  
- Configure authentication for your Davra instance  
- Extend the simulator by adding a Kafka listener for real-time metric events  
- Package the service as a Docker container  
- Push it to your personal Docker Hub account
<br><br>

## Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/Davra/Davra-Training.git
cd Davra-Training/Exercises/kafka-listener
```

### 2. Configure the Microservice

This microservice uses environment variables to manage configuration for both the temperature simulator and Kafka event listener.

Update the `.env` file in the root of the project with your own values:

| Variable      | Description                                                            |
|---------------|------------------------------------------------------------------------|
| API_HOST      | Full base URL of your Davra tenant (e.g., https://training.davra.com)  |
| BEARER_TOKEN  | Bearer token used to authenticate requests to the Davra API            |
| DEVICE_UUID   | UUID of the device you created in Davra                                |
| METRIC_NAME   | Your metric name (e.g., fb.engine.temperature_celsius)                 |
| EVENT_NAME    | Your event name (e.g., fb.event.engine_temperature_change)             |

You'll find these lines in the `.env` file:

```bash
API_HOST=https://your-tenant-name.davra.com
BEARER_TOKEN=your_token_here
DEVICE_UUID=your_device_uuid_here
METRIC_NAME=your_metric_name_here
EVENT_NAME=your_event_name_here
```

If deployed as a microservice in Davra, the bearer token will be read automatically from `/etc/connecthing-api/token`. The `.env` token is only required for local development.

### 3. Install Dependencies

**Prerequisite:** Make sure you have **Node.js version 18 or higher** installed.  
Check your version with `node -v`. If needed, update Node.js before continuing.

```bash
npm install
```

## Docker Instructions

### 1. Build the Docker Image

```bash
docker build -t your-docker-hub-username/kafka-listener:latest .
```

Davra’s platform requires Docker images to be built for the `linux/amd64` **(x86_64)** architecture.

If you’re using a Mac with Apple Silicon (M1/M2), you **must** add the `--platform` flag when building your image:

```bash
docker build --platform linux/amd64 -t your-docker-hub-username/kafka-listener:latest .
```

### 2. Push to Docker Hub

```bash
docker login
docker push your-docker-hub-username/kafka-listener:latest
```

Replace `your-docker-hub-username` with your actual Docker Hub username, written in lowercase.