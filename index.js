require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const PORT = process.env.PORT || 3000
const connectDB = require('./config/db')

connectDB()
app.use(morgan('dev'))                  // middleware for Express that logs every HTTP request coming to your server
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors({
    origin: 'http://localhost:3000',         // frontend URL
  credentials: true,                        // allow cookies if needed
}))

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});