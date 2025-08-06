console.log("Romeoville Events script is running...");

const FEED_URL = 'https://your-proxy-url/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml';
const EVENTS_PER_PAGE = 10;
let currentPage = 0;
let pages = [];

function parseDateText(text) {
  let matchSingle = text.match(/Event date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  let matchRange = text.match(/Event dates:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

  if (matchSingle) {
    return {
      startDate: new Date(matchSingle[1]),
      endDate: new Date(matchSingle[1]),
      dateText: matchSingle[1]
    };
  } else if (matchRange) {
    return {
      startDate: new Date(matchRange[1]),
      endDate: new Date(matchRange[2]),
      dateText: `${matchRange[1]} - ${matchRange[2]}`
    };
  } else {
    return {
      startDate: null,
      endDate: null,
      dateText: 'Date TBD'
    };
  }
}

function parseEventTime(summary) {
  let match = summary.match(/Event Time:\s*(.*?)</i);
  return match ? match[1].trim() : 'Time TBD';
}

function parseLocation(summary) {
  let match = summary.match(/Location:\s*<\/strong>\s*(.*?)<br>/i);
  if (match) return match[1].replace(/<br>/g, '').trim();

  // fallback: remove other tags
  let fallback = summary.match(/Location:.*?<br>(.*?)<\/p>/i);
  return fallback ? fallback[1].replace(/<br>/g, '').trim() : 'Location TBD';
}

function createEventHTML(event) {
  return `
    <div class="event">
      <div class="event-title">${event.title}</div>
      <div class="event-date">${event.dateText}</div>
      <div class="event-time">${event.time}</div>
      <div class="event-location">${event.location}</div>
    </div>
  `;
}

async function fetchAndDisplayEvents() {
  try {
    const res = await fetch(FEED_URL);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const items = Array.from(xml.querySelectorAll("item"));

    const now = new Date();
    const events = items.map((item, index) => {
      const title = item.querySelector("title")?.textContent || "No title";
      const summary = item.querySelector("description")?.textContent || "";

      const { startDate, endDate, dateText } = parseDateText(summary);
      const time = parseEventTime(summary);
      const location = parseLocation(summary);

      const link = item.querySelector("link")?.textContent;

      const eventObj = { title, summary, startDate, endDate, dateText, time, location, link };
      return eventObj;
    });

    console.log("Raw parsed events:", events);

    const upcoming = events.filter(event => {
      return event.startDate instanceof Date && !isNaN(event.startDate) && event.endDate >= now;
    });

    console.log("Filtered upcoming events:", upcoming);

    if (upcoming.length === 0) {
      document.getElementById("events").innerHTML = "<div class='event-title'>No upcoming events found.</div>";
      return;
    }

    // Group into pages
    pages = [];
    for (let i = 0; i < upcoming.length; i += EVENTS_PER_PAGE) {
      pages.push(upcoming.slice(i, i + EVENTS_PER_PAGE));
    }

    showPage(0);
    setInterval(() => {
      currentPage = (currentPage + 1) % pages.length;
      showPage(currentPage);
    }, 20000);

  } catch (err) {
    console.error("Error loading events:", err);
    document.getElementById("events").innerHTML = "<div class='event-title'>Failed to load events.</div>";
  }
}

function showPage(pageIndex) {
  const page = pages[pageIndex];
  document.getElementById("events").innerHTML = page.map(createEventHTML).join("");
}

fetchAndDisplayEvents();
