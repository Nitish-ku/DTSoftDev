
const express = require('express');
const eventRoutes = require('./routes/events');
const { connectDB, getDB, client } = require('./db');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make db accessible to our router
app.use((req, res, next) => {
    req.db = getDB();
    next();
});

// --- Routes ---
app.use('/api/v3/app/events', eventRoutes);

app.get('/', (req, res) => {
    res.send('Event API is running. Use the /api/v3/app/events endpoint.');
});

async function startServer() {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

startServer();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    await client.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
});
