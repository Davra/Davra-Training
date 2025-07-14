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
import random


# Configuration for the app should be available in config.txt.
# It should contain the application name and version
appConfig = davraSdk.loadAppConfiguration()


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
    davraSdk.log(
        f"Starting device application {appConfig['applicationName']} {appConfig['applicationVersion']}"
    )

    # Instruct the SDK to attach to the mqtt topic and call our function when a message is received
    # Also inform the SDK of the name of this Device Application
    davraSdk.connectToAgent(appConfig["applicationName"])
    # Wait (for a max of timeout seconds) until the agent is available to communicate
    davraSdk.waitUntilAgentIsConnected(600)

    registerActions()

    # Demonstration of how to listen to any communication on the device (the agent or other apps)
    # davraSdk.listenToAllMessagesFromAgent(onAnyMessageReceived)

    # Demonstration of how to send a miscellaneous message to the agent
    davraSdk.sendMessageFromAppToAgent({"message": "Demoing Device App"})

    countMainLoop = 0
    while True:
        # Only every n seconds
        if countMainLoop % 15 == 0:
            davraSdk.log("Checking twin state")

        if countMainLoop % 60 == 0:
            davraSdk.log("Application running: " + appConfig["applicationName"])
        if countMainLoop % 30 == 0:
            # Demonstration of sending a simple metric reading to the server
            randomValue = random.randint(1000, 8500)
            davraSdk.sendIotData(
                {
                    "name": "davra.training.weight",
                    "value": randomValue,
                    "msg_type": "datum",
                }
            )
        countMainLoop += 1
        time.sleep(1)
    # End Main loop
