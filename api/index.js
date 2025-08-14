// Import the Express library
const express = require('express');

// Create an instance of an Express application
const app = express();

// Define the port the server will run on.
// It's good practice to use an environment variable for the port, with a fallback.
const PORT = process.env.PORT || 3000;

// Define a simple route for the root URL ('/')
// When a GET request is made to the root, it will respond with a JSON message.
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Pint? API! 🍻' });
});

// Start the server and make it listen for incoming connections on the specified port.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});