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
  const token = "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";
  const repo = "mannick254/kenyan-pride-news";
  const path = "stories.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

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
