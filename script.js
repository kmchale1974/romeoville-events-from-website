console.log("Romeoville Events script is running...");

const proxyUrl = "https://bucolic-madeleine-a56597.netlify.app";
const targetUrl = "https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const fullUrl = `${proxyUrl}/${targetUrl}`;


// Helper to parse event description HTML
function parseDescription(summary) {
    const result = {
        dateText: "Date TBD",
        time: "Time TBD",
        location: "Location TBD"
    };

    const dateMatch = summary.match(/Event date(?:s)?:<\/strong>\s*([^<]+)/i);
    const timeMatch = summary.match(/Event Time:<\/strong>\s*([^<]+)/i);
    const locationMatch = summary.match(/Location:<\/strong>\s*<br>\s*([^<]+)<br>\s*([^<]+)/i);

    if (dateMatch) result.dateText = dateMatch[1].trim();
    if (timeMatch) result.time = timeMatch[1].trim();
    if (locationMatch) result.location = `${locationMatch[1].trim()}, ${locationMatch[2].trim()}`;

    // Try to extract start and end date from "August 4, 2025 - August 10, 2025"
    const dateRange = result.dateText.match(/([A-Za-z]+ \d{1,2}, \d{4})\s*-\s*([A-Za-z]+ \d{1,2}, \d{4})/);
    if (dateRange) {
        result.startDate = new Date(dateRange[1]);
        result.endDate = new Date(dateRange[2]);
    } else {
        const singleDate = result.dateText.match(/([A-Za-z]+ \d{1,2}, \d{4})/);
        if (singleDate) {
            result.startDate = new Date(singleDate[1]);
            result.endDate = new Date(singleDate[1]);
        }
    }

    return result;
}

// Fetch and display events
async function fetchAndDisplayEvents() {
    try {
        const res = await fetch(fullUrl);
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");
        const items = xml.querySelectorAll("item");

        const events = [];
        items.forEach((item, index) => {
            const title = item.querySelector("title")?.textContent || "Untitled";
            const description = item.querySelector("description")?.textContent || "";
            const link = item.querySelector("link")?.textContent || "#";

            const parsed = parseDescription(description);
            const event = {
                title,
                ...parsed,
                link
            };

            events.push(event);
        });

        console.log("Raw parsed events: ", events);

        const today = new Date();
        const upcoming = events.filter(e => e.startDate && e.startDate >= today);
        console.log("Filtered upcoming events: ", upcoming);

        const container = document.getElementById("event-container");
        if (!container) return;

        if (upcoming.length === 0) {
            container.innerHTML = "<p>No upcoming events found.</p>";
            return;
        }

        container.innerHTML = upcoming.map(e => `
            <div class="event">
                <h3>${e.title}</h3>
                <p><strong>Date:</strong> ${e.dateText}</p>
                <p><strong>Time:</strong> ${e.time}</p>
                <p><strong>Location:</strong> ${e.location}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error("Error loading events:", err);
    }
}

// Run on load
fetchAndDisplayEvents();
