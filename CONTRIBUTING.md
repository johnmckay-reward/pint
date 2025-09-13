# Contributing to Pint

Thank you for your interest in contributing to Pint! This document provides guidelines for contributing to the project.

## Development Setup

1. Clone the repository
2. Install dependencies for all applications:
   - Frontend (`app/`): `cd app && npm install`
   - Backend (`api/`): `cd api && npm install`
   - Partner Dashboard (`pint-dashboard/`): `cd pint-dashboard && npm install`
   - Admin Dashboard (`admin-dashboard/`): `cd admin-dashboard && npm install`
3. Set up PostgreSQL database with PostGIS extension
4. Configure environment variables
5. Start all development servers

Detailed setup instructions are in the [README.md](./README.md).

## Code Style

### Frontend (Angular/Ionic)
- Use TypeScript strict mode
- Follow Angular Style Guide conventions
- Use Ionic components and design patterns
- Implement proper error handling
- Write unit tests for components and services

### Backend (Node.js/Express)
- Use consistent naming conventions
- Implement proper error handling
- Write clean, readable code
- Use Sequelize ORM for database operations
- Follow RESTful API conventions

## Development Workflow

1. Create a feature branch from `main`
2. Make changes following project conventions
3. Test your changes locally across all relevant applications
4. Run linting and tests
5. Create a pull request with clear description
6. **Important**: Specify which application(s) your pull request pertains to in the title:
   - `[User App] Fix login bug`
   - `[Partner] Add new analytics feature`
   - `[Admin] Implement user management`
   - `[API] Add new endpoints`
   - `[Website] Update landing page`

## Testing

- Frontend (`app/`): `cd app && npm test`
- Partner Dashboard (`pint-dashboard/`): `cd pint-dashboard && npm test`
- Admin Dashboard (`admin-dashboard/`): `cd admin-dashboard && npm test`
- Backend: Tests to be implemented
- Ensure all existing tests pass across all applications

## Code Review

- All changes require code review
- Follow the project's coding standards
- Include tests for new functionality
- Update documentation as needed

## Database Changes

- Use Sequelize migrations for schema changes
- Test migrations both up and down
- Document any breaking changes

## Questions?

- Check the [Copilot Instructions](./.github/copilot-instructions.md) for detailed technical guidelines
- Create an issue for questions or discussions