# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import httpx
import re

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client("https://ovdkcvvwunggafzdwenj.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZGtjdnZ3dW5nZ2FmemR3ZW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MzMyNjcsImV4cCI6MjA5MzIwOTI2N30.UWqrobuQ9MkbzAJ_d8kHAqV0RW5bISaHvYIbjAjF_gw")
pc = Pinecone(api_key="pcsk_6vEzcX_UiKosCSkap8cZAu2psFe8oEYAuDQ9d6CraED5YCkyewNHN4u3QugHeSnUAUpLJd")
index = pc.Index("vectorized-skillset")

model = SentenceTransformer("intfloat/multilingual-e5-large")

def embed_query(text):
    return model.encode("query: " + text).tolist()

@app.get("/recommend/{user_id}")
def recommend(user_id: str):
    res = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not res.data:
        return {"error": "User not found"}
    
    user = res.data[0]

    # Helper to format lists or objects into a string for embedding
    def format_field(val):
        if not val:
            return ""
        if isinstance(val, list):
            return ", ".join([str(item) for item in val])
        return str(val)

    skills = format_field(user.get("skills"))
    work_exp = format_field(user.get("work_experience"))
    education = format_field(user.get("education"))
    projects = format_field(user.get("projects"))
    certifications = format_field(user.get("certifications"))
    languages = format_field(user.get("languages"))
    
    location = f"{user.get('city','')}, {user.get('country','')}, {user.get('location_name','')}".strip(", ")

    # Construct a cleaner query string for better semantic matching
    text_parts = [
        user.get('headline', ''),
        user.get('summary', ''),
        format_field(user.get("skills")),
        format_field(user.get("work_experience")),
        format_field(user.get("projects")),
        format_field(user.get("education")),
        location
    ]
    # Filter out empty parts and join
    clean_text = " ".join([p for p in text_parts if p])

    vector = embed_query(clean_text)

    results = index.query(
        vector=vector,
        top_k=50,
        include_metadata=True
    )
    
    # Helper to scale scores for human readability
    # Pinecone cosine scores for E5 usually fall between 0.7 and 0.9
    def scale_score(raw_score):
        # Map 0.75 -> 60%, 0.85 -> 95%
        min_s, max_s = 0.72, 0.88
        scaled = (raw_score - min_s) / (max_s - min_s)
        return max(5, min(99, int(scaled * 100)))

    return [
        {
            "id": m["id"],
            "score": m["score"],
            "match": scale_score(m["score"]), # Add explicit match score
            "title": m.get("metadata", {}).get("title", "Unknown Title"),
            "company": m.get("metadata", {}).get("company", "Unknown Company"),
            "salary": m.get("metadata", {}).get("salary", 0),
            "contract_type": m.get("metadata", {}).get("contract_type", ""),
            "contract_time": m.get("metadata", {}).get("contract_time", ""),
            "redirect_url": m.get("metadata", {}).get("redirect_url", ""),
            "location_name": m.get("metadata", {}).get("location_name", "")
        }
        for m in results["matches"]
    ]

@app.get("/jobs")
def get_jobs():
    return supabase.table("job_listings").select("*").limit(5).execute().data

@app.get("/users")
def get_users():
    return supabase.table("users").select("*").limit(5).execute().data

@app.get("/scrape-jd")
async def scrape_jd(url: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(url, timeout=10.0)
            html = resp.text
            # Remove scripts and styles
            html = re.sub(r'<(script|style).*?>.*?</\1>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
            # Remove other tags
            text = re.sub(r'<[^>]+>', ' ', html)
            # Clean whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            # Return first 5000 chars
            return {"description": text[:5000]}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)