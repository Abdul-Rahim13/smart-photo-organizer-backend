const express = require('express')
const router = express.Router()
const {register, login, forgotPassword, verifyOtp, resetPassword } = require ('../../controller/authController/auth')


router.post('/register', register)
router.post('/login', login)
router.post('/forget-password', forgotPassword )
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword )

module.exports = router