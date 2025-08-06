console.log("Romeoville Events script is running...");

const proxyUrl = "https://amazing-sopapillas-b6d3e4.netlify.app/.netlify/functions/cors-proxy/";
const feedUrl = "https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";
const fullUrl = proxyUrl + feedUrl;

fetch(fullUrl)
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(data => {
    const items = data.querySelectorAll("item");
    const events = [];

    items.forEach((item, index) => {
      const title = item.querySelector("title")?.textContent.trim() || "No Title";
      const link = item.querySelector("link")?.textContent.trim() || "#";
      const description = item.querySelector("description")?.textContent || "";
      const summary = description
        .replace(/<[^>]+>/g, "") // Remove HTML tags
        .replace(/\s+/g, " ")    // Normalize whitespace
        .trim();

      console.log(`SUMMARY ${index + 1} : ${summary}`);

      const dateMatch = summary.match(/Event date(?:s)?: ([A-Za-z]+\s\d{1,2},\s\d{4})(?:\s*-\s*([A-Za-z]+\s\d{1,2},\s\d{4}))?/i);
      const timeMatch = summary.match(/Event Time:\s*([0-9:APM\s-]+)/i);
      const locationMatch = summary.match(/Location:\s*(.*?)\s*(?:[A-Z][a-z]{2,8}, IL \d{5})?/i);

      let startDate = null, endDate = null;
      if (dateMatch) {
        startDate = new Date(dateMatch[1]);
        endDate = dateMatch[2] ? new Date(dateMatch[2]) : startDate;
      }

      const event = {
        title,
        dateText: dateMatch ? dateMatch[0] : "Date TBD",
        startDate,
        endDate,
        time: timeMatch ? timeMatch[1].trim() : "Time TBD",
        location: locationMatch ? locationMatch[1].trim() : "Location TBD",
        link,
      };

      console.log(`Parsed event #${index + 1}:`, event);
      events.push(event);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0); // ✅ Important: Normalize to midnight

    const filteredEvents = events.filter(event => {
      return event.startDate && event.endDate && event.endDate >= today;
    });

    const container = document.getElementById("events");
    if (filteredEvents.length === 0) {
      container.innerHTML = "<p>No upcoming events found.</p>";
      return;
    }

    filteredEvents.forEach(event => {
      const eventElement = document.createElement("div");
      eventElement.classList.add("event");

      eventElement.innerHTML = `
        <h3><a href="${event.link}" target="_blank">${event.title}</a></h3>
        <p><strong>Date:</strong> ${event.dateText}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
      `;

      container.appendChild(eventElement);
    });
  })
  .catch(error => {
    console.error("Error loading events:", error);
    document.getElementById("events").innerHTML = "<p>Failed to load events.</p>";
  });
