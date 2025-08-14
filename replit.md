# Overview

SaskNet is a comprehensive mobile network diagnostic web application built to track and analyze carrier performance across Saskatchewan's major telecommunications providers - SaskTel, Bell, Telus, and Rogers. The application provides real-time speed testing capabilities, network performance monitoring, interactive cell tower mapping, and historical data analysis to help users understand and optimize their mobile network connectivity.

The system is designed as a full-stack web application with a React-based frontend optimized for mobile devices and an Express.js backend, featuring 8 major diagnostic and analysis features for comprehensive network monitoring.

## Recent Changes (January 2025)
- Implemented **Coverage Heatmap** feature for visualizing network signal strength across regions
- Added **Carrier Comparison Dashboard** with side-by-side analysis of all 4 carriers
- Created **Automated Testing Schedule** system for hourly, daily, and weekly tests
- Built **Crowd-Sourced Outage Map** for community-reported network issues
- Developed **Data Usage Optimizer** with app-level consumption tracking
- Integrated **Network Troubleshooting Assistant** across all features
- Added **Export & Share Reports** functionality via API endpoints
- Enhanced storage layer with support for all new data models
- **Fixed deployment configuration** for Cloud Run deployment with proper build scripts and production server setup
- **Updated deployment configuration** with production-ready TypeScript settings and verified build process (August 2025)
- **Migrated to PostgreSQL database** from in-memory storage for data persistence (January 2025)
- **Fixed authentication configuration** with proper database-backed session storage
- **Resolved all type issues** in storage implementation for production deployment

## Bug Fixes (August 14, 2025)
- **TypeScript Type Error**: Fixed null/undefined type mismatch in schedule.tsx Switch component (line 140) - checked prop now uses nullish coalescing
- **Missing API Endpoints**: Added missing /api/ping (HEAD) and /api/speed-test/upload (POST) endpoints required by speed test functionality
- **Error Handling**: Improved error logging in speed-test.ts functions with descriptive console.error messages
- **API Route Fix**: Corrected ping endpoint path from '/ping-test' to '/api/ping' for consistency

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side application is built using **React 18** with **TypeScript** and follows a component-based architecture. The UI framework leverages **shadcn/ui** components built on top of **Radix UI primitives** and styled with **TailwindCSS**. The application uses **Wouter** for lightweight client-side routing and is optimized for mobile-first responsive design.

**State Management**: **TanStack Query (React Query)** handles server state management, data fetching, and caching. This provides automatic background updates, optimistic updates, and efficient data synchronization between client and server.

**Geospatial Features**: The application integrates **Leaflet.js** for interactive mapping functionality, allowing users to visualize cell tower locations and network coverage areas across Saskatchewan.

## Backend Architecture
The server is built with **Express.js** using **TypeScript** and follows a RESTful API design pattern. The application uses a layered architecture with clear separation between routes, storage logic, and utilities.

**API Design**: RESTful endpoints handle comprehensive network diagnostics including:
- Speed test data collection and analysis
- Network information and signal strength tracking
- Cell tower location and coverage management
- User authentication and session management
- Carrier comparison with performance metrics
- Coverage heatmap data aggregation
- Outage reporting and tracking
- Automated test scheduling
- Data usage monitoring and optimization
- Report generation and export

The API supports filtering by carrier, location-based queries, time-range filtering, provides pagination for large datasets, and includes protected routes requiring authentication.

**Storage Layer**: The application implements an abstraction layer (`IStorage` interface) using **PostgreSQL database storage** (`DatabaseStorage`) for persistent data storage across all operations. The database is managed through **Drizzle ORM** for type-safe database interactions. User authentication data and all application data are stored persistently in the PostgreSQL database, ensuring data survives application restarts.

## Data Models and Schema
The application uses **Drizzle ORM** with **Zod** for type-safe database interactions and validation. Eleven comprehensive data models are defined:

- **Users**: Stores user profiles from Replit Auth including email, names, and profile images
- **Sessions**: Manages authentication sessions with expiration and security features
- **Speed Tests**: Records download/upload speeds, ping, jitter, carrier information, and geolocation data
- **Network Info**: Tracks real-time network connection details including signal strength and cell tower information  
- **Cell Towers**: Maintains a database of cell tower locations with carrier-specific coverage information
- **Coverage Points**: Stores signal strength measurements for coverage heatmap visualization
- **Network Issues**: Tracks user-reported network problems and service disruptions
- **Network Predictions**: AI-based predictions for network performance and potential issues
- **Scheduled Tests**: Manages automated testing schedules and execution times
- **Data Usage**: Monitors data consumption by app and connection type
- **Test Reports**: Stores exportable test results and analysis reports

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

# Deployment Configuration

## Cloud Run Deployment Setup
The application is configured for deployment on Replit's Cloud Run platform with the following configuration:

**Production Build Process**:
- `npm run build`: Builds both frontend (Vite) and backend (ESBuild) for production
- Frontend assets are built to `dist/public/` directory
- Backend server is bundled to `dist/index.js`
- Production start command: `npm run start` (runs `NODE_ENV=production node dist/index.js`)

**Required Deployment Configuration**:
The `.replit` file must include the following deployment section (configured through Replit interface):
```toml
[deployment]
run = ["npm", "run", "start"]
deploymentTarget = "cloudrun"
```

**Production Server Configuration**:
- Server listens on `0.0.0.0:5000` (required for Cloud Run)
- Port configured via `PORT` environment variable (defaults to 5000)
- In production mode, serves static files from `dist/public/`
- Includes proper error handling and graceful shutdown

**Database Configuration**:
- Uses PostgreSQL database via `DATABASE_URL` environment variable
- Database connection configured for production environment
- Session storage persisted to database for scalability

**Build Verification**:
All deployment requirements have been tested and verified:
- ✅ Production build script creates correct directory structure
- ✅ Start script successfully runs production server
- ✅ TypeScript configuration optimized for production builds
- ✅ Static file serving configured for built assets
- ✅ Database connections work in production mode
- ✅ Created deployment script (`deploy-build.sh`) for complete production builds

**Deployment Instructions**:

1. **Manual Configuration Required**: Add the following to `.replit` file via Replit interface:
   ```toml
   [deployment]
   run = ["npm", "run", "start"]
   deploymentTarget = "cloudrun"
   ```

2. **Build for Production**: Run the deployment build script:
   ```bash
   ./deploy-build.sh
   ```
   This script:
   - Builds frontend assets to `dist/public/`
   - Bundles backend server to `dist/index.js`
   - Copies static files to `server/public/` for correct serving
   - Optimizes build for production deployment

3. **Deploy**: Use Replit's deploy button to initiate Cloud Run deployment

**Recent Updates** (August 11, 2025):
- ✅ Fixed TypeScript configuration for production builds
- ✅ Verified build process creates all required files
- ✅ Created deployment script to handle static file copying
- ✅ Documented complete deployment process
- ❓ User must add deployment section to `.replit` file manually