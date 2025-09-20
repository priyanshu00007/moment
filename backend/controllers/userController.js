const userService = require('../services/userService');
const logger = require('../utils/logger');

// Create new user [5]
const createUser = async (req, res) => {
    try {
        const userData = req.body;
        const user = await userService.createUser(userData);
        
        logger.info(`New user created: ${user.email}`);
        
        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully'
        });
    } catch (error) {
        logger.error('Error creating user:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await userService.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user,
            message: 'User profile retrieved successfully'
        });
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;
        const updateData = req.body;
        
        const updatedUser = await userService.updateUser(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        logger.info(`User profile updated: ${userId}`);
        
        res.json({
            success: true,
            data: updatedUser,
            message: 'User profile updated successfully'
        });
    } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Complete onboarding
const completeOnboarding = async (req, res) => {
    try {
        const { userId } = req.user;
        const onboardingData = req.body;
        
        const user = await userService.completeOnboarding(userId, onboardingData);
        
        logger.info(`Onboarding completed for user: ${userId}`);
        
        res.json({
            success: true,
            data: user,
            message: 'Onboarding completed successfully'
        });
    } catch (error) {
        logger.error('Error completing onboarding:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.user;
        const stats = await userService.getDashboardStats(userId);
        
        res.json({
            success: true,
            data: stats,
            message: 'Dashboard stats retrieved successfully'
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createUser,
    getUserProfile,
    updateUserProfile,
    completeOnboarding,
    getDashboardStats
};
