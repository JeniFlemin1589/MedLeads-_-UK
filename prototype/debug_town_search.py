import requests

API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def test_query(name, params):
    print(f"\n--- Testing: {name} ---")
    print(f"Params: {params}")
    try:
        response = requests.get(API_URL, params=params, headers={"Accept": "application/json"})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            orgs = data.get("Organisations", [])
            print(f"Success! Found {len(orgs)} results.")
        else:
            print("Error Response:")
            try:
                print(response.json())
            except:
                print(response.text)
    except Exception as e:
        print(f"Exception: {e}")

# PostCode="London" (Invalid)
test_query("PostCode='London'", {
    "PrimaryRoleId": "RO182",
    "Status": "Active",
    "Limit": "5",
    "PostCode": "London"
})

# PostCode="M" (Manchester area?)
test_query("PostCode='M'", {
    "PrimaryRoleId": "RO182",
    "Status": "Active",
    "Limit": "5",
    "PostCode": "M"
})

# PostCode="SW1" (London area)
test_query("PostCode='SW1'", {
    "PrimaryRoleId": "RO182",
    "Status": "Active",
    "Limit": "5",
    "PostCode": "SW1"
})
