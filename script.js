console.log("Romeoville Events script is running...");

const FEED_URL = 'https://kmchale1974.github.io/cors-anywhere/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';
const MAX_EVENTS_PER_PAGE = 10;
const PAGE_DURATION_MS = 20000;

async function fetchAndDisplayEvents() {
  try {
    const response = await fetch(FEED_URL);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    const items = Array.from(xml.querySelectorAll("item"));

    const events = items.map((item, index) => {
      const title = item.querySelector("title")?.textContent.trim() || "No Title";
      const link = item.querySelector("link")?.textContent.trim();
      const summary = item.querySelector("description")?.textContent || "";

      const event = {
        title,
        link,
        startDate: null,
        endDate: null,
        time: "Time TBD",
        location: "Location TBD",
        dateText: "Date TBD"
      };

      // Clean and parse the summary content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = summary.replace(/<br\s*\/?>/gi, "\n");
      const cleanText = tempDiv.textContent.replace(/\r?\n|\r/g, '\n').trim();

      const lines = cleanText.split("\n").map(l => l.trim()).filter(Boolean);

      for (const line of lines) {
        if (line.startsWith("Event date:")) {
          const dateStr = line.replace("Event date:", "").trim();
          const parsed = new Date(dateStr);
          if (!isNaN(parsed)) {
            event.startDate = parsed;
            event.dateText = parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          }
        } else if (line.startsWith("Event dates:")) {
          const range = line.replace("Event dates:", "").trim();
          const [startStr, endStr] = range.split(" - ");
          const start = new Date(startStr);
          const end = new Date(endStr);
          if (!isNaN(start) && !isNaN(end)) {
            event.startDate = start;
            event.endDate = end;
            event.dateText = `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
          }
        } else if (line.startsWith("Event Time:")) {
          event.time = line.replace("Event Time:", "").trim();
        } else if (line.startsWith("Location:")) {
          const location = line.replace("Location:", "").trim();
          // Remove city/state
          event.location = location.replace(/Romeoville, IL\s*\d{5}/, '').trim();
        }
      }

      console.log(`Parsed event #${index + 1}:`, event);
      return event;
    });

    console.log("Raw parsed events: ", events);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = events.filter(e => e.startDate && e.startDate >= today);
    console.log("Filtered upcoming events: ", upcomingEvents);

    displayEventsPaginated(upcomingEvents);
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

function displayEventsPaginated(events) {
  const container = document.getElementById("event-container");
  if (!container) return;

  if (!events.length) {
    container.innerHTML = `<p>No upcoming events found.</p>`;
    return;
  }

  const pages = [];
  for (let i = 0; i < events.length; i += MAX_EVENTS_PER_PAGE) {
    const pageEvents = events.slice(i, i + MAX_EVENTS_PER_PAGE);
    const page = document.createElement("div");
    page.classList.add("event-page");

    pageEvents.forEach(ev => {
      const div = document.createElement("div");
      div.className = "event";
      div.innerHTML = `
        <h3>${ev.title}</h3>
        <p><strong>${ev.dateText}</strong> – ${ev.time}</p>
        <p>${ev.location}</p>
      `;
      page.appendChild(div);
    });

    pages.push(page);
  }

  // Page rotation
  let currentPage = 0;
  container.innerHTML = "";
  container.appendChild(pages[currentPage]);

  setInterval(() => {
    container.innerHTML = "";
    currentPage = (currentPage + 1) % pages.length;
    container.appendChild(pages[currentPage]);
  }, PAGE_DURATION_MS);
}

// Refresh hourly and force reload at midnight
function scheduleAutoRefresh() {
  setInterval(fetchAndDisplayEvents, 60 * 60 * 1000); // Hourly refresh

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 5, 0); // just after midnight
  const msUntilMidnight = midnight - now;

  setTimeout(() => {
    location.reload(true);
  }, msUntilMidnight);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchAndDisplayEvents();
  scheduleAutoRefresh();
});
