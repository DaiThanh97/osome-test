# ACME Accounting

A modern accounting and company management system built with NestJS, PostgreSQL, and Redis.

## Overview

ACME Accounting is a comprehensive solution for managing company tickets, users, and generating financial reports. The system handles various accounting and corporate operations through a ticket-based workflow system.

## Features

- **Ticket Management**: Create and track different types of tickets (Management Reports, Registration Address Changes, Strike-Off)
- **User Role Management**: Support for different user roles (Accountant, Corporate Secretary, Director)
- **Company Management**: Track companies and their associated users
- **Report Generation**: Generate financial reports asynchronously with Bull queue processing
- **API Documentation**: Swagger UI for easy API exploration

## Architecture

- **Backend**: NestJS framework with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Job Queue**: Bull with Redis for background processing
- **Testing**: Jest for unit and integration testing

## Data Model

### Core Entities

- **Companies**: Business entities in the system
- **Users**: Users with specific roles within companies
- **Tickets**: Work items assigned to users with specific types and categories

### Ticket Types

- `managementReport`: Accounting category, assigned to Accountants
- `registrationAddressChange`: Corporate category, assigned to Corporate Secretaries or Directors
- `strikeOff`: Management category, assigned to Directors

## API Endpoints

- `GET /tickets`: List all tickets in the system
- `POST /tickets`: Create a new ticket with specified type and company
- `GET /report`: Generate financial reports asynchronously
- `GET /healthcheck`: Check system health

## Performance Optimizations

### Database Indexing Strategy

The following indexes have been implemented to optimize query performance:

#### Ticket Model Indexes

- Single-column indexes:

  - `type`: Improves queries filtering by ticket type
  - `status`: Improves queries filtering by ticket status
  - `companyId`: Improves queries filtering by company
  - `assigneeId`: Improves queries filtering by assignee

- Composite indexes:
  - `(companyId, type, status)`: Optimizes checking for existing tickets of a specific type and status for a company
  - `(companyId, status)`: Optimizes finding all tickets with a specific status for a company

#### User Model Indexes

- Single-column indexes:

  - `role`: Improves filtering users by role
  - `companyId`: Improves filtering users by company

- Composite indexes:
  - `(companyId, role)`: Optimizes finding users with a specific role in a company

### Asynchronous Processing

Reports are processed asynchronously using Bull queues to avoid blocking the main thread and improve response times.

## Getting Started

### Prerequisites

- Node.js (version specified in .nvmrc)
- Docker and Docker Compose
- PostgreSQL
- Redis

### Installation

1. Clone the repository

```sh
git clone https://github.com/DaiThanh97/osome-test.git
cd osome-test
```

2. Install dependencies

```sh
nvm use
npm install
```

3. Start the database and Redis

```sh
docker-compose up -d
```

4. Run migrations

```sh
npm run db:migrate
```

5. Start the server

```sh
npm start
```

6. Access the API at http://localhost:3000/api/v1/healthcheck
7. Access API documentation at http://localhost:3000/api/v1/docs

<img src='./imgs/swagger.png'>

## Testing

The project uses integration tests that run against a test database.

1. Ensure the database container is running

```sh
docker-compose up -d
```

2. Create the test database

```sh
npm run db:create:test
```

3. Run migrations on the test database

```sh
npm run db:migrate:test
```

4. Run the tests

```sh
npm test
```

## Development

### Available Scripts

- `npm run build`: Build the application
- `npm run start:dev`: Start the application in development mode with hot reload
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run migrate`: Run database migrations
- `npm run db:reset`: Reset the database (undo all migrations)

## License

Proprietary - All rights reserved
