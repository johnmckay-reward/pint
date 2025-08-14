// Import the Sequelize library
const { Sequelize } = require('sequelize');

// Load environment variables from a .env file
require('dotenv').config();

// Create a new Sequelize instance and connect to the database.
// The connection string is pulled from your environment variables.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Set to true to see SQL queries in the console
});

// Export the sequelize instance to be used in other parts of the application
module.exports = sequelize;