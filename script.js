
const RSS_URL = "https://corsproxy.io/?" + encodeURIComponent("https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml");
const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
const PAGE_DURATION = 20000; // 20 seconds
const MAX_PAGES = 4;
let currentPageIndex = 0;
let pages = [];

async function fetchEvents() {
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) throw new Error("Network response was not ok");
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item"));

    let events = items.map(item => {
      const title = item.querySelector("title")?.textContent.trim() || "Untitled Event";
      const summary = item.querySelector("summary")?.textContent || item.querySelector("description")?.textContent || "";
      const dateMatch = summary.match(/Event date:\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
      const timeMatch = summary.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);
      const locationMatch = summary.match(/Location:\s*([^<]+)/i);
      let date = dateMatch ? new Date(dateMatch[1]) : null;

      return {
        title,
        date,
        dateText: dateMatch ? dateMatch[1] : "Date TBD",
        time: timeMatch ? timeMatch[1] : "Time TBD",
        location: locationMatch ? locationMatch[1].replace(/,?\s*Romeoville.*$/i, "").trim() : "Location TBD"
      };
    });

    const now = new Date();
    events = events.filter(e => e.date && e.date >= now);
    events.sort((a, b) => a.date - b.date);

    renderEvents(events);
  } catch (error) {
    console.error("Error fetching or parsing events:", error);
    document.getElementById("event-container").innerHTML = "<p>Error loading events.</p>";
  }
}

function renderEvents(events) {
  const container = document.getElementById("event-container");
  container.innerHTML = "";
  pages = [];

  const eventsPerPage = Math.ceil(events.length / MAX_PAGES) || 10;
  for (let i = 0; i < events.length && i / eventsPerPage < MAX_PAGES; i += eventsPerPage) {
    const pageEvents = events.slice(i, i + eventsPerPage);
    const pageDiv = document.createElement("div");
    pageDiv.className = "page";
    pageEvents.forEach(e => {
      const eventDiv = document.createElement("div");
      eventDiv.className = "event";
      eventDiv.innerHTML = `
        <div class="event-title">${e.title}</div>
        <div class="event-date">${e.dateText}</div>
        <div class="event-time">${e.time}</div>
        <div class="event-location">${e.location}</div>
      `;
      pageDiv.appendChild(eventDiv);
    });
    container.appendChild(pageDiv);
    pages.push(pageDiv);
  }

  if (pages.length > 0) {
    currentPageIndex = 0;
    pages[0].classList.add("active");
    setInterval(showNextPage, PAGE_DURATION);
  } else {
    container.innerHTML = "<p>No upcoming events found.</p>";
  }
}

function showNextPage() {
  if (pages.length <= 1) return;
  pages[currentPageIndex].classList.remove("active");
  currentPageIndex = (currentPageIndex + 1) % pages.length;
  pages[currentPageIndex].classList.add("active");
}

function scheduleMidnightReload() {
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0) - now;
  setTimeout(() => location.reload(true), msToMidnight);
}

fetchEvents();
setInterval(fetchEvents, REFRESH_INTERVAL);
scheduleMidnightReload();
