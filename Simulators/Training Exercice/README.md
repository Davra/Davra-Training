# Simulator Training Exercise

This folder contains a simple Node.js-based microservice used as part of the **Basic Modules – Final Exercise** in the Davra training program.

The service simulates engine temperature data and sends it to the Davra platform every 10 minutes.
<br><br>

## Overview

In this exercise, you will:

- Customize the simulator with your own device UUID and metric name  
- Configure authentication for your Davra instance  
- Test the simulator locally  
- Package it as a Docker container  
- Push it to your personal Docker Hub account
<br><br>

## Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/Davra/Davra-Training.git
cd Davra-Training/Simulators/Training Exercise
```

### 2. Install Dependencies

**Prerequisite:** Make sure you have **Node.js version 18 or higher** installed.  
Check your version with `node -v`. If needed, update Node.js before continuing.

```bash
npm install
```

### 3. Configure the Simulator

Open the `index.js` file and replace the following placeholders with your own values:

| Variable       | Description                                                    |
|----------------|----------------------------------------------------------------|
| USERNAME       | Your Davra platform username                        |
| PASSWORD       | Your Davra platform password                        |
| TENANT         | Your tenant name (subdomain) in the Davra URL                        |
| DEVICE_UUID    | UUID of the device you created in Davra                        |
| METRIC_NAME    | Your metric name (e.g., fb.engine.temperature_celsius)         |

You'll find these placeholder lines near the top of the file:

```bash
const USERNAME = "REPLACE_WITH_USERNAME";
const PASSWORD = "REPLACE_WITH_PASSWORD";
const TENANT = "REPLACE_WITH_YOUR_TENANT_NAME"; 
const DEVICE_UUID = "REPLACE_WITH_YOUR_DEVICE_UUID";
const METRIC_NAME = "REPLACE_WITH_YOUR_METRIC_NAME";
```

Update them accordingly before proceeding.

### 4. Run the Simulator Locally

To test the simulator locally before containerizing:

```bash
node index.js
```

This will send a temperature datapoint to the Davra platform every 10 minutes.  
You can adjust the interval in the code if needed.
<br><br>

## Docker Instructions

### 1. Build the Docker Image

```bash
docker build -t your-docker-hub-username/temp-simulator:latest .
```

Davra’s platform requires Docker images to be built for the `linux/amd64` **(x86_64)** architecture.

If you’re using a Mac with Apple Silicon (M1/M2), you **must** add the `--platform` flag when building your image:

```bash
docker build --platform linux/amd64 -t your-docker-hub-username/temp-simulator:latest .
```

### 2. Push to Docker Hub

```bash
docker login
docker push your-docker-hub-username/temp-simulator:latest
```

Replace `your-docker-hub-username` with your actual Docker Hub username, written in lowercase.