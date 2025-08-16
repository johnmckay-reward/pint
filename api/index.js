const express = require('express');
const cors = require('cors');

// Import everything from the models/index.js file
const { sequelize, User, PintSession } = require('./models');
const userRoutes = require('./routes/users');
const pintSessionRoutes = require('./routes/pintSessions');
const authRoutes = require('./routes/auth');


const app = express();

app.use(express.json());
app.use(cors());

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

  // The 'force: true' option will drop tables before recreating them.
  // Useful in development, but use with caution.
  await sequelize.sync({ force: true });
  console.log('All models were synchronized successfully. 🔄');

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/sessions', pintSessionRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Pint? API! 🍻' });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

init();