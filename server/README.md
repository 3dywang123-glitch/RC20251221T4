# SoulSync Backend Server

Backend API server for the SoulSync AI relationship consultant application.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **AI Integration**: OpenAI-compatible API (Gemini, Claude, GPT)

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/soulsync
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-api-key
AI_API_ENDPOINT=https://hnd1.aihub.zeabur.ai/
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database

Create PostgreSQL database:

```bash
createdb soulsync
```

Run migrations:

```bash
npm run migrate
```

### 4. Start Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guest` - Create guest session

### User

- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/payments` - Get payment history

### Targets

- `GET /api/targets` - List all targets
- `GET /api/targets/:id` - Get target details
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `POST /api/targets/:id/personality` - Save personality report
- `POST /api/targets/:id/social-analysis` - Save social analysis
- `POST /api/targets/:id/post-analysis` - Save post analysis
- `POST /api/targets/:id/relationship-report` - Save relationship report

### Chat

- `GET /api/chat/:targetId` - Get chat messages
- `POST /api/chat/:targetId` - Save chat message
- `DELETE /api/chat/:targetId` - Clear chat history

### AI

- `POST /api/ai/analyze-avatar` - Analyze avatar image
- `POST /api/ai/analyze-personality` - Generate personality report
- `POST /api/ai/analyze-social` - Analyze social media profile
- `POST /api/ai/persona-reply` - Generate persona reply
- `POST /api/ai/relationship-report` - Generate relationship report

## Project Structure

```
server/
├── src/
│   ├── db/
│   │   ├── connection.ts        # Database connection
│   │   ├── schema.sql           # Unified database schema (base + v2)
│   │   └── migrate.ts           # Migration script
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   ├── errorHandler.ts      # Error handling
│   │   └── logger.ts            # Request logging
│   ├── routes/
│   │   ├── ai.ts                # Legacy AI routes (v1)
│   │   ├── aiV2.ts              # Advanced AI routes (v2)
│   │   ├── auth.ts              # Authentication routes
│   │   ├── chat.ts              # Chat message routes
│   │   ├── target.ts            # Target profile routes
│   │   └── user.ts              # User management routes
│   ├── services/
│   │   └── aiServiceV2.ts       # Unified AI service (v1 + v2 merged)
│   └── index.ts                 # Server entry point
├── .env                          # Environment variables (development)
├── package.json
├── tsconfig.json
└── README.md                     # This deployment guide
```

## Database Schema

### Tables

- `users` - User accounts
- `user_profiles` - User profile data
- `target_profiles` - Target person profiles
- `personality_reports` - Personality analysis results
- `social_analysis_results` - Social media analysis
- `social_post_analysis` - Individual post analysis
- `relationship_reports` - Relationship consultation reports
- `chat_messages` - Chat conversation history
- `payment_transactions` - Payment records

## Development

### Watch Mode

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Migrations

```bash
npm run migrate
```

## Deployment

### Zeabur Deployment Guide

#### 1. Prepare Your Project

**Clone and setup the project:**
```bash
git clone <your-repo-url>
cd server
npm install
npm run build
```

#### 2. Create Zeabur Project

1. Go to [Zeabur Dashboard](https://dash.zeabur.com)
2. Click "New Project"
3. Choose "Deploy from GitHub" or "Deploy from Git"
4. Connect your repository

#### 3. Database Setup

**Create PostgreSQL Database:**
1. In Zeabur dashboard, add a new service
2. Choose "PostgreSQL" from marketplace
3. Configure database settings:
   - Version: 15+ (recommended)
   - Plan: Free or paid based on needs

**Get Database Connection Info:**
- After creation, go to the PostgreSQL service
- Copy the connection string from "Connection URI"

#### 4. Environment Variables

In Zeabur dashboard, go to your service settings and add these environment variables:

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production

# AI API Configuration
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
AI_API_ENDPOINT=https://hnd1.aihub.zeabur.ai/

# Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.zeabur.app
```

**Optional Variables:**
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=10485760
MAX_FILES_COUNT=10
```

#### 5. Build Settings

**Configure Build Command:**
- Build Command: `npm run build`
- Install Command: `npm install`
- Start Command: `npm start`

**For Zero-downtime deployments:**
- Enable "Health Check"
- Health Check Path: `/health`
- Health Check Method: `GET`

#### 6. Database Migration

**Run migrations after deployment:**
```bash
# Connect to your Zeabur service via SSH or use the web terminal
npm run migrate
```

**Alternative: Pre-deployment migration**
You can run migrations locally against your Zeabur database:
```bash
# Set DATABASE_URL to your Zeabur database
export DATABASE_URL="postgresql://..."
npm run migrate
```

#### 7. Domain Configuration

**Custom Domain (Optional):**
1. Go to service settings
2. Add custom domain
3. Configure DNS records as instructed

**CORS Configuration:**
Update `CORS_ORIGIN` environment variable to match your frontend domain.

#### 8. Monitoring & Logs

**View Logs:**
- Go to service dashboard
- Click "Logs" tab
- Monitor for errors and performance

**Health Check:**
- Access `https://your-service.zeabur.app/health`
- Should return: `{"status":"ok","timestamp":"..."}`

#### 9. Scaling (Optional)

**Vertical Scaling:**
- Upgrade your service plan for more CPU/RAM

**Horizontal Scaling:**
- Zeabur supports horizontal scaling for higher traffic

#### Troubleshooting

**Common Issues:**

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds locally

2. **Database Connection:**
   - Verify `DATABASE_URL` format
   - Check database firewall settings
   - Run migrations after database connection

3. **Environment Variables:**
   - Ensure all required variables are set
   - Check variable names match exactly

4. **CORS Issues:**
   - Update `CORS_ORIGIN` to match frontend domain
   - Include protocol (https://)

**Debug Commands:**
```bash
# Check database connection
npm run migrate

# Test health endpoint
curl https://your-service.zeabur.app/health

# Check environment
echo $DATABASE_URL
echo $NODE_ENV
```

#### Deployment Checklist

- [ ] Project cloned and dependencies installed
- [ ] Database created and connection string obtained
- [ ] Environment variables configured
- [ ] Build settings configured
- [ ] Database migrations run
- [ ] Health check endpoint responding
- [ ] Frontend CORS origin configured
- [ ] Custom domain configured (optional)
- [ ] Logs monitored for errors

#### Cost Estimation

**Free Tier:**
- PostgreSQL: ~$0/month
- Node.js Service: ~$0/month (with limits)

**Production (Estimated):**
- PostgreSQL: $5-15/month
- Node.js Service: $5-25/month
- Custom Domain: $3/month (optional)

---

### Alternative Deployment Platforms

The server can also be deployed to:

- **Railway**: Similar to Zeabur, good PostgreSQL integration
- **Heroku**: Traditional PaaS with easy scaling
- **DigitalOcean App Platform**: Cost-effective with good performance
- **AWS**: More control but higher complexity
- **Vercel**: For serverless deployment (requires code modifications)

Make sure to:
1. Set environment variables
2. Set up PostgreSQL database
3. Run migrations
4. Configure CORS for your frontend domain

## Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Helmet.js for HTTP security headers
- CORS configured for trusted origins
- Rate limiting on API endpoints
- Input validation with express-validator

## License

Private project - All rights reserved
