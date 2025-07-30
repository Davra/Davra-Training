# Vue App Exercise

This folder contains a simple Vue app used as part of the **Advanced Topics – Final Exercise** in the Davra training program.
<br><br>

## Overview

In this exercise, you will:

- Set up a vanity URL (Named Virtual Host) for your microservice
- Create and configure an OAuth client to secure your app
- Personalize the OAuth login screen for branding 
- Configure the app by updating the .env file with your tenant, OAuth, and microservice credentials
- Run the app locally to test it using the Davra API
- Extend the app by implementing a complete Devices Management section
- Build, push, and deploy the app as a Docker image on the Davra platform
<br><br>

## Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/Davra/Davra-Training.git
cd Davra-Training/Exercises/vue-app
```

### 2. Configure the App

This app uses environment variables to manage configuration.

Update the `.env` file in the root of the project with your own values:

| Variable          | Description                                                            |
|-------------------|------------------------------------------------------------------------|
| VITE_API_HOST     | Full base URL of your Davra tenant (e.g., https://training.davra.com)  |
| VITE_BEARER_TOKEN | Bearer token used to authenticate requests to the Davra API            |
| MICROSERVICE_URL  | Public URL of this microservice                                        |
| CLIENT_ID         | OAuth client ID for your application                                   |
| CLIENT_SECRET     | OAuth client secret for your application                               |
| SESSION_SECRET    | Secret key used to sign session cookies.                               |

You'll find these lines in the `.env` file:

```bash
VITE_API_HOST=https://your-tenant-name.davra.com
VITE_BEARER_TOKEN=your-token-here
MICROSERVICE_URL=your-microservice-url-here
CLIENT_ID=your-client-id-here
CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=your-session-secret-here
```

If deployed as a microservice in Davra, the bearer token will be read automatically from `/etc/connecthing-api/token`. The `.env` token is only required for local development.

### 3. Install Dependencies

**Prerequisite:** Make sure you have **Node.js version 18 or higher** installed.  
Check your version with `node -v`. If needed, update Node.js before continuing.

```bash
npm install
```

### 4. Run the App Locally

To test the app locally before containerizing:

```bash
npm run dev
```

## Docker Instructions

### 1. Build the Docker Image

```bash
docker build -t <your-docker-hub-username>/vue-app:1.0.0 .
```

Davra’s platform requires Docker images to be built for the `linux/amd64` **(x86_64)** architecture.

If you’re using a Mac with Apple Silicon (M1/M2), you **must** add the `--platform` flag when building your image:

```bash
docker build --platform linux/amd64 -t <your-docker-hub-username>/vue-app:1.0.0 .
```

### 2. Push to Docker Hub

```bash
docker login
docker push <your-docker-hub-username>/vue-app:1.0.0
```

Replace `<your-docker-hub-username>` with your actual Docker Hub username, written in lowercase.