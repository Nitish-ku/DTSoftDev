const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;
const client = new MongoClient(mongoURI);

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db();
        console.log('Successfully connected to MongoDB.');
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}

module.exports = { connectDB, getDB, client };
