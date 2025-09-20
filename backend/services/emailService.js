const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
        text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`);
      return result;
    } catch (error) {
      logger.error('Email service: Error sending email:', error);
      throw error;
    }
  }

  async sendDailySummary(userEmail, userName, stats) {
    const subject = 'Your Daily Productivity Summary';
    const html = `
      <h2>Daily Summary for ${userName}</h2>
      <p>Here's how you did today:</p>
      <ul>
        <li>Tasks Completed: ${stats.tasksCompleted}</li>
        <li>Focus Time: ${stats.focusTime} minutes</li>
        <li>Current Streak: ${stats.currentStreak} days</li>
      </ul>
      <p>Keep up the great work!</p>
    `;
    
    return this.sendEmail(userEmail, subject, html);
  }

  async sendWeeklyReport(userEmail, userName, stats) {
    const subject = 'Your Weekly Productivity Report';
    const html = `
      <h2>Weekly Report for ${userName}</h2>
      <p>Here's your week in review:</p>
      <ul>
        <li>Tasks Completed: ${stats.weeklyTasksCompleted}</li>
        <li>Total Focus Time: ${stats.weeklyFocusTime} minutes</li>
        <li>Pomodoro Sessions: ${stats.weeklyPomodoroSessions}</li>
      </ul>
      <p>Excellent progress this week!</p>
    `;
    
    return this.sendEmail(userEmail, subject, html);
  }
}

module.exports = new EmailService();
