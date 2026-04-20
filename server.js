const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 image data
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for potholes and users
let potholes = [];
let users = {};
let nextId = 1;

// GET all potholes
app.get('/api/potholes', (req, res) => {
    res.json(potholes);
});

// GET leaderboard
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = Object.entries(users).map(([username, data]) => ({
        username,
        points: data.points,
        badge: data.badge,
        reports: data.reports
    })).sort((a, b) => b.points - a.points);
    res.json(leaderboard);
});

// POST a new pothole
app.post('/api/potholes', (req, res) => {
    const { lat, lng, image, severity, username, issueType, riskLevel, cleanliness } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    let earnedPoints = 0;
    let newBadge = 'Scout';

    if (username) {
        if (!users[username]) {
            users[username] = { points: 0, badge: 'Scout', reports: 0 };
        }
        users[username].points += 10;
        users[username].reports += 1;
        
        const pts = users[username].points;
        if (pts >= 100) newBadge = 'City Protector';
        else if (pts >= 50) newBadge = 'Road Hero';
        
        users[username].badge = newBadge;
        earnedPoints = 10;
    }

    const newPothole = {
        id: nextId++,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        image: image || null,
        severity: severity || 'Moderate',
        issueType: issueType || 'Pothole',
        riskLevel: riskLevel || 'Moderate',
        cleanliness: cleanliness || 'Unknown',
        status: 'Pending',
        reportedBy: username || 'Anonymous',
        reportedAt: new Date().toISOString()
    };

    potholes.push(newPothole);
    res.status(201).json({ pothole: newPothole, earnedPoints, badge: newBadge });
});

// PATCH pothole status (for authorities)
app.patch('/api/potholes/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const pothole = potholes.find(p => p.id === parseInt(id));

    if (!pothole) {
        return res.status(404).json({ error: 'Pothole not found.' });
    }

    if (status) {
        pothole.status = status;
    }

    res.json(pothole);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
