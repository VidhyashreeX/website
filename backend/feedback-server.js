const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Define the feedback file path
const FEEDBACK_FILE = path.join(__dirname, 'feedback.json');

app.use(cors());
app.use(express.json());

// Initialize feedback file if it doesn't exist
async function initializeFeedbackFile() {
    try {
        await fs.access(FEEDBACK_FILE);
    } catch (error) {
        await fs.writeFile(FEEDBACK_FILE, JSON.stringify({ feedback: [], nextId: 1 }, null, 2));
    }
}

// Load feedback data
async function loadFeedback() {
    const data = await fs.readFile(FEEDBACK_FILE, 'utf8');
    return JSON.parse(data);
}

// Save feedback data
async function saveFeedback(data) {
    await fs.writeFile(FEEDBACK_FILE, JSON.stringify(data, null, 2));
}

// Get feedback count
async function getFeedbackCount() {
    const data = await loadFeedback();
    return data.feedback.length;
}

// Endpoint to submit feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Format the feedback data
        const feedbackData = {
            id: Date.now(), // Use timestamp as ID
            name: name,
            email: email,
            message: message,
            timestamp: new Date().toISOString()
        };

        // Load existing feedback
        const data = await loadFeedback();
        
        // Add new feedback
        data.feedback.push(feedbackData);
        data.nextId++;
        
        // Save updated feedback
        await saveFeedback(data);

        res.status(200).json({
            success: true,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting feedback: ' + error.message
        });
    }
});

// Endpoint to get feedback count
app.get('/api/feedback-count', async (req, res) => {
    try {
        const count = await getFeedbackCount();
        res.status(200).json({
            count: count
        });
    } catch (error) {
        console.error('Error getting feedback count:', error);
        res.status(500).json({
            error: 'Failed to get feedback count: ' + error.message
        });
    }
});

// Initialize feedback file when server starts
app.listen(port, async () => {
    await initializeFeedbackFile();
    console.log(`Feedback server running at http://localhost:${port}`);
});

app.listen(port, () => {
    console.log(`Feedback server running at http://localhost:${port}`);
});
