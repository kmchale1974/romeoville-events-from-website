console.log("Romeoville Events script is running...");

const feedUrl =
  "https://amazing-sopapillas-b6d3e4.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";

async function fetchAndDisplayEvents() {
  try {
    const response = await fetch(feedUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");
    const items = xml.querySelectorAll("item");

    const events = [];

    items.forEach((item, index) => {
      const title = item.querySelector("title")?.textContent.trim() || "No title";
      const summary = item.querySelector("description")?.textContent || "";
      const link = item.querySelector("link")?.textContent || "";

      console.log(`SUMMARY ${index + 1} :`, summary);

      // Extract date range or single date
      const { startDate, endDate } = extractDatesFromSummary(summary);

      // Extract time
      const timeMatch = summary.match(/<strong>Event Time: <\/strong>(.*?)<br>/i);
      const time = timeMatch ? timeMatch[1].trim() : "Time TBD";

      // Extract location
      const locationMatch = summary.match(/<strong>Location:<\/strong>(.*?)<br>/i);
      const location = locationMatch
        ? locationMatch[1].replace(/<br\s*\/?>/gi, " ").trim()
        : "Location TBD";

      const dateText = startDate
        ? startDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : "Date TBD";

      events.push({ title, startDate, endDate, dateText, time, location, link });
    });

    console.log("Raw parsed events:", events);

    // Filter out past events
    const today = new Date();
    const filteredEvents = events.filter((event) => {
      return event.startDate && event.endDate && event.endDate >= today;
    });

    console.log("Filtered upcoming events:", filteredEvents);

    // Display to page (you can customize this)
    const container = document.getElementById("events");
    if (!filteredEvents.length) {
      container.innerHTML = "<p>No upcoming events found.</p>";
      return;
    }

    filteredEvents.forEach((event) => {
      const div = document.createElement("div");
      div.className = "event";
      div.innerHTML = `
        <h3>${event.title}</h3>
        <p>${event.dateText}</p>
        <p>${event.time}</p>
        <p>${event.location}</p>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading events:", error);
    document.getElementById("events").innerHTML = "<p>Error loading events.</p>";
  }
}

function extractDatesFromSummary(summary) {
  const dateRangeRegex = /Event dates:<\/strong>\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})<br>/i;
  const singleDateRegex = /Event date:<\/strong>\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})\s*<br>/i;

  let startDateStr = null;
  let endDateStr = null;

  const rangeMatch = summary.match(dateRangeRegex);
  const singleMatch = summary.match(singleDateRegex);

  if (rangeMatch) {
    startDateStr = rangeMatch[1].trim();
    endDateStr = rangeMatch[2].trim();
  } else if (singleMatch) {
    startDateStr = singleMatch[1].trim();
    endDateStr = singleMatch[1].trim();
  }

  if (!startDateStr) {
    return { startDate: null, endDate: null };
  }

  const startDate = new Date(startDateStr + " 00:00:00");
  const endDate = new Date(endDateStr + " 23:59:59");

  return { startDate, endDate };
}

fetchAndDisplayEvents();
