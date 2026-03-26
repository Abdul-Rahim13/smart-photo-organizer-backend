const jwt = require('jsonwebtoken')

exports.authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "")
    if(!token){
        return res.status(401).json({
            message: "Access Denied. No Token Provided"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded              // This allows other routes to know which user is making the request.
        next()
    } catch (error) {
        res.status(400).json({
            message: "Invalid Token"
        })
        console.log(error)
    }
}