const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

let stories = [
    {
        id: "adventure-001",
        message: `You stand at the edge of a dark forest. The moonlight filters through the twisted trees ahead.
A cold wind whispers through the branches, carrying with it the scent of adventure and danger.
You adjust your backpack and take a deep breath.
The forest calls to you, promising secrets and treasures beyond imagination.
You see two paths ahead - one glowing with a faint blue light, the other hidden in shadows.
Your heart races as you realize this is the beginning of an epic journey.
The blue path seems safe but boring, leading toward distant mountains.
The shadow path is mysterious and shrouded in fog, but something draws you toward it.
You remember the ancient map you found in your grandmother's attic.
It mentioned a hidden temple somewhere in this very forest.
The temple is said to contain the legendary Crystal of Eternity.
Many adventurers have searched for it, but none have returned with proof of its existence.
You feel a sense of purpose wash over you as you grip your torch tighter.
The flames flicker and dance, casting dancing shadows on the forest floor.
You take a step forward onto the shadow path, committing yourself to the unknown.
The adventure of a lifetime is about to begin.
Every step deeper into the forest fills you with both excitement and trepidation.
You hear strange sounds - the call of a distant owl, rustling leaves, something else.
Your instincts tell you to press onward, to discover what awaits you in the darkness.
The forest seems to embrace you as you venture deeper into its mysterious depths.`,
        status: "online"
    }
];


app.get('/', (req, res) => {
    res.json({
        success: true,
        message: "Story Capsule Reader API",
        endpoints: {
            "GET /stories": "List all stories",
            "GET /story/:id": "Read a single story",
            "POST /story/:id/next": "Move story to next status (admin only)"
        }
    });
});

app.post('/story', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({
            success: false,
            error: "Message is required"
        });
    }

    const story = {
        id: uuidv4(),
        message,
        status: "draft" 
    };

    stories.push(story);

    res.json({
        success: true,
        story
    });
});


app.post('/story/:id/next', (req, res) => {
    const { id } = req.params;

    const story = stories.find(s => s.id === id);
    if (!story) {
        return res.status(404).json({ success: false, error: "Story not found" });
    }

    if (story.status === "draft") {
        story.status = "online";
        return res.json({
            success: true,
            story,
            message: "Story is now online"
        });
    } else if (story.status === "online") {
        story.status = "completed";
        return res.json({
            success: true,
            story,
            message: "Story storage completed"
        });
    } else {
        return res.json({
            success: false,
            story,
            message: "Story already completed"
        });
    }
});


app.get('/story/:id', (req, res) => {
    const { id } = req.params;
    const story = stories.find(s => s.id === id);

    if (!story) {
        return res.status(404).json({ success: false, error: "Story not found" });
    }

    res.json({ success: true, story });
});

app.get('/stories', (req, res) => {
    res.json({ success: true, stories });
});

app.listen(PORT, () => {
    console.log(`Story Capsule API running on http://localhost:${PORT}`);
});
