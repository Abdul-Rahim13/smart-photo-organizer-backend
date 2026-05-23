require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');

const PORT = process.env.PORT || 3000;
const connectDB = require('./config/db');

const authRoute = require('./routes/authRoute/auth');
const photoRoute = require('./routes/photoRoute/photo');
const albumRoute = require('./routes/albumRoute/album');

// DB connect
connectDB();

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: true,
    credentials: true
}));

// Routes
app.use('/api/auth', authRoute);
app.use('/api/photos', photoRoute);
app.use('/api/album', albumRoute);

// health check
app.get("/", (req, res) => {
    res.send("FYP Backend is running successfully!");
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});