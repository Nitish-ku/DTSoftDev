
const express = require('express');
const { ObjectId } = require('mongodb');
const multer = require('multer');

const router = express.Router();

// Multer setup for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST /api/v3/app/events - Create an event
router.post('/', upload.single('files[image]'), async (req, res) => {
    try {
        const db = req.db;
        const { name, tagline, schedule, description, moderator, category, sub_category, rigor_rank } = req.body;

        // Basic validation
        if (!name || !tagline || !schedule || !description) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        const newEvent = {
            type: "event",
            uid: null, // Placeholder for user ID
            name,
            tagline,
            schedule: new Date(schedule), // Store schedule as a Date object
            description,
            image: req.file ? req.file.buffer : null, // Store image buffer
            moderator,
            category,
            sub_category,
            rigor_rank: parseInt(rigor_rank, 10),
            attendees: [],
        };

        const result = await db.collection('events').insertOne(newEvent);
        res.status(201).json({ id: result.insertedId });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/v3/app/events - Get event by ID or by latest
router.get('/', async (req, res) => {
    try {
        const db = req.db;
        const { id, type, limit, page } = req.query;

        // Get a single event by its ID
        if (id) {
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid event ID format.' });
            }
            const event = await db.collection('events').findOne({ _id: new ObjectId(id) });
            if (!event) {
                return res.status(404).json({ error: 'Event not found.' });
            }
            return res.status(200).json(event);
        }

        // Get latest events with pagination
        if (type === 'latest') {
            const pageNum = parseInt(page, 10) || 1;
            const limitNum = parseInt(limit, 10) || 5;
            const skip = (pageNum - 1) * limitNum;

            const events = await db.collection('events')
                .find({ type: 'event' })
                .sort({ schedule: -1 }) // Sort by schedule date in descending order
                .skip(skip)
                .limit(limitNum)
                .toArray();
            
            const totalEvents = await db.collection('events').countDocuments({ type: 'event' });

            return res.status(200).json({
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalEvents / limitNum),
                totalEvents,
                events
            });
        }

        return res.status(400).json({ error: 'Invalid query. Use ?id= or ?type=latest.' });

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/v3/app/events/:id - Update an event
router.put('/:id', upload.single('files[image]'), async (req, res) => {
    try {
        const db = req.db;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid event ID format.' });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = req.file.buffer;
        }
        // Ensure correct types for fields that need it
        if (updateData.schedule) updateData.schedule = new Date(updateData.schedule);
        if (updateData.rigor_rank) updateData.rigor_rank = parseInt(updateData.rigor_rank, 10);


        const result = await db.collection('events').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        res.status(200).json({ message: 'Event updated successfully.' });

    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/v3/app/events/:id - Delete an event
router.delete('/:id', async (req, res) => {
    try {
        const db = req.db;
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid event ID format.' });
        }

        const result = await db.collection('events').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        res.status(200).json({ message: 'Event deleted successfully.' });

    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
