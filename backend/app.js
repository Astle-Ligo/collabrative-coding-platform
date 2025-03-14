require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const connectDB = require('./config/db');
const path = require('path');


// Initialize App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
// connectDB();

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Test Route
app.get('/', (req, res) => {
    res.send('Collaborative Coding Platform Backend Running!');
});

module.exports = app;
