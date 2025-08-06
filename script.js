console.log("Romeoville Events script is running...");

const proxyUrl = "https://amazing-sopapillas-b6d3e4.netlify.app/.netlify/functions/cors-proxy/";
const feedUrl = "https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const fullUrl = proxyUrl + feedUrl;

async function fetchAndDisplayEvents() {
  try {
    const res = await fetch(fullUrl);
    const text = await res.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const items = xml.querySelectorAll("item");

    const events = [];

    items.forEach(item => {
      const title = item.querySelector("title")?.textContent.trim() || "No title";
      const link = item.querySelector("link")?.textContent.trim() || "";
      const description = item.querySelector("description")?.textContent || "";
      const rawSummary = description
        .replace(/<[^>]+>/g, "") // Strip HTML tags
        .replace(/\s+/g, " ")    // Normalize whitespace
        .trim();

      const lines = rawSummary.split(/(?=<strong>)/).map(line =>
        line.replace(/<[^>]+>/g, "").trim()
      );

      const event = {
        title,
        link,
        dateText: "Date TBD",
        time: "Time TBD",
        location: "",
        startDate: null,
        endDate: null,
      };

      for (const line of lines) {
        if (/^Event date:/.test(line)) {
          const match = line.match(/Event date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
          if (match) {
            const parsed = new Date(match[1]);
            if (!isNaN(parsed)) {
              event.startDate = parsed;
              event.dateText = parsed.toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric'
              });
            }
          }
        } else if (/^Event dates:/.test(line)) {
          const match = line.match(/Event dates:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})\s*-\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/);
          if (match) {
            const start = new Date(match[1]);
            const end = new Date(match[2]);
            if (!isNaN(start) && !isNaN(end)) {
              event.startDate = start;
              event.endDate = end;
              event.dateText = `${start.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
              })} – ${end.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric'
              })}`;
            }
          }
        } else if (/^Event Time:/.test(line)) {
          event.time = line.replace("Event Time:", "").trim();
        } else if (/^Location:/.test(line)) {
          const location = line.replace("Location:", "").trim();
          event.location = location.replace(/Romeoville, IL\s*\d{5}/, "").trim();
        }
      }

      if (!event.startDate) {
        console.warn(`⚠️ No valid startDate parsed for: ${title}`);
      }

      events.push(event);
    });

    console.log("Raw parsed events:", events);

    const now = new Date();
    const upcoming = events.filter(e => e.startDate && e.startDate >= now);
    upcoming.sort((a, b) => a.startDate - b.startDate);

    console.log("Filtered upcoming events:", upcoming);

    const container = document.getElementById("events");
    if (!container) return;

    if (upcoming.length === 0) {
      container.innerHTML = "<p>No upcoming events found.</p>";
      return;
    }

    container.innerHTML = upcoming.slice(0, 10).map(event => `
      <div class="event">
        <h3>${event.title}</h3>
        <p><strong>${event.dateText}</strong></p>
        <p>${event.time}</p>
        <p>${event.location}</p>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading events:", err);
    const container = document.getElementById("events");
    if (container) {
      container.innerHTML = "<p>Failed to load events.</p>";
    }
  }
}

fetchAndDisplayEvents();
