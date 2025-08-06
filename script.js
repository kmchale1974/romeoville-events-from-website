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
      const lines = descDoc.body.innerText.split("\n").map(l => l.trim()).filter(Boolean);

      let dateText = "Date TBD";
      let time = "Time TBD";
      let location = "Location TBD";
      let startDate = null;
      let endDate = null;

      lines.forEach(line => {
        if (line.startsWith("Event date:")) {
          const match = line.match(/Event date:\s*(.+)/i);
          if (match) {
            dateText = match[1];
            const parsed = new Date(match[1] + " 00:00");
            if (!isNaN(parsed)) startDate = parsed;
          }
        } else if (line.startsWith("Event dates:")) {
          const match = line.match(/Event dates:\s*(.+)\s*-\s*(.+)/i);
          if (match) {
            const start = new Date(match[1] + " 00:00");
            const end = new Date(match[2] + " 23:59");
            if (!isNaN(start)) startDate = start;
            if (!isNaN(end)) endDate = end;
            dateText = `${match[1]} – ${match[2]}`;
          }
        } else if (line.startsWith("Event Time:")) {
          const match = line.match(/Event Time:\s*(.+)/i);
          if (match) time = match[1];
        } else if (line.startsWith("Location:")) {
          // Next line(s) usually contain the address
          const locIndex = lines.indexOf(line);
          location = lines[locIndex + 1]?.replace(/Romeoville, IL.*/i, "").trim() ?? "";
        }
      });

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

    // Render first page (limit 10)
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
