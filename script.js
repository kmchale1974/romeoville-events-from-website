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

    let events = items.map((item, index) => {
      const title = item.querySelector("title")?.textContent.trim() || "Untitled Event";
      const rawSummary = item.querySelector("summary")?.textContent || item.querySelector("description")?.textContent || "";

      // Decode HTML from the summary
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawSummary;
      const summary = tempDiv.innerText;

      // Log the raw decoded summary for first 3 items
      if (index < 3) console.log("SUMMARY", index + 1, ":", summary);

      // Try to extract event date range
      const dateMatch = summary.match(/Event date(?:s)?:\\s*([A-Za-z]+\\s+\\d{1,2},\\s*\\d{4})(?:\\s*-\\s*([A-Za-z]+\\s+\\d{1,2},\\s*\\d{4}))?/i);
      const timeMatch = summary.match(/(\\d{1,2}:\\d{2}\\s*[AP]M)/i);
      const locationMatch = summary.match(/Location:\\s*(.*?)\\n/i);

      let startDate = dateMatch ? new Date(dateMatch[1]) : null;
      let endDate = dateMatch?.[2] ? new Date(dateMatch[2]) : startDate;
      let displayDate = dateMatch
        ? dateMatch[2]
          ? dateMatch[1] + " - " + dateMatch[2]
          : dateMatch[1]
        : "Date TBD";

      const event = {
        title,
        startDate,
        endDate,
        dateText: displayDate,
        time: timeMatch?.[1] || "Time TBD",
        location: locationMatch?.[1]?.replace(/,?\\s*Romeoville.*$/i, "").trim() || "Location TBD"
      };

      console.log("Parsed event #" + (index + 1) + ":", event);
      return event;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    events = events.filter(e => e.startDate && e.endDate && e.endDate >= today);
    events.sort((a, b) => a.startDate - b.startDate);

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
  setTimeout(() => {
    location.href = location.href.split("?")[0] + "?t=" + new Date().getTime();
  }, msToMidnight);
}

console.log("Romeoville Events script is running...");
fetchEvents();
setInterval(fetchEvents, REFRESH_INTERVAL);
scheduleMidnightReload();
