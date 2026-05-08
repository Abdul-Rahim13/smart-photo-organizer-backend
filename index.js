require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const PORT = process.env.PORT || 3000
const connectDB = require('./config/db')
const authRoute = require('./routes/authRoute/auth')
const photoRoute = require('./routes/photoRoute/photo')
const albumRoute = require('./routes/albumRoute/album')


connectDB()
app.use('/uploads', express.static('uploads'))
app.use(morgan('dev'))                  // middleware for Express that logs every HTTP request coming to your server
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: true,         // frontend URL
  credentials: true,                        // allow cookies if needed
}))

// Auth Routes
app.use('/api/auth', authRoute)

// Photo Routes
app.use('/api/photos', photoRoute)

// Album Routes
app.use('/api/album', albumRoute)


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Only for testing backend deployment
app.get("/", (req, res) => {
  res.send("FYP Backend is running successfully!");
});