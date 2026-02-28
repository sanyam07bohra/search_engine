const searchLibrary = [
    "Python YOLO v8 object detection syntax",
    "React useEffect memory leak fix",
    "C++ reverse a linked list",
    "Tailwind CSS center div absolute",
    "Node.js express CORS error setup",
    "Pandas drop NaN rows inplace",
    "How to build a WebSocket multiplayer game",
    "Big-O time complexity of Python dict",
    "C++ unordered_map vs map performance",
    "React Router v6 private routes",
    "Simulate pathfinding algorithm A*",
    "Flask vs Django for ML backend",
    "Space tracking API fetch example JavaScript"
];

// Run this immediately when the page loads
window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('pill-container');
    
    // Shuffle the array randomly
    const shuffled = [...searchLibrary].sort(() => 0.5 - Math.random());
    
    // Pick the top 3 results and generate HTML
    const selectedPills = shuffled.slice(0, 3);
    container.innerHTML = selectedPills.map(text => 
        `<div class="pill" onclick="fillSearch('${text}')">${text}</div>`
    ).join('');
});
// ------------------------------

document.getElementById("query").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        search();
    }
});

function fillSearch(text) {
    document.getElementById("query").value = text;
    search();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("URL Copied to clipboard!");
}

async function search() {
    const query = document.getElementById("query").value;
    if (!query.trim()) return;

    const loading = document.getElementById("loading");
    const container = document.getElementById("results");
    const button = document.getElementById("searchBtn");
    const landingFeatures = document.getElementById("landing-features");

    landingFeatures.style.display = "none";
    container.style.display = "grid"; 
    loading.style.display = "block";
    container.innerHTML = "";
    button.disabled = true;

    try {
        const res = await fetch(`http://127.0.0.1:8000/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        loading.style.display = "none";
        button.disabled = false;

        if (data.length === 0) {
            container.innerHTML = "<div style='grid-column: 1/-1; text-align:center; padding: 40px; color:#8b9bb4;'><svg width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' style='margin-bottom:15px;'><circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line></svg><h3>No results found</h3><p>Try refining your technical query.</p></div>";
            return;
        }

        let htmlContent = "";
        
        data.forEach((item, index) => {
            const cardId = "summary-" + index;
            
            let scoreClass = "low";
            if (item.score >= 9) scoreClass = "high";
            else if (item.score >= 7.5) scoreClass = "med";

            htmlContent += `
                <div class="card">
                    <div class="card-header">
                        <div class="score ${scoreClass}">Trust Score: ${item.score}</div>
                        <button class="copy-btn" onclick="copyToClipboard('${item.link}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            Copy
                        </button>
                    </div>

                    <h3>
                        <a href="${item.link}" target="_blank">${item.title}</a>
                    </h3>

                    <div class="domain">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        ${item.domain}
                    </div>

                    <div class="summary" id="${cardId}">
                        ${index < 3 ? "<span class='ai-loading'><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' class='spin'><path d='M21 12a9 9 0 1 1-6.219-8.56'></path></svg> AI compiling summary...</span>" : item.snippet}
                    </div>
                </div>
            `;
        });

        container.innerHTML = htmlContent;

        const style = document.createElement('style');
        style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 2s linear infinite; }`;
        document.head.appendChild(style);

        for (let index = 0; index < Math.min(3, data.length); index++) {
            const item = data[index];
            const cardId = "summary-" + index;
            
            try {
                const summaryRes = await fetch("http://127.0.0.1:8000/summary", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: item.snippet })
                });
                
                if (!summaryRes.ok) throw new Error("Summary failed");
                
                const summaryData = await summaryRes.json();
                
                document.getElementById(cardId).innerHTML = `<strong style="color: var(--accent); font-family: 'Fira Code', monospace; display: block; margin-bottom: 8px;">> AI Solution:</strong> ${summaryData.summary}`;
            } catch (error) {
                document.getElementById(cardId).innerText = item.snippet; 
            }
        }

    } catch (error) {
        loading.innerText = ">>> ERROR: CONNECTION_FAILED. CHECK BACKEND SERVER.";
        loading.style.color = "#eb5757";
        button.disabled = false;
    }
}