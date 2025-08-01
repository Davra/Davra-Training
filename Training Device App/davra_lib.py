# Utility functions for other programs
#
import subprocess
import os, string
import time, requests, os.path
from requests.auth import HTTPBasicAuth
import json 
from pprint import pprint
import sys
import uuid
from datetime import datetime

# Update this when anything changes in the agent
davraAgentVersion = "1_7_3" 

installationDir = "/usr/bin/davra"
# Config file for the agent running on this device
agentConfigFile = installationDir + "/config.json"
# Where logs are saved by default
logDir = "/var/log"
# Flags to indicate cache entries
flagNewCapabilityReadyToReport = False


# Load configuration if it exists
conf = {}
def loadConfiguration():
    global conf
    try:
        if(os.path.isfile(agentConfigFile) is True):
            with open(agentConfigFile) as data_file:
                conf = json.load(data_file)
    except:
        print(('ERROR: Cannot read config file ' + agentConfigFile))
loadConfiguration()


def getConfiguration():
    return conf


# Update (or insert) a configuration item with a value
def upsertConfigurationItem(itemKey, itemValue):
    global conf
    loadConfiguration()
    if(os.path.isfile(agentConfigFile) is True):
        # If this a new key or an alteration of the current config
        if((itemKey in conf) == False or conf[itemKey] != itemValue):
            # Update the item
            conf[itemKey] = itemValue
            # Write the full config file to disk
            with open(agentConfigFile, 'w') as outfile:
                json.dump(conf, outfile, indent=4)
            time.sleep(0.2)
            # Update local cached version of configs
            loadConfiguration()
            # Report the new configuration to the server as an event
            reportDeviceConfigurationToServer()
    return


# Send all of the configuration file to the server as an event
def reportDeviceConfigurationToServer():
    dataToSend = { 
        "UUID": conf['UUID'],
        "name": "davra.agent.configured",
        "value": {
            'deviceConfig': conf
        },
        "msg_type": "event"
    }
    # Inform user of the overall data being sent for a single metric
    logInfo('Sending configuration file to server: ' + conf['server'])
    logInfo(json.dumps(dataToSend, indent=4))
    sendDataToServer(dataToSend)
    log("reportDeviceConfigurationToServer finished.")
    return

# Send a log message to the server
def logToServer(severity, message):
    # Do not send log to server if severity not in the required set
    if(severity not in "ERROR,WARN,INFO"):
        return
    dataToSend = { 
        "UUID": conf['UUID'],
        "name": "davra.log",
        "value": {
            "severity": severity,
            "message": message
        }
    }
    sendLogToServer(dataToSend)
    return

# Send various severities of log messages with easy function names
def logDebug(log_msg):
    log(log_msg, "DEBUG")

def logInfo(log_msg):
    log(log_msg, "INFO")

def logWarning(log_msg):
    log(log_msg, "WARN")

def logError(log_msg):
    log(log_msg.decode('utf8'), "ERROR")

# Log a message to disk and console
def log(log_msg, severity = "DEBUG"):
    log_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_msg = str(log_msg)
    try:
        file_size = os.path.getsize(logDir + "/davra_agent.log")
    except:
        os.system("touch " + logDir + "/davra_agent.log")
    try:
        print((log_time + ": " + log_msg)) # Echo to stdout as well as the file
        if file_size > 10000000:
            os.system("mv " + logDir + "/davra_agent.log " + logDir + "/davra_agent.log.old")
        logfile = open(logDir + "/davra_agent.log", "a")
        logfile.write(log_time + ": " + log_msg + "\n")
        logfile.close()
        # Only send log to server if above the log level required
        logToServer(severity, log_msg)
    except Exception as e:
        print("Error: Logging to file failed " + str(e))


def getHeadersForRequests():
    headersTmp = {'Accept' : 'application/json', \
        'Content-Type' : 'application/json', \
        'Authorization': 'Bearer ' + conf['apiToken']}
    return headersTmp


def createMetricOnServer(metricName, metricUnits, metricDescription):
    #contents = '[{ "name": "' + metricName + '", '\
    #    + '"label": "' + metricName + '", '\
    #    + '"description": "' + metricDescription + '", '\
    #    + '"semantics": "metric" }]'
    contents = [ { "name": metricName, "label": metricName, "description": metricDescription, "semantics": "metric" } ]
    headers = getHeadersForRequests()
    r = httpPost(conf['server'] + '/api/v1/iotdata/meta-data', contents)
    if(r.status_code == 200):
        log("Metric created on server: " + metricName)
    else:
        log("Failed to create metric on server: " + metricName + ' : ' + str(r.status_code))
    return


# When sending iot data, this is a shorter function to use then regular put
def sendDataToServer(dataToSend):
    responseFromServer = httpPut(conf['server'] + '/api/v1/iotdata', dataToSend)
    return(responseFromServer)

def sendLogToServer(dataToSend):
    responseFromServer = httpPut(conf['server'] + '/api/v1/logs', dataToSend)
    return(responseFromServer)


# For when a http request fails, use this to return a similar object
class emptyRequestsObject(object):
    status_code = 500
    content = ""

# Make a http request of type PUT
# Supply the destination API endpoint as string and the dataToSend as JSON object
def httpPut(destination, dataToSend):
    headers = getHeadersForRequests()
    try:
        r = requests.put(destination, data=json.dumps(dataToSend), headers=headers, timeout=20)
        if (r.status_code == 200):
            #print('Sent data to server ' + r.content)
            return(r)
        else:
            log("Issue while sending data to server. " + str(r))
            return(r)
    except Exception as e:
        log('Failed to make http PUT:' + str(destination) + " : " \
        + json.dumps(dataToSend) + " \n Error: " + str(e))
        return(emptyRequestsObject())



# Make a http request of type POST
# Supply the destination API endpoint as string and the dataToSend as JSON object
def httpPost(destination, dataToSend):
    headers = getHeadersForRequests()
    try:
        r = requests.post(destination, data=json.dumps(dataToSend), headers=headers, timeout=20)
        if (r.status_code == 200):
            #print('Sent data to server ' + r.content)
            return(r)
        else:
            log("Issue while sending data to server. " + str(r))
            return(r)
    except Exception as e:
        log('Failed to make http PUT:' + str(destination) + " : " \
        + json.dumps(dataToSend) + " \n Error: " + str(e))
        return(emptyRequestsObject())


# Make a http request of type GET
# Supply the destination API endpoint as string
def httpGet(destination):
    headers = getHeadersForRequests()
    try:
        r = requests.get(destination, headers=headers, timeout=20)
        if (r.status_code == 200):
            return(r)
        else:
            log("Issue while making http GET. " + str(r))
            return(r)
    except Exception as e:
        log('Failed to make http GET:' + str(destination) + " : \n Error: " + str(e))
        return(emptyRequestsObject())


# Send the device capabilities from config file up to server at /api/v1/devices
def reportDeviceCapabilities():
    headers = getHeadersForRequests()
    dataToSend = { "capabilities": conf["capabilities"] }
    log('Reporting device capabilities to server ' + str(dataToSend))
    r = httpPut(conf['server'] + '/api/v1/devices/' + conf["UUID"], dataToSend)
    if (r.status_code == 200):
        log('Reported device capabilities to server ' + str(r.content))
        return(r.status_code)
    else:
        log("Issue while reporting capabilities to server. " + str(r.status_code))
        log(r.content)
        return(r.status_code) 


# Update (or insert) a configuration item with a capability for this device
def registerDeviceCapability(itemKey, itemValue):
    logInfo('registerDeviceCapability ' + str(itemKey) + ': ' + str(itemValue));
    listCapabilities = conf["capabilities"] if "capabilities" in conf else {}
    # If the capability was already known (and in the config.info)
    if((itemKey in listCapabilities) == False or listCapabilities[itemKey] != itemValue):
        log('registerDeviceCapability : this is a new capability')
        listCapabilities[itemKey] = itemValue
        upsertConfigurationItem("capabilities", listCapabilities)
        reportDeviceCapabilities()
    return;


# Delete a configuration item of a capability for this device
def unregisterDeviceCapability(itemKey):
    logInfo('unregisterDeviceCapability ' + str(itemKey));
    listCapabilities = conf["capabilities"] 
    # If the capability was already known (and in the config.info)
    if((itemKey in listCapabilities) == True):
        listCapabilities.pop(itemKey)
        upsertConfigurationItem("capabilities", listCapabilities)
        reportDeviceCapabilities()
    return;


def getLanIpAddress():
    # Returns the current LAN IP address.
    arg = "ip route list"
    p = subprocess.Popen(arg,shell=True,text=True,stdout=subprocess.PIPE)
    data = p.communicate()
    logInfo(data)
    split_data = data[0].split()
    ipaddr = split_data[split_data.index("src")+1]
    return ipaddr




###########################   MQTT


def checkIsAgentMqttBrokerInstalled():
    checkProcess = runCommandWithTimeout(' systemctl status mosquitto ', 10)[1]
    if(len(checkProcess) > 5):
        return True
    else:
        return False



###########################   RUN OS COMMANDS


# Runs command on operating system 
def runNativeCommand(arrayCommandLineParts = []):
    log("Running native command " + str(arrayCommandLineParts))
    try:
        s = subprocess.run(arrayCommandLineParts, capture_output=True, text=True).stdout
        log('Response after cmd:' + str(s))
        return s
    except Exception as e:
        log('Failed to run command:' + str(s) + " : " + str(e))
        return 'unknown'


def runNativeCommandLine(strCommandLine):
    return runNativeCommand(strCommandLine.split())


# Execute command line and return the exit code and stdout
# scriptResponse is a tuple of (exitStatusCode, stdout)
def runCommandWithTimeout(command, timeout):
    timeout = int(timeout)
    log("Running command with timeout " + command + " timeout:" + str(timeout))
    p = subprocess.Popen(command, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    while timeout > 0:
        exitStatusCode = p.poll()
        if exitStatusCode is not None:
            # Command finished running (exitStatusCode is 0 when ok)
            log("command finished. Exit code: " + str(exitStatusCode))
            return (exitStatusCode, p.communicate()[0])
        time.sleep(0.1)
        timeout -= 0.1
    else:
        # Script has timed out so kill it
        try:
            p.kill()
        except OSError as e:
            if e.errno != 3:
                raise
    return (-1, None)


# Returns operating system detail
def getOperatingSystem():
    retVal = runNativeCommandLine("grep PRETTY_NAME /etc/os-release")
    if(retVal != None and len(retVal) > 1 and '=' in retVal):
        return retVal.split('=')[1]
    else:
        return runNativeCommandLine("uname -a")



def getRam():
    #Returns a tuple (total ram, available ram) in megabytes.
    try:
        s = subprocess.run(["free", "-m"], capture_output=True, text=True).stdout
        lines = s.split("\n")
        return ( int(lines[1].split()[1]), int(lines[2].split()[3]) )
    except:
        return (0, 0)

def getProcessCount():
    #Returns the number of processes.
    try:
        s = subprocess.run(["ps","-e"], capture_output=True, text=True).stdout
        return len(s.split("\n"))
    except:
        return 0

def getUptime():
    #Returns a tuple (uptime, 1 min load average).
    try:
        s = subprocess.run(["uptime"], capture_output=True, text=True).stdout
        load_split = s.split("load average: ")
        load_one = float(load_split[1].split(",")[0])
        up = load_split[0]
        up_pos = up.rfind(",", 0, len(up)-4)
        up = up[:up_pos].split("up ")[1]
        return (up, load_one)
    except:
        return ("", 0)

def getUptimeProcess():
    # Returns uptime in seconds
    try:
        s = subprocess.run(["cat", "/proc/uptime"], capture_output=True, text=True).stdout
        return int(float(s.split(" ")[0]))
    except:
        return 0


###########################   Utilities


def updateDeviceLabelOnServer(labelKey, labelValue):
    headers = getHeadersForRequests()
    r = httpGet(conf['server'] + '/api/v1/devices/' + conf['UUID'])
    if (r.status_code == 200 and json.loads(r.content)['totalRecords'] == 1):
        dataToSend = json.loads(r.content)['records'][0]
        if (dataToSend['labels'] is None):
            dataToSend['labels'] = {}
        dataToSend['labels'][labelKey] = labelValue
        r = httpPut(conf['server'] + '/api/v1/devices/' + conf['UUID'], dataToSend)
        if (r.status_code == 200):
            return r
        else:
            log("Issue while updating device label on server: " + str(r.status_code))
            log(r.content)    
            return r
    else:
        log("Issue while getting device label from server: " + str(r.status_code))
        log(r.content)
        return r
    return


def getMilliSecondsSinceEpoch():
    return int((datetime.utcnow() - datetime(1970,1,1)).total_seconds() * 1000)


# Is a string valid json
def isJson(myjson):
    try:
        json_object = json.loads(myjson)
    except ValueError as e:
        return False
    return True


# For a file in the current dir, get the absolute location
def getAbsoluteFileLocation(inputFilename):
    return os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), inputFilename)


# Remove a directory if it already exists and make it again, ready for writing to
def provideFreshDirectory(dirToClean):
    if(len(dirToClean) > 3):
        os.system("sudo rm -rf " + dirToClean)
        os.system("mkdir -p " + dirToClean)
        os.system("sudo chmod 777 " + dirToClean)
    return


# Ensure a directory exists for writing to
def ensureDirectoryExists(dir):
    if(len(dir) > 3):
        os.system("mkdir -p " + dir)
        os.system("sudo chmod 777 " + dir)
    return


# Edit a json file to upsert a parameter
def upsertJsonEntry(jsonFileToEdit, jsonKey, jsonValue):
    fileContent = None
    with open(jsonFileToEdit) as data_file:
        fileContent = json.load(data_file)
    fileContent[jsonKey] = jsonValue
    with open(jsonFileToEdit, 'w') as outfile:
        json.dump(fileContent, outfile, indent=4)
    return


# Reduce a string to only safe characters
def safeChars(inputStr):
    return(''.join(ch for ch in inputStr if ch.isalnum()))


def generateUuid():
    return str(uuid.uuid4())