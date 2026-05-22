const jwt = require('jsonwebtoken');

exports.authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Denied. No Token Provided"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid Token"
        });
    }
};

// Also export as protect for compatibility
exports.protect = exports.authMiddleware;