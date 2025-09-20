const { connectDB, checkDBHealth, closeDB } = require('./database');

module.exports = {
    connectDB,
    checkDBHealth,
    closeDB
};
