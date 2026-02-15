import requests
import urllib.parse

API_KEY = "AIzaSyAYgtfwk7jyAnfyywTIImIScEwhbiLDp5k"
NAME = "Boots"
POSTCODE = "UB8 1AB" # Just a random postcode example, or I can use one from the user's data if I knew it.
# Let's try a known pharmacy from a previous CSV view if possible, or just a generic search.

def test_find_place(name, postcode):
    query = f"{name} {postcode} UK"
    encoded_query = urllib.parse.quote(query)
    url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={encoded_query}&inputtype=textquery&fields=place_id&key={API_KEY}"
    
    print(f"Testing Query: {query}")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

test_find_place("Boots", "London")
