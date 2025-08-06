console.log("Romeoville Events script is running...");

const feedUrl = "https://amazing-sopapillas-b6d3e4.netlify.app/.netlify/functions/cors-proxy/https://www.romeoville.org/RSSFeed.aspx?ModID=58&CID=All-calendar.xml";

function fetchAndDisplayEvents() {
  fetch(feedUrl)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      const items = data.querySelectorAll("item");
      const now = new Date();
      let events = [];

      items.forEach((item, index) => {
        const title = item.querySelector("title")?.textContent || "Untitled";
        const summary = item.querySelector("description")?.textContent || "";
        const cleanSummary = summary.replace(/<[^>]+>/g, "").replace(/\n/g, "").trim();

        let startDate = null, endDate = null, time = "Time TBD", location = "", dateText = "Date TBD";

        let multi = cleanSummary.match(/Event dates?: ([^–-]+)[–-]+([^E]+)Event Time: ([^L]+)Location: (.+)/i);
        if (multi) {
          startDate = new Date(multi[1].trim());
          endDate = new Date(multi[2].trim());
          time = multi[3].trim();
          location = multi[4].replace("Romeoville, IL", "").trim();
          dateText = multi[1].trim() + " - " + multi[2].trim();
        } else {
          let single = cleanSummary.match(/Event date: ([^E]+)Event Time: ([^L]+)Location: (.+)/i);
          if (single) {
            startDate = new Date(single[1].trim());
            endDate = new Date(single[1].trim());
            time = single[2].trim();
            location = single[3].replace("Romeoville, IL", "").trim();
            dateText = single[1].trim();
          }
        }

        if (endDate && endDate >= new Date(now.setHours(0, 0, 0, 0))) {
          events.push({ title, startDate, endDate, dateText, time, location });
        }
      });

      if (events.length === 0) {
        document.getElementById("event-container").innerHTML = "<div class='page active'><p>No upcoming events.</p></div>";
        return;
      }

      const pages = [];
      for (let i = 0; i < events.length; i += 10) {
        const page = events.slice(i, i + 10);
        pages.push(page);
      }

      const container = document.getElementById("event-container");
      pages.forEach((page, i) => {
        const div = document.createElement("div");
        div.className = "page" + (i === 0 ? " active" : "");
        page.forEach(event => {
          const el = document.createElement("div");
          el.className = "event";
          el.innerHTML = `<div class='event-title'>${event.title}</div>
                          <div>${event.dateText}</div>
                          <div>${event.time}</div>
                          <div>${event.location}</div>`;
          div.appendChild(el);
        });
        container.appendChild(div);
      });

      let current = 0;
      setInterval(() => {
        const pages = document.querySelectorAll(".page");
        pages[current].classList.remove("active");
        current = (current + 1) % pages.length;
        pages[current].classList.add("active");
      }, 20000);
    });
}

function scheduleMidnightReload() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 5, 0);
  const timeout = midnight.getTime() - now.getTime();
  setTimeout(() => location.reload(true), timeout);
}

fetchAndDisplayEvents();
scheduleMidnightReload();
