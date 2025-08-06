console.log("Romeoville Events script is running...");

const proxyUrl = "https://amazing-sopapillas-b6d3e4.netlify.app/.netlify/functions/cors-proxy/";
const feedUrl = "https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const fullUrl = proxyUrl + feedUrl;

async function fetchAndDisplayEvents() {
  try {
    const response = await fetch(fullUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = xml.querySelectorAll("item");
    const events = [];

    items.forEach((item, index) => {
      const title = item.querySelector("title")?.textContent.trim() ?? "";
      const descriptionHTML = item.querySelector("description")?.textContent ?? "";
      console.log(`DEBUG description [${index}]:`, descriptionHTML);
      const tempDoc = new DOMParser().parseFromString(descriptionHTML, "text/html");
      const rawText = tempDoc.body.textContent.replace(/\s+/g, " ").trim();

      // Parse date(s)
      let startDate = null;
      let endDate = null;
      let dateText = "Date TBD";

      const rangeMatch = rawText.match(/Event dates?: ([A-Za-z]+\s+\d{1,2},\s+\d{4}) - ([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
      const singleDateMatch = rawText.match(/Event date: ([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);

      if (rangeMatch) {
        startDate = new Date(rangeMatch[1]);
        endDate = new Date(rangeMatch[2] + " 23:59");
        dateText = `${rangeMatch[1]} – ${rangeMatch[2]}`;
      } else if (singleDateMatch) {
        startDate = new Date(singleDateMatch[1]);
        endDate = null;
        dateText = singleDateMatch[1];
      }

      // Time
      const timeMatch = rawText.match(/Event Time: ([0-9:AMP\- ]+)/i);
      const time = timeMatch ? timeMatch[1].trim() : "Time TBD";

      // Location
      const locationMatch = rawText.match(/Location: ([^<]+?)Romeoville/i);
      const location = locationMatch ? locationMatch[1].trim() : "Location TBD";

      events.push({
        title,
        startDate,
        endDate,
        dateText,
        time,
        location
      });
    });

    console.log("Raw parsed events: ", events);

    const now = new Date();
    const upcomingEvents = events.filter(event => {
      if (!event.startDate) return false;
      return event.endDate ? event.endDate >= now : event.startDate >= now;
    });

    console.log("Filtered upcoming events: ", upcomingEvents);

    const container = document.getElementById("event-list");
    if (!container) return;

    if (upcomingEvents.length === 0) {
      container.innerHTML = "<div class='event'><p>No upcoming events found.</p></div>";
      return;
    }

    // Render first 10 events (paging comes later)
    container.innerHTML = "";
    upcomingEvents.slice(0, 10).forEach(event => {
      const el = document.createElement("div");
      el.className = "event";
      el.innerHTML = `
        <div class="title">${event.title}</div>
        <div class="datetime">${event.dateText} – ${event.time}</div>
        <div class="location">${event.location}</div>
      `;
      container.appendChild(el);
    });

  } catch (error) {
    console.error("Error loading events:", error);
  }
}

fetchAndDisplayEvents();
