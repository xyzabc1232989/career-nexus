from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from fastapi import FastAPI
from supabase import create_client

# ── Configuration ─────────────────────────────────────────────────────────────
PINECONE_API_KEY = "pcsk_6vEzcX_UiKosCSkap8cZAu2psFe8oEYAuDQ9d6CraED5YCkyewNHN4u3QugHeSnUAUpLJd"
SUPABASE_URL = "https://ovdkcvvwunggafzdwenj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZGtjdnZ3dW5nZ2FmemR3ZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzMyNjcsImV4cCI6MjA5MzIwOTI2N30.UWqrobuQ9MkbzAJ_d8kHAqV0RW5bISaHvYIbjAjF_gw"
INDEX_NAME = "vectorized-skillset"

pc = Pinecone(api_key=PINECONE_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
index = pc.Index(INDEX_NAME)

# Load model only if we need to embed new jobs
model = None

def get_model():
    global model
    if model is None:
        print("🚀 Loading embedding model...")
        model = SentenceTransformer("intfloat/multilingual-e5-large")
    return model

def embed_text(text: str):
    m = get_model()
    text = "passage: " + text
    return m.encode(text).tolist()

# ── Fetch Jobs from Supabase ──────────────────────────────────────────────────
print("📊 Fetching jobs from Supabase...")
all_jobs = []
start = 0
batch_size = 1000

while True:
    res = supabase.table("job_listings").select("*").range(start, start + batch_size - 1).execute()
    data = res.data
    if not data: break
    all_jobs.extend(data)
    start += batch_size
    print(f"   Fetched {len(all_jobs)} jobs...")

print(f"✅ Total jobs to process: {len(all_jobs)}")

# ── Process in Batches ────────────────────────────────────────────────────────
UPSERT_BATCH_SIZE = 64

for i in range(0, len(all_jobs), UPSERT_BATCH_SIZE):
    batch = all_jobs[i : i + UPSERT_BATCH_SIZE]
    ids = [str(job["adzuna_id"]) for job in batch]
    
    print(f"🔄 Processing batch {i//UPSERT_BATCH_SIZE + 1} ({i} to {i + len(batch)})...")
    
    # 1. Fetch existing vectors from Pinecone to avoid re-embedding
    try:
        fetch_res = index.fetch(ids=ids)
        existing_vectors = fetch_res.get("vectors", {})
    except Exception as e:
        print(f"   ⚠️ Fetch error: {e}. Falling back to re-embedding this batch.")
        existing_vectors = {}

    vectors_to_upsert = []
    
    for job in batch:
        jid = str(job["adzuna_id"])
        
        # Determine metadata precisely
        metadata = {
            "title": job.get("title") or "Unknown Title",
            "company": job.get("company") or "Unknown Company",
            "salary": job.get("salary_max") or job.get("salary_min") or 0,
            "contract_type": job.get("contract_type") or "",
            "contract_time": job.get("contract_time") or "",
            "redirect_url": job.get("redirect_url") or "",
            "location_name": job.get("location_name") or ""
        }
        
        # Use existing vector if available, otherwise embed
        if jid in existing_vectors:
            vector = existing_vectors[jid]["values"]
        else:
            title = job.get("title") or ""
            company = job.get("company") or ""
            description = job.get("description") or ""
            text = f"{title} {company} {description}"
            if not title or not description:
                continue
            vector = embed_text(text)
        
        vectors_to_upsert.append((jid, vector, metadata))
    
    # 2. Batch Upsert
    if vectors_to_upsert:
        try:
            index.upsert(vectors=vectors_to_upsert)
            print(f"   ✅ Upserted {len(vectors_to_upsert)} vectors.")
        except Exception as e:
            print(f"   ❌ Upsert error: {e}")

print("\n✨ All jobs processed and metadata updated!")