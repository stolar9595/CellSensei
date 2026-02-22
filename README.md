# SaskNet - Network Diagnostics

A modern full-stack web application for comprehensive mobile network diagnostics and carrier performance tracking across Saskatchewan. Monitor, test, and analyze cellular network quality in real-time.

## 📋 Overview

SaskNet (CellSensei) is a powerful network diagnostic web application designed to help users track and analyze cellular network performance across major carriers in Saskatchewan (SaskTel, Bell, Telus, Rogers). The platform combines interactive mapping, real-time speed testing, and historical data analysis to provide deep insights into network coverage and performance.

**Key Purpose:** Track carrier performance, measure network speed, report outages, and analyze data usage patterns across Saskatchewan's major telecommunications providers.

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend:** Express.js + TypeScript + Drizzle ORM
- **Database:** PostgreSQL (Neon serverless)
- **API:** Anthropic Claude API for intelligent analysis
- **Storage:** Google Cloud Storage & Replit Object Storage
- **Auth:** Replit OpenID Connect (OIDC)
- **UI Components:** Radix UI, Leaflet.js for mapping

## ✨ Key Features

- **🗺️ Interactive Cell Tower Map** - Visualize cell towers from major carriers (SaskTel, Bell, Telus, Rogers) with real-time coverage data
- **⚡ Speed Testing** - Run comprehensive network speed tests measuring download/upload speeds, latency, and jitter
- **📊 Performance History** - Track historical speed test results with filtering by carrier and time range
- **📱 Carrier Comparison** - Compare network performance across different carriers side-by-side
- **🚨 Outage Reporting** - Report network issues and outages with location-based tracking
- **📈 Data Usage Analytics** - Monitor data consumption by application and track usage trends
- **📅 Scheduled Tests** - Set up automatic speed tests at specified intervals
- **🔐 User Authentication** - Secure login via Replit with personal test history storage

## 📁 Project Structure

```
CellSensei/
├── client/                    # React frontend application
│   ├── src/
│   │   ├── pages/            # Main pages (speed-test, tower-map, history, etc.)
│   │   ├── components/       # UI components & bottom navigation
│   │   ├── hooks/            # React hooks (useAuth, etc.)
│   │   └── lib/              # Utilities, API client, geolocation
│   └── index.html            # HTML entry point (SaskNet title)
├── server/                    # Express backend
│   ├── index.ts              # Main server entry point
│   ├── routes.ts             # API route definitions
│   ├── storage.ts            # Database storage layer
│   ├── db.ts                 # Drizzle ORM database setup
│   ├── replitAuth.ts         # Replit OIDC authentication
│   └── vite.ts               # Vite dev server setup
├── shared/                    # Shared types & schemas
│   └── schema.ts             # Zod schemas for validation
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite build configuration
└── drizzle.config.ts         # Database migration config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Neon recommended for serverless)
- Replit account (for deployment)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stolar9595/CellSensei.git
   cd CellSensei
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.production.example .env.local
   ```

   Required environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host/database
   NODE_ENV=development
   SESSION_SECRET=your-secret-key
   REPLIT_DOMAINS=your-replit-domain.replit.dev
   ISSUER_URL=https://replit.com/oidc
   REPL_ID=your-replit-id
   ```

4. **Initialize the database:**
   ```bash
   npm run db:push
   ```

### Development

Start the development server with hot-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` with the API server running alongside.

### Type Checking

Verify TypeScript types:
```bash
npm run check
```

## 📦 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production (client + server) |
| `npm run start` | Run production build |
| `npm run check` | Run TypeScript type checker |
| `npm run db:push` | Push database schema changes |

## 🗄️ API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `GET /api/auth/user` - Get current authenticated user
- `GET /api/login` - Initiate Replit authentication
- `GET /api/callback` - OAuth callback endpoint

### Speed Tests
- `POST /api/speed-tests` - Create a new speed test
- `GET /api/speed-tests` - Get all speed tests
- `GET /api/speed-tests/carrier/:carrier` - Get tests by carrier

### Cell Towers
- `GET /api/cell-towers` - Get all cell towers
- `GET /api/cell-towers/nearby` - Get towers by proximity
- `GET /api/cell-towers/carrier/:carrier` - Get towers by carrier

### Outage Reports
- `POST /api/outage-reports` - Report an outage
- `GET /api/outage-reports` - Get all outage reports
- `PUT /api/outage-reports/:id` - Update outage status

### Data Usage
- `POST /api/data-usage` - Log data usage
- `GET /api/data-usage` - Get user's data usage history

## 📱 Pages & Features

| Page | Description |
|------|-------------|
| **Landing** | Authentication page for new users |
| **Home** | Dashboard with quick stats and network overview |
| **Speed Test** | Run speed tests and measure network performance |
| **Tower Map** | Interactive map showing cell tower locations |
| **History** | View past speed tests with filters and statistics |
| **Comparison** | Compare performance across carriers |
| **Outages** | Report and view network outages |
| **Schedule** | Set up automated speed tests |
| **Data Usage** | Track app-specific data consumption |
| **Settings** | User preferences and account settings |

## 🔐 Authentication

The app uses **Replit OpenID Connect (OIDC)** for secure authentication:
- Users authenticate via their Replit account
- Sessions stored in PostgreSQL
- Token-based authorization with refresh token support
- Development mode includes mock authentication for testing

## 🚢 Deployment

### Replit Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Replit:**
   - Go to replit.com and click "Create Repl"
   - Select "Import from GitHub"
   - Select this repository

3. **Configure Environment:**
   - Set all required environment variables in Replit Secrets
   - Ensure DATABASE_URL points to your Neon database

4. **Run:**
   - Click "Run" or use `npm start`
   - App will be live at your Replit domain

### Production Build

```bash
npm run build
npm run start
```

The app will serve on the PORT specified (default: 5000).

## 🛠️ Database Schema

Tables managed by Drizzle ORM:
- `users` - User accounts and profile data
- `speed_tests` - Speed test results and metrics
- `cell_towers` - Cell tower locations and carriers
- `coverage_points` - Coverage heatmap data
- `outage_reports` - User-reported outages
- `scheduled_tests` - Automated test schedules
- `data_usage` - Data consumption tracking
- `network_info` - Network information snapshots

## 📊 Performance Metrics Tracked

- **Download Speed** (Mbps)
- **Upload Speed** (Mbps)
- **Latency/Ping** (ms)
- **Jitter** (ms)
- **Signal Strength** (dBm)
- **Network Type** (LTE/5G/etc)
- **Carrier** (SaskTel/Bell/Telus/Rogers)
- **Geographic Location** (latitude/longitude)

## 🤝 Contributing

We welcome contributions! To get involved:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'Add new feature'`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request with a clear description

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Keep components modular with Radix UI
- Write descriptive commit messages
- Test changes in development mode before submitting

## 📝 License

MIT - See LICENSE file for details

## 📞 Support & Contact

For issues, questions, or suggestions:
- Open an issue on GitHub: https://github.com/stolar9595/CellSensei/issues
- Contact: [@stolar9595](https://github.com/stolar9595)

## 🙏 Acknowledgments

- Built with React, Express, and PostgreSQL
- UI components from Radix UI and shadcn/ui
- Map visualization with Leaflet.js
- Hosting on Replit
- Database by Neon (PostgreSQL)

---

**Last Updated:** 2026-02-22 18:51:32
**Version:** 1.0.0
**Status:** Active Development

Built with ❤️ for Saskatchewan's network analysis community.