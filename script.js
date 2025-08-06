console.log("Romeoville Events script is running...");

// Romeoville RSS feed through CORS proxy
const FEED_URL = 'https://api.allorigins.win/raw?url=https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';

function parseEventDate(summary) {
  const dateRangeMatch = summary.match(/Event dates?:\s*([A-Za-z]+\s\d{1,2},\s\d{4})(?:\s*-\s*([A-Za-z]+\s\d{1,2},\s\d{4}))?/);
  if (!dateRangeMatch) return null;

  const start = new Date(dateRangeMatch[1]);
  const end = dateRangeMatch[2] ? new Date(dateRangeMatch[2]) : start;
  return { start, end };
}

async function fetchAndDisplayEvents() {
  try {
    const response = await fetch(FEED_URL);
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = [...xml.querySelectorAll("item")];

    const events = items.map((item, index) => {
      const title = item.querySelector("title")?.textContent.trim();
      const description = item.querySelector("description")?.textContent.trim() || '';
      const link = item.querySelector("link")?.textContent.trim();

      const { start, end } = parseEventDate(description) || {};

      return {
        title,
        description,
        link,
        startDate: start,
        endDate: end,
      };
    });

    console.log("Raw parsed events:", events);

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const upcoming = events.filter(e => e.startDate && e.startDate >= now);
    console.log("Filtered upcoming events:", upcoming);

    if (upcoming.length === 0) {
      document.getElementById("event-container").innerHTML = "<p>No upcoming events found.</p>";
      return;
    }

    // Display logic (just first event for now)
    document.getElementById("event-container").innerHTML = upcoming.map(e => `
      <div class="event">
        <h3>${e.title}</h3>
        <p><strong>Date:</strong> ${e.startDate.toDateString()}</p>
        <p><a href="${e.link}" target="_blank">More Info</a></p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading events:", err);
    document.getElementById("event-container").innerHTML = "<p>Error loading events.</p>";
  }
}

fetchAndDisplayEvents();
