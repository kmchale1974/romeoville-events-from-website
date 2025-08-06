
const RSS_URL = "https://corsproxy.io/?" + encodeURIComponent("https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml");
const REFRESH_INTERVAL = 60 * 60 * 1000;
const PAGE_DURATION = 20000;
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

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawSummary;
      const summary = tempDiv.innerText;

      // Log the full decoded summary for debugging
      if (index < 5) console.log("SUMMARY", index + 1, ":", summary);

      const event = {
        title,
        startDate: null,
        endDate: null,
        dateText: "Date TBD",
        time: "Time TBD",
        location: "Location TBD"
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

const feedUrl = "https://kmchale1974.github.io/romeoville-cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";

function fetchFeed() {
  fetch(feedUrl)
    .then(res => res.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      const items = Array.from(data.querySelectorAll("item"));
      if (!items.length) return console.error("❌ No items found in feed");

      items.forEach((item, index) => {
        const title = item.querySelector("title")?.textContent?.trim() || "No title";
        const summaryHtml = item.querySelector("description")?.textContent || "";
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = summaryHtml;
        const summaryText = tempDiv.textContent.trim();

        if (index < 5) {
          console.log(`🎯 SUMMARY ${index + 1}:`, summaryText);
        }

        console.log(`Parsed event #${index + 1}:`, {
          title,
          summaryRaw: summaryHtml,
          summaryText
        });
      });
    })
    .catch(err => console.error("❌ Error loading feed:", err));
}

fetchFeed();
