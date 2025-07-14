import csv
import random
import requests
import time

# Constants
FILE_PATH = "./gpsPoints.txt"
BASE_URL = "https://iotdc.davra.com/api/v1/iotdata"
BEARER_TOKEN = "2SGHQr2y31tnyKdnzgq1bzedqMiZqKveWlIx5yqoTMp1B6Mm"
DEVICE_UUID = "7b60ce7d-78ca-43f8-b4e8-81be7f69a79b"
METRIC_NAME = "davra.training.weight"

HEADERS = {
    "Authorization": f"Bearer {BEARER_TOKEN}",
    "Content-Type": "application/json",
}


# Read GPS points from file
def read_gps_points(file_path):
    locations = []
    with open(file_path, "r") as csv_file:
        csv_reader = csv.reader(csv_file)
        for row in csv_reader:
            locations.append(row)
    return locations


# Generate a random weight value
def generate_random_weight():
    return random.randint(1000, 8500)


# Send IoT data to the API
def send_iot_data(weight, latitude, longitude):
    data = [
        {
            "UUID": DEVICE_UUID,
            "name": METRIC_NAME,
            "latitude": latitude,
            "longitude": longitude,
            "value": weight,
            "msg_type": "datum",
        }
    ]
    try:
        response = requests.put(BASE_URL, json=data, headers=HEADERS, timeout=10)
        response.raise_for_status()  # Raise an exception for HTTP errors
        print(f"Metric weight pushed with value {weight} at {latitude}, {longitude}")
    except requests.exceptions.RequestException as e:
        print("PUT request failed:", e)


def main():
    locations = read_gps_points(FILE_PATH)
    locations_index = 0

    while True:
        random_weight = generate_random_weight()
        latitude, longitude = locations[locations_index]
        locations_index = (locations_index + 1) % len(locations)
        send_iot_data(random_weight, latitude, longitude)
        time.sleep(30)


if __name__ == "__main__":
    main()
