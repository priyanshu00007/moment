const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            logger.warn('Validation error:', error.details);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }
        
        req.body = value; // Use validated data
        next();
    };
};

// Validation schemas
const schemas = {
    // User validation schemas
    createUser: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        userId: Joi.string().required(),
        onboarding: Joi.object({
            designation: Joi.string().required(),
            source: Joi.string().valid('student', 'professional', 'freelancer', 'entrepreneur').required(),
            reasonForUsing: Joi.string().required(),
            dailyRoutine: Joi.string().valid('early-bird', 'regular', 'night-owl'),
            productivityStyle: Joi.string().valid('focused-sprints', 'steady-pace', 'flexible')
        })
    }),

    updateUser: Joi.object({
        name: Joi.string().min(2).max(50),
        avatar: Joi.string().uri(),
        preferences: Joi.object({
            theme: Joi.string().valid('black-yellow', 'dark', 'light', 'blue-accent'),
            language: Joi.string(),
            timezone: Joi.string(),
            pomodoro: Joi.object({
                workDuration: Joi.number().min(1).max(60),
                shortBreak: Joi.number().min(1).max(30),
                longBreak: Joi.number().min(1).max(60)
            })
        })
    }),

    // Task validation schemas
    createTask: Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(1000),
        category: Joi.string().valid('work', 'study', 'personal').required(),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
        dueDate: Joi.date().greater('now'),
        estimatedTime: Joi.number().min(1),
        tags: Joi.array().items(Joi.string().max(30))
    }),

    updateTask: Joi.object({
        title: Joi.string().min(1).max(200),
        description: Joi.string().max(1000),
        category: Joi.string().valid('work', 'study', 'personal'),
        priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
        status: Joi.string().valid('pending', 'in-progress', 'completed', 'cancelled'),
        dueDate: Joi.date(),
        estimatedTime: Joi.number().min(1),
        actualTime: Joi.number().min(0),
        tags: Joi.array().items(Joi.string().max(30))
    }),

    // Pomodoro validation schemas
    createPomodoroSession: Joi.object({
        taskId: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
        sessionType: Joi.string().valid('work', 'short-break', 'long-break').required(),
        plannedDuration: Joi.number().min(1).max(120).required(),
        notes: Joi.string().max(500)
    }),

    completePomodoroSession: Joi.object({
        actualDuration: Joi.number().min(1).required(),
        productivity: Joi.number().min(1).max(10),
        notes: Joi.string().max(500)
    })
};

module.exports = {
    validate,
    schemas
};
