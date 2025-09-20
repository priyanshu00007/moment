const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

// JWT Authentication middleware [7][10]
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        const user = await User.findOne({ userId: decoded.userId });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Add user to request object
        req.user = {
            userId: user.userId,
            email: user.email,
            name: user.name
        };

        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ userId: decoded.userId });
            
            if (user) {
                req.user = {
                    userId: user.userId,
                    email: user.email,
                    name: user.name
                };
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional routes
        next();
    }
};

// Role-based authorization middleware [18]
const authorize = (roles = []) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const user = await User.findOne({ userId: req.user.userId });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.'
                });
            }

            // Check if user has required role
            if (roles.length && !roles.includes(user.account.plan)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions.'
                });
            }

            next();
        } catch (error) {
            logger.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed.'
            });
        }
    };
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize
};
