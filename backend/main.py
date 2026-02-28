import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

app = FastAPI(title="DevSearch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧪 Credibility Score System
def credibility_score(url):
    trusted_high = [
        "stackoverflow.com", "github.com", "docs.python.org", 
        "developer.mozilla.org", "cppreference.com"
    ]
    trusted_med = [
        "medium.com", "geeksforgeeks.org", "freecodecamp.org", 
        "w3schools.com", "towardsdatascience.com"
    ]

    for domain in trusted_high:
        if domain in url:
            return 9.5
    for domain in trusted_med:
        if domain in url:
            return 8.0

    if ".edu" in url or ".org" in url:
        return 7.5

    return 5.0


@app.get("/")
def root():
    return {"message": "DevSearch Backend Running 🚀"}

cache = {}

@app.get("/search")
def search(query: str):
    if not query.strip():
        return []
        
    if query in cache:
        return cache[query]

    url = "https://serpapi.com/search"
    params = {
        "q": query + " (programming OR developer OR code OR syntax)",
        "api_key": SERPAPI_KEY,
        "engine": "google",
        "num": 8
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Failed to fetch from Search API")

    results = data.get("organic_results", [])
    enriched_results = []

    # Indentation corrected so the loop processes every result
    for r in results:
        link = r.get("link", "")
        score = credibility_score(link)
        
        # Extract domain for cleaner frontend display
        domain = link.split("/")[2].replace("www.", "") if "://" in link else "External Link"

        enriched_results.append({
            "title": r.get("title", "No Title"),
            "link": link,
            "snippet": r.get("snippet", "No description available."),
            "thumbnail": r.get("thumbnail"),
            "score": score,
            "domain": domain
        })

    # Sort results so highest credibility is always first
    enriched_results.sort(key=lambda x: x["score"], reverse=True)

    cache[query] = enriched_results
    return enriched_results


@app.post("/summary")
def generate_summary(data: dict):
    text = data.get("text", "")
    
    if not text:
        return {"summary": "No text provided for summarization."}

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "deepseek-coder", 
                "prompt": f"You are a Principal Software Engineer. Extract the exact technical solution, including any crucial library names or code syntax, from this text. Keep it to 1-2 concise sentences. Text:\n\n{text}",
                "stream": False,
                "options": {
                    "num_predict": 120,
                    "temperature": 0.1 
                }
            },
            timeout=60 # Extended timeout to 60 seconds for local Ollama processing
        )
        response.raise_for_status()
        return {"summary": response.json()["response"].strip()}
    except requests.exceptions.RequestException:
        return {"summary": "AI summary currently offline. Check your local Ollama instance."}