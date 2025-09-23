// models/Goal.js
const mongoose = require('mongoose');
const GoalSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: String,
  total: Number,
  subs: [{ name: String, done: Boolean }],
  complete: Number
});
module.exports = mongoose.model('Goal', GoalSchema);
