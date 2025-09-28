const newsFeed = document.getElementById("news-feed");

const newsItems = [
  {
    title: "Fuel Prices Surge Across Nairobi",
    category: "economy",
    impact: "urgent",
    content: "Kenyans face rising transport costs as fuel prices hit a new high this week.",
    timestamp: "2025-09-28T08:30:00Z"
  },
  {
    title: "New Curriculum Sparks Debate",
    category: "education",
    impact: "controversial",
    content: "Parents and teachers weigh in on the CBC rollout and its long-term effects.",
    timestamp: "2025-09-27T14:00:00Z"
  },
  {
    title: "Local Artist Wins Global Award",
    category: "culture",
    impact: "hopeful",
    content: "Mombasa-based painter honored for work highlighting coastal heritage.",
    timestamp: "2025-09-26T10:15:00Z"
  }
];

function renderNews(items) {
  newsFeed.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "news-item";
    div.setAttribute("data-impact", item.impact);

    div.innerHTML = `
      <h2>${item.title}</h2>
      <p><strong>Category:</strong> ${item.category}</p>
      <p><strong>Impact:</strong> ${item.impact}</p>
      <p>${item.content}</p>
      ${item.timestamp ? `<p><em>Published: ${new Date(item.timestamp).toLocaleString()}</em></p>` : ""}
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

function filterImpact(impact) {
  if (impact === "all") {
    renderNews(newsItems);
  } else {
    const filtered = newsItems.filter(item => item.impact === impact);
    renderNews(filtered);
  }
}

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
  const author = document.getElementById("storyAuthor").value;

  const story = {
    title,
    content,
    category,
    author: author || "Anonymous",
    impact: "pending",
    timestamp: new Date().toISOString()
  };

  const encrypted = btoa(JSON.stringify(story));
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
      const decrypted = JSON.parse(atob(encrypted));

      const div = document.createElement("div");
      div.className = "submission";
      div.innerHTML = `
        <h3>${decrypted.title}</h3>
        <p><strong>Category:</strong> ${decrypted.category}</p>
        <p><strong>Author:</strong> ${decrypted.author}</p>
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
  story.impact = "community";

  publishStoryToGitHub(story)
    .then(() => {
      alert("✅ Story published to GitHub!");
      localStorage.removeItem(key);
      loadSubmissions();
      loadGlobalStories();
    })
    .catch(err => {
      console.error("GitHub publish error:", err);
      alert("❌ Failed to publish story to GitHub.");
    });
}

function deleteStory(key) {
  localStorage.removeItem(key);
  alert("🗑️ Story deleted.");
  loadSubmissions();
}

async function publishStoryToGitHub(story) {
  const token = localStorage.getItem("githubToken");
  if (!token) {
    alert("❌ GitHub token not found. Please set it in your browser console using:\n\nlocalStorage.setItem(\"githubToken\", \"your-token-here\")");
    return;
  }

  const repo = "mannick254/kenyan-pride-news";
  const path = "stories.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });

    const data = await response.json();
    const sha = data.sha;
    const existingContent = JSON.parse(atob(data.content));

    existingContent.push(story);

    const updatedContent = btoa(JSON.stringify(existingContent, null, 2));
    const commitMessage = `Publish story: ${story.title}`;

    await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: updatedContent,
        sha: sha
      })
    });
  } catch (err) {
    console.error("GitHub publish error:", err);
    alert("❌ Failed to publish story to GitHub.");
  }
}

async function loadGlobalStories() {
  const url = "https://raw.githubusercontent.com/mannick254/kenyan-pride-news/master/stories.json";

  try {
    const response = await fetch(url);
    const stories = await response.json();

    const newStories = stories.filter(story =>
      !newsItems.some(existing => existing.title === story.title)
    );

    newsItems.push(...newStories);
    renderNews(newsItems);
  } catch (err) {
    console.error("Failed to load global stories:", err);
  }
}

renderNews(newsItems);
loadGlobalStories();
