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

    items.forEach(item => {
      const title = item.querySelector("title")?.textContent.trim() ?? "";
      const descriptionHTML = item.querySelector("description")?.textContent ?? "";
      const descDoc = new DOMParser().parseFromString(descriptionHTML, "text/html");
      const html = descDoc.body.innerHTML;

      // Extract dates
      const dateRangeMatch = html.match(/Event dates:<\/strong>\s*([^<]+)\s*-\s*([^<]+)/i);
      const singleDateMatch = html.match(/Event date:<\/strong>\s*([^<]+)/i);
      const timeMatch = html.match(/Event Time:<\/strong>\s*([^<]+)/i);
      const locationMatch = html.match(/Location:<\/strong>\s*<br>\s*([^<]+)<br>/i);

      let dateText = "Date TBD";
      let time = timeMatch?.[1]?.trim() ?? "Time TBD";
      let location = locationMatch?.[1]?.replace(/Romeoville, IL.*/i, "").trim() ?? "Location TBD";
      let startDate = null;
      let endDate = null;

      if (dateRangeMatch) {
        const [_, startStr, endStr] = dateRangeMatch;
        startDate = new Date(startStr + " 00:00");
        endDate = new Date(endStr + " 23:59");
        dateText = `${startStr} – ${endStr}`;
      } else if (singleDateMatch) {
        const startStr = singleDateMatch[1];
        startDate = new Date(startStr + " 00:00");
        dateText = startStr;
      }

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

    // Render first 10 events
    container.innerHTML = "";
    upcomingEvents.slice(0, 10).forEach(event => {
      const el = document.createElement("div");
      el.className = "event";
      el.innerHTML = `
        <div class="title">${event.title}</div>
        <div class="datetime">${event.dateText} &nbsp; ${event.time}</div>
        <div class="location">${event.location}</div>
      `;
      container.appendChild(el);
    });

  } catch (error) {
    console.error("Error loading events:", error);
  }
}

fetchAndDisplayEvents();
