import os
import time
import requests
from supabase import create_client
from dotenv import load_dotenv

# Load credentials from .env file
load_dotenv()

ADZUNA_APP_ID  = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")
SUPABASE_URL   = os.getenv("SUPABASE_URL")
SUPABASE_KEY   = os.getenv("SUPABASE_KEY")

# Connect to Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Settings ──────────────────────────────────────────────
COUNTRIES = {
    "gb": "UK",
    "us": "USA",
    "ca": "Canada",
    "au": "Australia",
    "de": "Germany",
    "fr": "France",
    "in": "India",
    "sg": "Singapore",
    "za": "South Africa",
    "nl": "Netherlands",
    "at": "Austria",
    "br": "Brazil",
    "it": "Italy",
    "nz": "New Zealand",
    "pl": "Poland",
    "ae": "UAE",
    "ru": "Russia",
}

PAGES_TO_FETCH   = 3
RESULTS_PER_PAGE = 50
DELAY_BETWEEN_REQUESTS = 1  # seconds pause between each API call (prevents timeouts)

SEARCH_TERMS = [
    # Development
    "software developer",
    "web developer",
    "python developer",
    "frontend developer",
    "backend developer",
    "full stack developer",
    "mobile developer",
    # Data & AI
    "data scientist",
    "machine learning",
    "data analyst",
    "data engineer",
    "artificial intelligence",
    # Cloud & DevOps
    "cloud engineer",
    "devops engineer",
    "cybersecurity",
    # Design & Management
    "ui ux designer",
    "product manager",
    "project manager",
    # Business
    "business analyst",
    "digital marketing",
]
# ─────────────────────────────────────────────────────────


def fetch_jobs(country: str, what: str, page: int) -> list:
    """Fetch one page of jobs from Adzuna for a given country and search term."""
    url = (
        f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
        f"?app_id={ADZUNA_APP_ID}"
        f"&app_key={ADZUNA_APP_KEY}"
        f"&results_per_page={RESULTS_PER_PAGE}"
        f"&what={what.replace(' ', '%20')}"
        f"&content-type=application/json"
    )
    for attempt in range(5):  # retry up to 5 times
        try:
            response = requests.get(url, timeout=60)  # 60 second timeout
            if response.status_code != 200:
                print(f"  ⚠️  Adzuna error {response.status_code} for '{what}' page {page}")
                return []
            time.sleep(DELAY_BETWEEN_REQUESTS)  # polite delay after each successful call
            return response.json().get("results", [])
        except requests.exceptions.ReadTimeout:
            wait = (attempt + 1) * 3  # wait 3s, 6s, 9s, 12s, 15s between retries
            print(f"  ⏱️  Timeout attempt {attempt+1}/5 — waiting {wait}s before retry...")
            time.sleep(wait)
    print(f"  ❌ Gave up on '{what}' page {page} after 5 attempts")
    return []


def map_job(job: dict) -> dict:
    """Map an Adzuna job dict to our job_listings table columns."""
    return {
        "adzuna_id":        job.get("id"),
        "title":            job.get("title"),
        "company":          job.get("company", {}).get("display_name"),
        "location_name":    job.get("location", {}).get("display_name"),
        "location_area":    job.get("location", {}).get("area", []),
        "description":      job.get("description"),
        "salary_min":       job.get("salary_min"),
        "salary_max":       job.get("salary_max"),
        "salary_predicted": job.get("salary_is_predicted") == "1",
        "contract_type":    job.get("contract_type"),
        "contract_time":    job.get("contract_time"),
        "category_label":   job.get("category", {}).get("label"),
        "category_tag":     job.get("category", {}).get("tag"),
        "redirect_url":     job.get("redirect_url"),
        "latitude":         job.get("latitude"),
        "longitude":        job.get("longitude"),
    }


def insert_jobs(jobs: list) -> tuple[int, int]:
    """Insert jobs into Supabase, skipping duplicates. Returns (inserted, skipped)."""
    inserted = 0
    skipped  = 0

    for job in jobs:
        mapped = map_job(job)
        if not mapped.get("adzuna_id") or not mapped.get("title"):
            skipped += 1
            continue

        try:
            supabase.table("job_listings").upsert(
                mapped,
                on_conflict="adzuna_id",
                ignore_duplicates=True
            ).execute()
            inserted += 1
        except Exception as e:
            print(f"  ⚠️  Insert error for job {mapped.get('adzuna_id')}: {e}")
            skipped += 1

    return inserted, skipped


def main():
    print("🚀 Adzuna → Supabase fetcher starting...\n")
    print(f"📋 {len(COUNTRIES)} countries | {len(SEARCH_TERMS)} search terms | {PAGES_TO_FETCH} pages each")
    print(f"📊 Max possible jobs: {len(COUNTRIES) * len(SEARCH_TERMS) * PAGES_TO_FETCH * RESULTS_PER_PAGE:,}")
    print(f"⏱️  Delay between requests: {DELAY_BETWEEN_REQUESTS}s (reduces timeouts)\n")

    total_inserted = 0
    total_skipped  = 0

    for country_code, country_name in COUNTRIES.items():
        print(f"\n🌍 Country: {country_name} ({country_code})")
        for term in SEARCH_TERMS:
            print(f"  🔍 '{term}'")
            for page in range(1, PAGES_TO_FETCH + 1):
                jobs = fetch_jobs(country_code, term, page)
                if not jobs:
                    break
                ins, skp = insert_jobs(jobs)
                total_inserted += ins
                total_skipped  += skp
                print(f"     Page {page}: {ins} inserted, {skp} skipped")

    print(f"\n✅ Done!")
    print(f"   Total inserted : {total_inserted:,}")
    print(f"   Total skipped  : {total_skipped:,} (duplicates)")


if __name__ == "__main__":
    main()