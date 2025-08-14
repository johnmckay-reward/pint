const express = require('express');
const sequelize = require('./db'); // Import the sequelize instance

const app = express();
const PORT = process.env.PORT || 3000;

// --- Add this block to test the database connection ---
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
// ----------------------------------------------------

async function init() {
  await assertDatabaseConnectionOk(); // Run the connection check

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Pint? API! 🍻' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init(); // Run the init function