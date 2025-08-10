# Overview

SaskNet is a comprehensive mobile network diagnostic web application built to track and analyze carrier performance across Saskatchewan's major telecommunications providers - SaskTel, Bell, Telus, and Rogers. The application provides real-time speed testing capabilities, network performance monitoring, interactive cell tower mapping, and historical data analysis to help users understand and optimize their mobile network connectivity.

The system is designed as a full-stack web application with a React-based frontend optimized for mobile devices and an Express.js backend, focusing on network diagnostics and geospatial data visualization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built using **React 18** with **TypeScript** and follows a component-based architecture. The UI framework leverages **shadcn/ui** components built on top of **Radix UI primitives** and styled with **TailwindCSS**. The application uses **Wouter** for lightweight client-side routing and is optimized for mobile-first responsive design.

**State Management**: **TanStack Query (React Query)** handles server state management, data fetching, and caching. This provides automatic background updates, optimistic updates, and efficient data synchronization between client and server.

**Geospatial Features**: The application integrates **Leaflet.js** for interactive mapping functionality, allowing users to visualize cell tower locations and network coverage areas across Saskatchewan.

## Backend Architecture
The server is built with **Express.js** using **TypeScript** and follows a RESTful API design pattern. The application uses a layered architecture with clear separation between routes, storage logic, and utilities.

**API Design**: RESTful endpoints handle speed test data collection, network information tracking, cell tower management, and user authentication. The API supports filtering by carrier, provides pagination for large datasets, and includes protected routes requiring authentication.

**Storage Layer**: The application implements an abstraction layer (`IStorage` interface) that currently uses an in-memory storage implementation (`MemStorage`) for development and testing. This design allows for easy migration to persistent database storage without changing the business logic. User authentication data flows through the same interface for consistency.

## Data Models and Schema
The application uses **Drizzle ORM** with **Zod** for type-safe database interactions and validation. Five main data models are defined:

- **Users**: Stores user profiles from Replit Auth including email, names, and profile images
- **Sessions**: Manages authentication sessions with expiration and security features
- **Speed Tests**: Records download/upload speeds, ping, jitter, carrier information, and geolocation data
- **Network Info**: Tracks real-time network connection details including signal strength and cell tower information  
- **Cell Towers**: Maintains a database of cell tower locations with carrier-specific coverage information

**Database Configuration**: Configured for **PostgreSQL** using **Neon Database** serverless infrastructure, with automatic UUID generation and timestamp tracking.

## Development and Build System
The project uses **Vite** as the build tool and development server, providing fast hot module replacement and optimized production builds. **ESBuild** handles server-side bundling for production deployments.

**TypeScript Configuration**: Strict type checking is enabled across the entire codebase with path mapping for clean imports. The build system supports both client and server TypeScript compilation.

## Authentication and Session Management
The application uses **Replit Auth** with **OpenID Connect** for user authentication. Users are redirected to Replit's authentication service and returned to the application with their profile information. The system includes:

- **User Management**: PostgreSQL-based user storage with automatic profile updates
- **Session Storage**: PostgreSQL session storage using **connect-pg-simple** for persistent login sessions
- **Route Protection**: Authentication middleware protecting API endpoints and user-specific data
- **Frontend Integration**: React hooks for authentication state management and protected routing

**Authentication Flow**: Unauthenticated users see a landing page with login prompts. After successful authentication through Replit, users access the full dashboard with personalized features and logout options.

# External Dependencies

## Database and ORM
- **Neon Database**: Serverless PostgreSQL database platform for production data storage
- **Drizzle ORM**: Type-safe database toolkit with automatic migrations
- **Drizzle Kit**: Database migration and schema management tools

## UI and Styling
- **shadcn/ui**: Modern React component library built on Radix UI primitives
- **Radix UI**: Low-level UI primitives for accessibility and customization
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent visual elements

## Data and State Management
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition

## Mapping and Geospatial
- **Leaflet.js**: Open-source mapping library for interactive maps
- **Browser Geolocation API**: Native location services for positioning

## Development Tools
- **Replit Integration**: Development environment optimizations and error handling
- **Vite Plugins**: Runtime error overlays and development tooling
- **PostCSS**: CSS processing with Autoprefixer for browser compatibility

## Networking and Performance
- **Native Fetch API**: HTTP client for API requests and speed testing
- **Performance API**: Browser timing APIs for network performance measurement
- **Navigator API**: Network information detection and carrier identification

The application is designed to be self-contained with minimal external service dependencies, focusing on client-side network diagnostics and browser-based geolocation services.