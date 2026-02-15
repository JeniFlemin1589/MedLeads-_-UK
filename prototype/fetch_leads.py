import requests
import csv
import os
import time

# NHS ODS API Endpoint
ODS_API_URL = "https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations"

def fetch_organisations_by_role(role_code, limit=1000):
    """
    Fetches organisations from the NHS ODS API based on a PrimaryRoleId.
    """
    organisations = []
    offset = 0
    
    print(f"Fetching data for PrimaryRoleId: {role_code}...")
    
    headers = {
        "Accept": "application/json"
    }

    while True:
        params = {
            "PrimaryRoleId": role_code,
            "Limit": limit,
            "Status": "Active"
        }
        if offset > 0:
            params["Offset"] = offset
        
        try:
            response = requests.get(ODS_API_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            orgs = data.get("Organisations", [])
            if not orgs:
                break
                
            organisations.extend(orgs)
            print(f"  Fetched {len(orgs)} records (Total so far: {len(organisations)})")
            
            if len(orgs) < limit:
                break # End of pages
            
            offset += limit
            time.sleep(0.2) # Rate limit check
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 406:
                print(f"  Error 406: Not Acceptable. Try changing headers or check params.")
                break
            print(f"  HTTP Error: {e}")
            break
        except Exception as e:
            print(f"  Error: {e}")
            break
            
    return organisations

def extract_details(org):
    """
    Extracts relevant details.
    """
    geo_loc = org.get("GeoLoc", {}).get("Location", {})
    addr = geo_loc.get("AddrLn1", "")
    town = geo_loc.get("Town", "")
    postcode = org.get("PostCode", "") # PostCode is at root level
    
    return {
        "Name": org.get("Name"),
        "ODS_Code": org.get("OrgId"),
        "Status": org.get("Status"),
        "Address": addr,
        "City": town,
        "Postcode": postcode,
        "Country": geo_loc.get("Country", "UK"),
        "Role": org.get("PrimaryRoleDescription", "")
    }

def save_to_csv(data, filename):
    if not data:
        print(f"No data to save for {filename}.")
        return

    keys = data[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as output_file:
        dict_writer = csv.DictWriter(output_file, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(data)
    print(f"Saved {len(data)} records to {filename}")

def main():
    print("--- Starting Lead Generation (NHS ODS) ---")
    
    # 1. Fetch Pharmacies (Role RO182 = Community Pharmacy)
    # Note: RO182 is much better than RO35
    pharmacies_raw = fetch_organisations_by_role("RO182", limit=100)
    pharmacy_leads = [extract_details(org) for org in pharmacies_raw]
    save_to_csv(pharmacy_leads, "leads_pharmacies_uk_v2.csv")
    
    # 2. Fetch Independent Clinics (Role RO172)
    clinics_raw = fetch_organisations_by_role("RO172", limit=100)
    clinic_leads = [extract_details(org) for org in clinics_raw]
    save_to_csv(clinic_leads, "leads_clinics_uk_v2.csv")

    print("\nDone! Check the CSV files.")

if __name__ == "__main__":
    main()
