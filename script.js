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
      const description = new DOMParser().parseFromString(descriptionHTML, "text/html").body.textContent;

      // Match either "Event date:" or "Event dates:"
      const dateMatch = description.match(/Event date[s]*:\s*(.*?)\s*(?=Event Time:)/i);
      const timeMatch = description.match(/Event Time:\s*(.*?)\s*(?=Location:)/i);
      const locationMatch = description.match(/Location:\s*(.*?)Romeoville, IL/i);

      const dateText = dateMatch?.[1]?.trim() ?? "";
      const time = timeMatch?.[1]?.trim() ?? "Time TBD";
      const location = locationMatch?.[1]?.replace(/<br>/g, "").trim() ?? "Location TBD";

      let startDate = null;
      let endDate = null;

      if (dateText.includes(" - ")) {
        const [startStr, endStr] = dateText.split(" - ");
        startDate = new Date(startStr + " 00:00:00");
        endDate = new Date(endStr + " 23:59:59");
      } else if (dateText) {
        startDate = new Date(dateText + " 00:00:00");
      }

      events.push({
        title,
        startDate,
        endDate,
        dateText: dateText || "Date TBD",
        time,
        location
      });
    });

    console.log("Raw parsed events: ", events);

    const now = new Date();
    const upcomingEvents = events.filter(event => {
      return event.startDate && event.startDate >= now;
    });

    console.log("Filtered upcoming events: ", upcomingEvents);

    const container = document.getElementById("event-list");
    if (!container) return;

    if (upcomingEvents.length === 0) {
      container.innerHTML = "<div class='event'><p>No upcoming events found.</p></div>";
      return;
    }

    // Render first page of results
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
