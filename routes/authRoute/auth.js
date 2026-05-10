const express = require('express')
const router = express.Router()
const {register, login, forgotPassword, verifyOtp, resetPassword, googleLogin } = require ('../../controller/authController/auth')


router.post('/register', register)
router.post('/login', login)
router.post('/forget-password', forgotPassword )
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword )
router.post('/google', googleLogin);

module.exports = router