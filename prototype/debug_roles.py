import requests
import sys

ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def test(name, params):
    print(f"--- Testing {name} ---")
    headers = {"Accept": "application/json"}
    try:
        r = requests.get(ODS_API_URL, params=params, headers=headers)
        print(f"URL: {r.url}")
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            orgs = data.get("Organisations", [])
            print(f"Count: {len(orgs)}")
            for org in orgs:
                print(f"Org: {org.get('Name')} ({org.get('PrimaryRoleId')})")
        else:
            print(f"Error: {r.text[:100]}")
    except Exception as e:
        print(f"Exception: {e}")
    print("\n")

def main():
    # Test Offset variants
    test("Offset=0", {"PrimaryRoleId": "RO172", "Limit": 5, "Offset": 0, "Status": "Active"})
    test("Offset=1", {"PrimaryRoleId": "RO172", "Limit": 5, "Offset": 1, "Status": "Active"})
    test("No Offset", {"PrimaryRoleId": "RO172", "Limit": 5, "Status": "Active"})

if __name__ == "__main__":
    main()
