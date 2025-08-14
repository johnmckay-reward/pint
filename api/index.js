const express = require('express');
const sequelize = require('./db');
const User = require('./models/user'); // Import the User model

const app = express();
const PORT = process.env.PORT || 3000;

async function assertDatabaseConnectionOk() {
  console.log('Checking database connection...');
  try {
    await sequelize.authenticate();
    console.log('Database connection OK! ✅');
  } catch (error) {
    console.log('Unable to connect to the database:');
    console.error(error.message);
    process.exit(1);
  }
}

async function init() {
  await assertDatabaseConnectionOk();
  
  // Sync all defined models to the database.
  // { force: true } will drop the table if it already exists. Be careful with this in production.
  await sequelize.sync(); 
  console.log('All models were synchronized successfully. 🔄');

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Pint? API! 🍻' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init();