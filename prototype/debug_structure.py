import requests
import json

ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def main():
    print("--- Inspecting Structure ---")
    
    params = {
        "PrimaryRoleId": "RO182", # Pharmacy
        "Limit": 1,
        "Status": "Active"
    }
    
    headers = {"Accept": "application/json"}
    
    try:
        r = requests.get(ODS_API_URL, params=params, headers=headers)
        if r.status_code == 200:
            data = r.json()
            orgs = data.get("Organisations", [])
            if orgs:
                first = orgs[0]
                print(json.dumps(first, indent=2))
            else:
                print("No orgs found.")
        else:
            print(f"Error: {r.status_code} {r.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    main()
