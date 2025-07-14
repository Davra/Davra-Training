# A Sample Device Application
# This imports the Davra Device SDK
# Which connects to the Davra Device Agent
# and from there to the Davra server
#
import time
from requests.auth import HTTPBasicAuth
import json
import davra_sdk as davraSdk
import davra_lib as comDavra
import RPi.GPIO as GPIO

# Configuration for the app should be available in config.txt.
# It should contain the application name and version
appConfig = davraSdk.loadAppConfiguration()

GREEN_LED = 18 # On if the train is in motion
YELLOW_LED = 23 # On when the weight over 8000
RED_LED = 24 # On when the weight is over 10000
SERVICE_RUNNING_LED = 16

def watchTwinState():
    twinUUID = ""
    url = f"https://fordlab.davra.com/api/v1/twins/{twinUUID}"
    r = comDavra.httpGet(url)
    labels = json.loads(r.content).get("customAttributes")

    # If in motion = true, turn on a LED on the device
    if labels == {}: 
        return "No labels"
    else:
        return labels.get('inMotion')


def toggleLED(functionInfo):
    try:
        powerLED(RED_LED, True)
    except KeyboardInterrupt:
        GPIO.cleanup()

    davraSdk.sendMessageFromAppToAgent(
        {
            "finishedFunctionOnApp": functionInfo["functionName"],
            "status": "completed",
            "response": "complete",
        }
    )
    return

def powerLED(pin, state):
    davraSdk.log(f"App received instruction to toggle an led {state}")
    GPIO.output(pin, state if GPIO.HIGH else GPIO.LOW)
    return

def registerActions():
    # Inform the Agent and Platform server that this application can do tasks on the device
    davraSdk.registerCapability(
        "agent-action-getProcessListing",
        {
            "functionParameters": {},
            "functionLabel": "Get the list of processes running",
            "functionDescription": "Get the list of processes running on the device",
        },
        getProcessListing,
    )

    # Register the LED toggle capability
    davraSdk.registerCapability(
        "agent-action-toggleLEDs",
        {
            "functionParameters": {},
            "functionLabel": "Toggles Device LEDs",
            "functionDescription": "Toggles 2 LEDs for 1 second each on the device",
        },
        toggleLED,
    )

    return

def setupGPIO():
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(GREEN_LED, GPIO.OUT)
    GPIO.setup(YELLOW_LED, GPIO.OUT)
    GPIO.setup(RED_LED, GPIO.OUT)
    GPIO.setup(SERVICE_RUNNING_LED, GPIO.OUT)
    GPIO.output(GREEN_LED, GPIO.LOW)
    GPIO.output(YELLOW_LED, GPIO.LOW)
    GPIO.output(RED_LED, GPIO.LOW)
    GPIO.output(SERVICE_RUNNING_LED, GPIO.LOW)
    return

def getProcessListing(functionInfo):
    davraSdk.log("App received instruction to get process listing ")
    s = davraSdk.runCommandWithTimeout("ps -ef ", 10)
    davraSdk.sendMessageFromAppToAgent(
        {
            "finishedFunctionOnApp": functionInfo["functionName"],
            "status": "completed",
            "response": str(s[1]),
        }
    )
    return

def onAnyMessageReceived(msg):
    payload = str(msg.payload)
    if davraSdk.isJson(payload) == False:
        return
    msg = json.loads(payload)
    # Was this message from this app itself
    if "fromApp" in msg and msg["fromApp"] == appConfig["applicationName"]:
        return
    else:
        # Was this message from the Device Agent
        if "fromAgent" in msg:
            davraSdk.log("A message was received from Device Agent")
    return

###########################   MAIN LOOP   ###########################
if __name__ == "__main__":
    davraSdk.log(f"Starting device application {appConfig['applicationName']} {appConfig['applicationVersion']}")

    # Instruct the SDK to attach to the mqtt topic and call our function when a message is received
    # Also inform the SDK of the name of this Device Application
    davraSdk.connectToAgent(appConfig["applicationName"])
    # Wait (for a max of timeout seconds) until the agent is available to communicate
    davraSdk.waitUntilAgentIsConnected(600)

    registerActions()

    setupGPIO()

    # Demonstration of how to listen to any communication on the device (the agent or other apps)
    davraSdk.listenToAllMessagesFromAgent(onAnyMessageReceived)

    # Demonstration of how to send a miscellaneous message to the agent
    davraSdk.sendMessageFromAppToAgent({"message": "Demoing Device App"})

    # Turn on power light to show service is running
    powerLED(SERVICE_RUNNING_LED, True)

    countMainLoop = 0
    while True:
        # Only every n seconds
        if countMainLoop % 15 == 0:
            davraSdk.log("Checking twin state")
            # TODO: Add in check state and set LED if in motions
            if watchTwinState():
                powerLED(GREEN_LED, True)
            else:
                powerLED(GREEN_LED, False)

        if countMainLoop % 60 == 0:
            davraSdk.log("Application running: " + appConfig["applicationName"])
        if countMainLoop % 30 == 0:
            # Demonstration of sending a simple metric reading to the server
            davraSdk.sendMetricValue("counter", countMainLoop)
        countMainLoop += 1
        time.sleep(1)
    # End Main loop