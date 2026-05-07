const userModel = require('../../models/User/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../../utils/sendMail');

exports.register = async (req, res) => {
    try {
        const {name, email, role, password} = req.body

        if (!name || !email || !password)

            return res.status(400).json({ 
            success: false, 
            message: "Name, email, password required" 
        })

        const exsistingUser = await userModel.findOne({email})
        if(exsistingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "User Already exsist"
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        await userModel.create({
            name,
            email,
            role,
            password: hashPassword,
        })

        return res.status(201).json({ 
            success: true, 
            message: "User created successfully" 
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Signup failed", 
            error: error.message 
        });
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body
        if (!email || !password) 
            return res.status(400).json({ 
            success: false, 
            message: "Email and password required" 
        });

        const userInfo = await userModel.findOne({ email}).select("+password")
        if (!userInfo) 
            return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials" 
        })

        const isMatch = await bcrypt.compare(password, userInfo.password)
        if (!isMatch) 
            return res.status(401).json({ 
            success: false, 
            message: "Invalid credentials" 
        });

        const token = jwt.sign({
            id: userInfo._id,
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role,
        }, process.env.JWT_SECRET, {expiresIn:'1d'})

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            data: { 
                id: userInfo._id,
                name: userInfo.name,
                email: userInfo.email,
                role: userInfo.role
            }
        });


    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Login failed", error: error.message 
        });
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const {email} = req.body;

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        //saves OTP to DB
        user.resetOtp = otp;

        //expires in 10 min
        user.resetOtpExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendMail(email, "Password Reset OTP: ", `Your OTP is ${otp}`);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to send OTP",
            error: error.message,
        });
    }
}

exports.verifyOtp = async (req, res) => {
    try {
        const {email, otp} = req.body;

        if(!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP required",
            });
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        if (user.resetOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (user.resetOtpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "OTP verification failed",
            error: error.message,
        });
    }
}

exports.resetPassword = async (req, res) => {

    try {

        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        if (user.resetOtpExpire < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;

        user.resetOtp = undefined;
        user.resetOtpExpire = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Password reset failed",
            error: error.message,
        });

    }
};

