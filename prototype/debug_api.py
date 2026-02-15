import requests

ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def test_request(name, params=None, headers=None):
    print(f"--- Testing {name} ---")
    try:
        response = requests.get(ODS_API_URL, params=params, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"URL: {response.url}")
        if response.status_code == 200:
            print("Success!")
            print(str(response.content)[:200]) # Print first 200 chars
        else:
            print("Failed.")
            print(response.text[:200])
    except Exception as e:
        print(f"Exception: {e}")
    print("\n")

def main():
    # Test 1: tailored JSON header (Skipping known success)
    # test_request("JSON Header", params={"Limit": 1}, headers={"Accept": "application/json"})


    # Test 2: XML Header (Skipping)
    # test_request("XML Header", params={"Limit": 1}, headers={"Accept": "application/xml"})

    # Test 3: _format parameter (Skipping)
    # test_request("_format=json", params={"Limit": 1, "_format": "json"})

    # Test 5: Roles parameter check
    test_request("Roles Parameter", 
                 params={"Roles": "RO35", "Limit": 1}, 
                 headers={"Accept": "application/json"})

    # Test 6: PrimaryRoleId parameter check
    test_request("PrimaryRoleId Parameter", 
                 params={"PrimaryRoleId": "RO35", "Limit": 1}, 
                 headers={"Accept": "application/json"})

    # Test 4: Single ID fetch (no params, just ID path)
    # This URL is different: .../organisations/7A4BV
    print("--- Testing Single ID ---")
    single_url = f"{ODS_API_URL}/7A4BV"
    try:
        r = requests.get(single_url, headers={"Accept": "application/json"})
        print(f"Status: {r.status_code}")
        print(str(r.content)[:200])
    except Exception as e:
        print(e)

if __name__ == "__main__":
    main()
