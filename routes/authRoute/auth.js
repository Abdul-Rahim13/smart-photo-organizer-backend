const express = require('express')
const router = express.Router()
const {register, login, forgotPassword } = require ('../../controller/authController/auth')


router.post('/register', register)
router.post('/login', login)
router.post('/forget-password', forgotPassword )

module.exports = router