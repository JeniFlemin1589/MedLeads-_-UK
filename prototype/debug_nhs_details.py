import requests
import json

# Example Org ID from the CSV: "FA002" (Rowlands Pharmacy)
# URL pattern: https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/<OrgId>

ORD_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def get_org_details(org_id):
    url = f"{ORD_API_URL}/{org_id}"
    print(f"Fetching details for {org_id} from {url}...")
    
    try:
        response = requests.get(url, headers={"Accept": "application/json"})
        response.raise_for_status()
        data = response.json()
        
        # Pretty print the JSON to see what fields we have
        # specifically looking for Contacts (Phone, Email) and detailed Address
        print(json.dumps(data, indent=2))
        
        # Check for Contacts
        org = data.get("Organisation", {})
        contacts = org.get("Contacts", [])
        print("\n--- Contacts Found ---")
        for c in contacts:
            print(f"Type: {c.get('ContactType')}, Value: {c.get('ContactValue')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_org_details("FA002")
