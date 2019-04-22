import requests
from bs4 import BeautifulSoup

class ASTC:
    def __init__(self, country, state):
        self.astc_url = "https://www.astc.org/about-astc/about-science-centers"
        self.search_url = self.astc_url + "/find-a-science-center/?"
        self.country = country
        self.state = state

    def search(self):
        centers = self.get_soup().find_all("div", "result address")
        results = []
        for center in centers:
            data = self.get_center_data(center)
            if data != None:
                results.append(data)
        return results

    def get_soup(self):
        country = "country=" + self.country.replace(" ", "+")
        state = "&state=" + self.state
        url = self.search_url + country + state
        html = requests.get(url)
        soup = BeautifulSoup(html.content, "html.parser")
        return soup

    def get_center_data(self, center):
        data = {}
        data["state"] = self.state
        address_title = center.find("h4", "address-title")
        try:
            data["name"] = str(address_title.find("a").text)
        except:
            try:
                data["name"] = address_title.text
            except:
                data["name"] = ""
        try:
            data["website"] = str(address_title.find("a", href=True)['href'])
        except:
            data["website"] = ""
        try:
            addressElement = center.find("p")
            addresslist = []
            for line in addressElement:
                addresslist.append(line)
            street = str(addresslist[0])
            city_state = str(addresslist[2])
            country = str(addresslist[4])
            address = f"{street} {city_state} {country}"
        except:
            street = None
            city_state = None
            country = None
            address = None
        data["full_address"] = address
        data["address_line_one"] = street
        data["address_line_two"] = city_state
        data["address_line_three"] = country
        return data