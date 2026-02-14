const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const STORIES_FILE = path.join(__dirname, "stories.json");
const ADMIN_PASS = "admin123"; // Simple admin password

// Load stories from file
function loadStories() {
  try {
    return JSON.parse(fs.readFileSync(STORIES_FILE, "utf8"));
  } catch {
    return [];
  }
}

// Save stories to file
function saveStories(stories) {
  fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2));
}

// Middleware to check admin access
function checkAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  if (adminKey !== ADMIN_PASS) {
    return res.status(403).json({ error: "Unauthorized admin access" });
  }
  next();
}

// ==================== PUBLIC ENDPOINTS ====================

// Get Home Page
app.get("/", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Adventure Game</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Arial", sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
        }
        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        button {
            display: block;
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }
        button:hover { background: #764ba2; }
        .divider {
            text-align: center;
            color: #999;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Adventure Game</h1>
        <p class="subtitle">Embark on an epic journey</p>
        <button onclick="goToPlay()">▶️ Start Game</button>
        <button onclick="goToStories()">📖 View All Stories</button>
        <div class="divider">OR</div>
        <button onclick="goToAdmin()">🔐 Admin Panel</button>
    </div>
    <script>
        function goToPlay() { window.location.href = '/play/1'; }
        function goToStories() { window.location.href = '/stories'; }
        function goToAdmin() { 
            const pass = prompt('Enter admin password:');
            if (pass) {
                window.location.href = '/admin?adminKey=' + pass;
            }
        }
    </script>
</body>
</html>`);
});

// Play individual story
app.get("/play/:storyId", (req, res) => {
  const stories = loadStories();
  const storyId = parseInt(req.params.storyId);
  const story = stories.find(s => s.id === storyId);

  if (!story) {
    return res.status(404).send("Story not found");
  }

  // Split story into sentences
  const sentences = story.content.match(/[^.!?]+[.!?]+/g) || [story.content];
  const cleanSentences = sentences.map(s => s.trim());

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${story.title}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Georgia", serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 700px;
            margin: 0 auto;
        }
        h1 {
            color: #667eea;
            margin-top: 0;
        }
        .story-text {
            font-size: 20px;
            line-height: 1.8;
            color: #333;
            margin: 30px 0;
            min-height: 100px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            border-radius: 5px;
        }
        .nav-buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        .nav-buttons a {
            flex: 1;
            padding: 12px;
            background: #999;
            color: white;
            border-radius: 8px;
            text-decoration: none;
            text-align: center;
            cursor: pointer;
            transition: background 0.3s;
        }
        .nav-buttons a:hover { background: #666; }
        .progress {
            text-align: center;
            color: #999;
            font-size: 14px;
            margin-top: 10px;
        }
        .hint {
            text-align: center;
            color: #667eea;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📖 ${story.title}</h1>
        <div class="story-text" id="storyDisplay"></div>
        <div class="progress">
            <span id="progressText">Line 1 of ${cleanSentences.length}</span>
        </div>
        
        <div class="hint">Press ENTER for next line</div>
        
        <div class="nav-buttons">
            <a href="/">← Home</a>
            <a href="/stories">📚 All Stories</a>
            <a href="/play/1">🔄 Start Over</a>
        </div>
    </div>

    <script>
        const sentences = ${JSON.stringify(cleanSentences)};
        let currentLine = 0;
        
        function displayLinesToCurrent() {
            let display = '';
            for (let i = 0; i <= currentLine && i < sentences.length; i++) {
                display += sentences[i] + ' ';
            }
            document.getElementById('storyDisplay').textContent = display.trim();
            document.getElementById('progressText').textContent = 
                'Line ' + (currentLine + 1) + ' of ' + sentences.length;
        }
        
        // Display first line on load
        displayLinesToCurrent();
        
        // Handle Enter key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentLine < sentences.length - 1) {
                    currentLine++;
                    displayLinesToCurrent();
                } else {
                    // All lines shown, go home
                    window.location.href = '/';
                }
            }
        });
    </script>
</body>
</html>`);
});

// View all stories
app.get("/stories", (req, res) => {
  const stories = loadStories();

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>All Stories</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Arial", sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        h1 {
            color: white;
            text-align: center;
            margin-bottom: 30px;
        }
        .stories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .story-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s;
        }
        .story-card:hover { transform: translateY(-5px); }
        .story-card h2 {
            color: #667eea;
            margin: 0 0 10px 0;
        }
        .story-card p {
            color: #666;
            margin: 10px 0;
            font-size: 14px;
        }
        .story-card button {
            width: 100%;
            padding: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.3s;
        }
        .story-card button:hover { background: #764ba2; }
        .back-button {
            text-align: center;
            margin-top: 30px;
        }
        .back-button a {
            display: inline-block;
            padding: 10px 20px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 All Stories</h1>
        <div class="stories-grid">
            ${stories.map(story => `
                <div class="story-card">
                    <h2>${story.title}</h2>
                    <p>by ${story.author}</p>
                    <p>${story.content.substring(0, 100)}...</p>
                    <button onclick="window.location.href='/play/${story.id}'">Read Story</button>
                </div>
            `).join("")}
        </div>
        <div class="back-button">
            <a href="/">← Back to Home</a>
        </div>
    </div>
</body>
</html>`);
});

// ==================== API ENDPOINTS ====================

// Get all stories API
app.get("/api/stories", (req, res) => {
  res.json(loadStories());
});

// Get single story API
app.get("/api/stories/:id", (req, res) => {
  const stories = loadStories();
  const story = stories.find(s => s.id === parseInt(req.params.id));
  if (!story) return res.status(404).json({ error: "Story not found" });
  res.json(story);
});

// ==================== ADMIN ENDPOINTS ====================

// Admin Dashboard
app.get("/admin", checkAdmin, (req, res) => {
  const stories = loadStories();

  let storiesHtml = stories.map(s => `
    <div class="story-item">
        <span>${s.title} (ID: ${s.id})</span>
        <button class="delete-btn" onclick="deleteStory(${s.id})">Delete</button>
    </div>
  `).join("");

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Panel</title>
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Arial", sans-serif;
            background: #f0f0f0;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .admin-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .panel {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        input, textarea {
            width: 100%;
            padding: 10px;
            margin: 5px 0;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: inherit;
        }
        textarea { min-height: 100px; }
        button {
            width: 100%;
            padding: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
        }
        button:hover { background: #764ba2; }
        .delete-btn { background: #e74c3c; }
        .delete-btn:hover { background: #c0392b; }
        .story-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .story-item {
            background: #f9f9f9;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .story-item button { width: auto; margin: 0 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Admin Panel</h1>
        
        <div class="admin-grid">
            <div class="panel">
                <h2>Create New Story</h2>
                <input type="text" id="title" placeholder="Story Title" />
                <input type="text" id="author" placeholder="Author Name" />
                <textarea id="content" placeholder="Story Content"></textarea>
                <button onclick="createStory()">Create Story</button>
            </div>
            
            <div class="panel">
                <h2>Manage Stories</h2>
                <div class="story-list" id="storyList">
                    ${storiesHtml}
                </div>
            </div>
        </div>
        
        <button onclick="window.location.href='/'">← Back to Home</button>
    </div>

    <script>
        const adminKey = '${req.query.adminKey}';

        async function createStory() {
            const title = document.getElementById('title').value;
            const author = document.getElementById('author').value;
            const content = document.getElementById('content').value;

            if (!title || !author || !content) {
                alert('Please fill all fields');
                return;
            }

            const response = await fetch('/api/admin/stories', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ title, author, content })
            });

            if (response.ok) {
                alert('Story created!');
                location.reload();
            } else {
                alert('Error creating story');
            }
        }

        async function deleteStory(id) {
            if (!confirm('Delete this story?')) return;

            const response = await fetch('/api/admin/stories/' + id, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });

            if (response.ok) {
                alert('Story deleted!');
                location.reload();
            } else {
                alert('Error deleting story');
            }
        }
    </script>
</body>
</html>`);
});

// Create new story (Admin only)
app.post("/api/admin/stories", checkAdmin, (req, res) => {
  const stories = loadStories();
  const { title, author, content, choices } = req.body;

  if (!title || !author || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newStory = {
    id: Math.max(...stories.map(s => s.id), 0) + 1,
    title,
    author,
    content,
    choices: choices || [{ text: "Back", next: 1 }],
    createdAt: new Date().toISOString()
  };

  stories.push(newStory);
  saveStories(stories);

  res.status(201).json(newStory);
});

// Update story (Admin only)
app.put("/api/admin/stories/:id", checkAdmin, (req, res) => {
  const stories = loadStories();
  const storyIndex = stories.findIndex(s => s.id === parseInt(req.params.id));

  if (storyIndex === -1) {
    return res.status(404).json({ error: "Story not found" });
  }

  stories[storyIndex] = { ...stories[storyIndex], ...req.body };
  saveStories(stories);

  res.json(stories[storyIndex]);
});

// Delete story (Admin only)
app.delete("/api/admin/stories/:id", checkAdmin, (req, res) => {
  const stories = loadStories();
  const filtered = stories.filter(s => s.id !== parseInt(req.params.id));

  if (stories.length === filtered.length) {
    return res.status(404).json({ error: "Story not found" });
  }

  saveStories(filtered);
  res.json({ message: "Story deleted" });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🎮 Adventure Game running at http://localhost:${PORT}`);
  console.log(`📚 Admin credentials - Password: admin123`);
});
