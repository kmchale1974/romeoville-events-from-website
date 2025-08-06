
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
