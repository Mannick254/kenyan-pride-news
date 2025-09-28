const newsFeed = document.getElementById("news-feed");

const newsItems = [
  {
    title: "Fuel Prices Surge Across Nairobi",
    category: "economy",
    impact: "urgent",
    content: "Kenyans face rising transport costs as fuel prices hit a new high this week."
  },
  {
    title: "New Curriculum Sparks Debate",
    category: "education",
    impact: "controversial",
    content: "Parents and teachers weigh in on the CBC rollout and its long-term effects."
  },
  {
    title: "Local Artist Wins Global Award",
    category: "culture",
    impact: "hopeful",
    content: "Mombasa-based painter honored for work highlighting coastal heritage."
  }
];

function renderNews(items) {
  newsFeed.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "news-item";
    div.innerHTML = `
      <h2>${item.title}</h2>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Impact:</strong> ${item.impact}</p>
      <p>${item.content}</p>
    `;
    newsFeed.appendChild(div);
  });
}

function filterNews(category) {
  if (category === "all") {
    renderNews(newsItems);
  } else {
    const filtered = newsItems.filter(item => item.category === category);
    renderNews(filtered);
  }
}

renderNews(newsItems);
function searchNews() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = newsItems.filter(item =>
    item.title.toLowerCase().includes(query) ||
    item.content.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query) ||
    item.impact.toLowerCase().includes(query)
  );
  renderNews(filtered);
}
document.getElementById("storyForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("storyTitle").value;
  const content = document.getElementById("storyContent").value;
  const category = document.getElementById("storyCategory").value;

  const story = {
    title,
    content,
    category,
    impact: "pending",
    timestamp: new Date().toISOString()
  };

  // Simple AES-like encryption placeholder
  const encrypted = btoa(JSON.stringify(story)); // Replace with real AES later

  localStorage.setItem(`story-${Date.now()}`, encrypted);
  alert("✅ Story submitted! Awaiting admin review.");
  this.reset();
});
function loadSubmissions() {
  const list = document.getElementById("submissionList");
  list.innerHTML = "";

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith("story-")) {
      const encrypted = localStorage.getItem(key);
      const decrypted = JSON.parse(atob(encrypted)); // Replace with AES later

      const div = document.createElement("div");
      div.className = "submission";
      div.innerHTML = `
        <h3>${decrypted.title}</h3>
        <p><strong>Category:</strong> ${decrypted.category}</p>
        <p>${decrypted.content}</p>
        <button onclick="publishStory('${key}')">✅ Publish</button>
        <button onclick="deleteStory('${key}')">🗑️ Delete</button>
      `;
      list.appendChild(div);
    }
  });
}

function publishStory(key) {
  const encrypted = localStorage.getItem(key);
  const story = JSON.parse(atob(encrypted));
  story.impact = "community"; // Mark as published

  newsItems.push(story);
  renderNews(newsItems);
  alert("✅ Story published to public feed.");
  localStorage.removeItem(key);
  loadSubmissions();
}

function deleteStory(key) {
  localStorage.removeItem(key);
  alert("🗑️ Story deleted.");
  loadSubmissions();
}
