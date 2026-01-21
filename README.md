# Class Operation

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A comprehensive classroom management system built with NestJS and Next.js using Nx monorepo architecture.

## Project Overview

Class Operation is a platform designed to help manage classroom activities, student interactions, and educational resources. The project consists of several main applications:

- **`co`**: NestJS backend API service
- **`web`**: Next.js frontend application
- **`noti`**: Notification service

## Technologies

- **Frontend**: Next.js 15, React 19, Ant Design, Redux Toolkit, TailwindCSS
- **Backend**: NestJS 10, TypeORM, PostgreSQL
- **Utils**: Socket.io for real-time communication, Cloudinary for file storage
- **DevOps**: Docker, GitLab CI/CD
- **Build Tools**: Nx monorepo, Webpack

## Getting Started

### Prerequisites

- Node.js (LTS version)
- Yarn
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```sh
   yarn install
   ```

### Development

Start the backend API server:

```sh
npx nx serve co
```

Start the frontend application:

```sh
npx nx serve web
```

Start the notification service:

```sh
npx nx serve noti
```

### Building for Production

Build the backend API:

```sh
npx nx build co
```

Build the frontend application:

```sh
npx nx build web
```

## Project Structure

The project follows Nx monorepo structure:

- **`apps/`**: Contains the main applications
  - `co/`: NestJS backend API
  - `web/`: Next.js frontend application
  - `noti/`: Notification service
- **`libs/`**: Shared libraries and components
- **`dist/`**: Build outputs

## API Documentation

The API documentation is available at `/api/v1/docs` when the backend server is running.

## Docker Deployment

This project includes Docker configuration for containerized deployment:

```sh
docker-compose up -d
```

## Development Tools

### Nx Commands

List all projects:

```sh
npx nx list
```

Show project details:

```sh
npx nx show project co
```

Run linting:

```sh
npx nx lint co
```

### Code Generation

Generate a new library:

```sh
npx nx g @nx/node:lib my-lib
```

Generate a new component for the web app:

```sh
npx nx g @nx/next:component MyComponent --project=web
```

## License

MIT
