import json
import requests
from states import states
from google_api_key import api_key
from ASTC import ASTC
import pandas as pd

def get_coords(address, city, api_key):
    google = "https://maps.googleapis.com/maps/api/geocode/json?address="
    url = google + address.replace(" ","+") + "&key=" + api_key
    response = requests.get(url)
    data = json.loads(response.text)
    try:
        coord = data['results'][0]['geometry']['location']
    except:
        url = google + city.replace(" ","+") + "&key=" + api_key
        response = requests.get(url)
        data = json.loads(response.text)
        try:
            coord = data['results'][0]['geometry']['location']
        except:
            coord = {"lat": None, "lng": None}
    return coord

def add_coords(df, api_key):
    for row in range(len(df)):
        address = df.iloc[row]["full_address"]
        city = df.iloc[row]["address_line_two"]
        coord = get_coords(address, city, api_key)
        print(f"{row}: {coord}")
        df.loc[row, "latitude"] = coord["lat"]
        df.loc[row, "longitude"] = coord["lng"]
    return df


data = []
for state in states:
    science_centers = ASTC("United States", state).search()
    data += science_centers

science_center_df = pd.DataFrame(data=data)

science_center_geo = add_coords(science_center_df, api_key)
science_center_geo.to_csv("./science_center_data.csv")



