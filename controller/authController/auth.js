const userModel = require('../../models/User/User')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

