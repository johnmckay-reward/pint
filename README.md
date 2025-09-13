# Pint 🍻

A social drinking application that connects people through pub meetups. Create and join location-based drinking sessions, find nearby pubs, and connect with fellow pub-goers.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL with PostGIS extension
- Angular CLI

### Setup

1. **Install dependencies:**
   ```bash
   # Frontend
   cd app && npm install
   
   # Backend
   cd ../api && npm install
   ```

2. **Database setup:**
   - Create PostgreSQL database with PostGIS extension
   - Configure environment variables for database connection

3. **Run the application:**
   ```bash
   # Start backend (terminal 1)
   cd api && node index.js
   
   # Start frontend (terminal 2)
   cd app && npm start
   ```

## Project Structure

- `app/` - Angular/Ionic frontend application
- `api/` - Node.js/Express backend API

## Tech Stack

- **Frontend**: Angular 20, Ionic 8, TypeScript
- **Backend**: Node.js, Express, JavaScript
- **Database**: PostgreSQL with Sequelize ORM
- **Mobile**: Capacitor for native app deployment

## Development

See [Copilot Instructions](./.github/copilot-instructions.md) for detailed development guidelines and project conventions.

## Features

- User authentication and profiles
- Location-based pub session discovery
- Create and join drinking meetups
- Real-time session management
- Mobile-responsive design

## License

Private project - All rights reserved.