# Getting Started with Redash AI Document Assistant

Complete guide to setting up and running Redash with the AI Document Assistant feature.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Local Development Setup](#method-2-local-development-setup)
- [Configuration](#configuration)
- [First Run](#first-run)
- [Testing the AI Document Assistant](#testing-the-ai-document-assistant)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Overview

Redash is an open-source data visualization and analytics platform. This version includes an AI Document Assistant that can generate documents from your query results using LLMs (Large Language Models).

**What you'll be running:**
- Redash web application (Flask backend + React frontend)
- PostgreSQL database (for Redash metadata)
- Redis (for caching and job queue)
- AI Document Assistant (integrated into query results)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Docker** | 20.10+ | Container runtime | [Install Docker](https://docs.docker.com/get-docker/) |
| **Docker Compose** | 2.0+ | Multi-container orchestration | Included with Docker Desktop |
| **Git** | 2.0+ | Version control | [Install Git](https://git-scm.com/downloads) |

**OR** (for local development without Docker):

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Python** | 3.8-3.10 | Backend runtime | [Install Python](https://www.python.org/downloads/) |
| **Node.js** | 16.0-20.x | Frontend build | [Install Node.js](https://nodejs.org/) |
| **Yarn** | 1.22.10 | Package manager | `npm install -g yarn` |
| **PostgreSQL** | 10+ | Database | [Install PostgreSQL](https://www.postgresql.org/download/) |
| **Redis** | 4.0+ | Cache/Queue | [Install Redis](https://redis.io/download) |

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space minimum
- **OS**: Linux, macOS, or Windows (with WSL2 for Docker)

### Optional (for AI Features)

- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/)
- **AWS Account** (for Bedrock) - [AWS Signup](https://aws.amazon.com/)

---

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the easiest and fastest way to get started.

#### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/prawin4E/redash-ai.git
cd redash-ai

# Checkout the feature branch with AI Document Assistant
git checkout claude/understand-repo-011CUtNAGnNNePvFHA4kjoXy
```

#### Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Generate a secret key (important for security)
openssl rand -base64 32
```

Edit `.env` and set the following **required** variables:

```bash
# Copy the generated secret key here
REDASH_COOKIE_SECRET=<your-generated-secret-key>
REDASH_SECRET_KEY=<your-generated-secret-key>

# Database URL (default is fine for Docker Compose)
REDASH_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres

# Redis URL (default is fine for Docker Compose)
REDASH_REDIS_URL=redis://redis:6379/0
```

#### Step 3: Configure AI Document Assistant (Optional)

Add to your `.env` file:

```bash
# For testing without API costs (recommended for first run)
LLM_PROVIDER=mock
LLM_MODEL=mock-model
AI_DOCUMENT_ENABLED=true
AI_DOCUMENT_MAX_ROWS=1000
```

**For production with real LLM:**

```bash
# Example: Using AWS Bedrock (cheapest option)
LLM_PROVIDER=bedrock
LLM_MODEL=anthropic.claude-3-haiku-20240307-v1:0
AWS_BEDROCK_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AI_DOCUMENT_ENABLED=true
AI_DOCUMENT_MAX_ROWS=1000

# OR: Using OpenAI
# LLM_PROVIDER=openai
# LLM_API_KEY=sk-proj-your-openai-key
# LLM_MODEL=gpt-4-turbo-preview
```

See `.env.ai-document.example` for complete configuration options.

#### Step 4: Build and Start Services

```bash
# Build the Docker images (first time only, takes 10-15 minutes)
docker compose build

# Start all services
docker compose up -d

# Check if services are running
docker compose ps
```

You should see:
- `redash_server` - Running
- `redash_scheduler` - Running
- `redash_worker` - Running
- `postgres` - Running
- `redis` - Running

#### Step 5: Create Database Tables

```bash
# Run database migrations
docker compose run --rm server create_db

# This will create all necessary tables
```

#### Step 6: Access Redash

Open your browser and go to: **http://localhost:5000**

You should see the Redash setup page!

---

### Method 2: Local Development Setup

For developers who want to modify the code.

#### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/prawin4E/redash-ai.git
cd redash-ai

# Checkout the feature branch
git checkout claude/understand-repo-011CUtNAGnNNePvFHA4kjoXy
```

#### Step 2: Install Backend Dependencies

```bash
# Install Poetry (Python dependency manager)
curl -sSL https://install.python-poetry.org | python3 -

# Install Python dependencies
poetry install

# Optional: Install AI dependencies
poetry install --with ai
# OR
pip install openai anthropic tiktoken
```

#### Step 3: Install Frontend Dependencies

```bash
# Install Node.js dependencies
yarn install

# This will also build the viz-lib package
```

#### Step 4: Set Up Database

```bash
# Create PostgreSQL database
createdb redash

# Or using psql:
psql -U postgres -c "CREATE DATABASE redash;"

# Set up Redis (if not already running)
# On macOS: brew services start redis
# On Linux: sudo systemctl start redis
```

#### Step 5: Configure Environment

```bash
# Copy example environment file
cp env.example .env

# Edit .env with your local settings
```

Minimum `.env` for local development:

```bash
REDASH_COOKIE_SECRET=$(openssl rand -base64 32)
REDASH_SECRET_KEY=$(openssl rand -base64 32)
REDASH_DATABASE_URL=postgresql://postgres:@localhost:5432/redash
REDASH_REDIS_URL=redis://localhost:6379/0

# AI Document Assistant (mock mode for testing)
LLM_PROVIDER=mock
AI_DOCUMENT_ENABLED=true
AI_DOCUMENT_MAX_ROWS=1000
```

#### Step 6: Initialize Database

```bash
# Create database tables
poetry run ./manage.py database create_tables
```

#### Step 7: Build Frontend

```bash
# Build frontend assets
yarn build

# OR for development with hot reload
yarn watch
```

#### Step 8: Start Services

Open **three terminal windows**:

**Terminal 1 - Web Server:**
```bash
poetry run ./manage.py dev_server
```

**Terminal 2 - Worker (for query execution):**
```bash
poetry run ./manage.py dev_worker
```

**Terminal 3 - Scheduler (for scheduled queries):**
```bash
poetry run ./manage.py dev_scheduler
```

#### Step 9: Access Redash

Open your browser: **http://localhost:5000**

---

## Configuration

### Initial Setup Wizard

When you first access Redash, you'll see the setup wizard:

1. **Create Admin Account**
   - Name: Your name
   - Email: Your email (will be username)
   - Organization: Your company/org name
   - Password: Strong password

2. **Click "Setup"**

You're now logged in as admin!

### Configure a Data Source

Before you can test the AI Document Assistant, you need to add a data source:

1. **Click "Settings" (gear icon) → "Data Sources"**

2. **Click "New Data Source"**

3. **Choose a database type:**
   - **For testing:** SQLite (no setup needed)
   - **For production:** PostgreSQL, MySQL, etc.

4. **Example: Adding a PostgreSQL data source**
   ```
   Name: My Database
   Type: PostgreSQL
   Host: localhost
   Port: 5432
   User: postgres
   Password: your-password
   Database: your-database
   ```

5. **Click "Test Connection"** → **"Create"**

### Test Data (Optional)

If you don't have a database, you can use SQLite with sample data:

1. Create a new data source:
   - **Type**: SQLite
   - **Database Path**: `/tmp/sample.db`

2. Create sample data:

```sql
-- Run this in a query (we'll create the query in the next section)
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY,
    product TEXT,
    amount REAL,
    region TEXT,
    date TEXT
);

INSERT INTO sales VALUES
    (1, 'Laptop', 1200, 'North', '2024-01-15'),
    (2, 'Phone', 800, 'South', '2024-01-16'),
    (3, 'Tablet', 500, 'East', '2024-01-17'),
    (4, 'Monitor', 300, 'West', '2024-01-18'),
    (5, 'Keyboard', 100, 'North', '2024-01-19');
```

---

## First Run

### Create Your First Query

1. **Click "Create" → "Query"**

2. **Select your data source**

3. **Write a query:**

```sql
-- Example: Sales summary
SELECT
    product,
    amount,
    region,
    date
FROM sales
ORDER BY amount DESC;
```

4. **Click "Execute"** (or press Ctrl+Enter)

5. **You should see results!**

---

## Testing the AI Document Assistant

Now let's test the AI Document Assistant feature!

### Step 1: Run a Query

Make sure you have a query with results displayed (as shown above).

### Step 2: Look for the Chat Bubble

You should see a **floating chat bubble** in the bottom-right corner of the query results page:
- Blue circle with a message icon
- Has a sparkle (✨) badge
- Animated with a gentle pulse

### Step 3: Click the Chat Bubble

A sliding chat panel will open from the right side.

### Step 4: Try a Quick Prompt

Click one of the quick prompt buttons:
- **📊 Executive Summary**
- **💡 Key Insights**
- **📋 Detailed Report**
- **🔍 Find Anomalies**
- **✅ Action Items**

### Step 5: Wait for Document Generation

- If using `LLM_PROVIDER=mock`: Instant mock document
- If using real LLM: 5-10 seconds

### Step 6: Review the Document

The document editor modal will open:
- **Edit tab**: Markdown editor to modify content
- **Preview tab**: Formatted preview

### Step 7: Download

Click "Download" and choose format:
- **PDF**: For sharing/printing
- **Markdown**: For documentation
- **Text**: Plain text format

### Step 8: Try Custom Prompts

Type your own prompts:
- "Create a sales report highlighting top products"
- "Write an email summarizing these results"
- "Generate a presentation outline"

---

## Troubleshooting

### Docker Issues

#### "Cannot connect to Docker daemon"

```bash
# Start Docker Desktop (macOS/Windows)
# OR on Linux:
sudo systemctl start docker
```

#### "Port 5000 already in use"

```bash
# Find what's using port 5000
lsof -i :5000

# Kill it or change Redash port in docker-compose.yml
```

#### "Services won't start"

```bash
# Check logs
docker compose logs server
docker compose logs worker

# Common fix: Rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Application Issues

#### "Cannot connect to database"

```bash
# Docker: Make sure postgres is running
docker compose ps

# Check database logs
docker compose logs postgres

# Verify database URL in .env
REDASH_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/postgres
```

#### "Redis connection error"

```bash
# Docker: Check redis
docker compose ps redis

# Local: Start redis
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### AI Document Assistant Issues

#### "Chat bubble not appearing"

- ✅ Make sure query has results
- ✅ Check `AI_DOCUMENT_ENABLED=true` in .env
- ✅ Restart server: `docker compose restart server`
- ✅ Clear browser cache (Ctrl+Shift+R)

#### "LLM API key not configured"

For **OpenAI/Anthropic**, set in `.env`:
```bash
LLM_API_KEY=your-api-key-here
```

For **Bedrock**, set:
```bash
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

For **testing**, use mock:
```bash
LLM_PROVIDER=mock
```

#### "Failed to generate document"

Check server logs:
```bash
# Docker
docker compose logs server | grep -i "error"

# Local
# Check terminal running dev_server
```

Common issues:
- Invalid API key
- Network connectivity
- Rate limiting (try again in a few minutes)
- Model not available in your region (Bedrock)

### Frontend Build Issues

#### "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules yarn.lock
yarn install

# Rebuild
yarn build
```

#### "Out of memory" during build

```bash
# Increase Node memory limit
NODE_OPTIONS=--max-old-space-size=4096 yarn build
```

### Getting Help

1. **Check Logs:**
   ```bash
   # Docker
   docker compose logs -f server

   # Local
   tail -f /tmp/redash.log
   ```

2. **Enable Debug Mode:**
   ```bash
   # Add to .env
   REDASH_LOG_LEVEL=DEBUG
   ```

3. **Community Support:**
   - [Redash Discourse](https://discuss.redash.io/)
   - [GitHub Issues](https://github.com/getredash/redash/issues)

---

## Next Steps

### Learn Redash Basics

1. **Create Visualizations:**
   - Click "New Visualization" on query page
   - Choose chart type (Bar, Line, Pie, etc.)
   - Configure visualization settings

2. **Build Dashboards:**
   - Click "Create" → "Dashboard"
   - Add visualizations from queries
   - Arrange with drag-and-drop
   - Share with team

3. **Set Up Alerts:**
   - Click "Alerts" on query page
   - Set conditions (e.g., value > 1000)
   - Choose destination (email, Slack, etc.)

### Explore AI Document Assistant

1. **Try Different Prompts:**
   - Executive summaries
   - Detailed reports
   - Email drafts
   - Presentation outlines

2. **Experiment with Settings:**
   - Try different LLM providers
   - Adjust `AI_DOCUMENT_MAX_ROWS`
   - Test different models

3. **Cost Optimization:**
   - Use Bedrock Claude Haiku (cheapest: ~$0.001/generation)
   - Lower `AI_DOCUMENT_MAX_ROWS` to 500 or 250
   - Monitor usage in provider dashboard

### Configure for Production

1. **Security:**
   ```bash
   # Use strong secrets
   REDASH_COOKIE_SECRET=$(openssl rand -base64 64)
   REDASH_SECRET_KEY=$(openssl rand -base64 64)

   # Enable HTTPS
   REDASH_ENFORCE_HTTPS=true

   # Enable CSRF protection
   REDASH_ENFORCE_CSRF=true
   ```

2. **Performance:**
   ```bash
   # Increase workers
   WORKERS_COUNT=4

   # Set up caching
   REDASH_QUERY_RESULTS_CLEANUP_ENABLED=true
   ```

3. **Monitoring:**
   - Set up Sentry: `SENTRY_DSN=your-sentry-dsn`
   - Enable StatsD metrics
   - Monitor logs with CloudWatch/Datadog

### Connect More Data Sources

Redash supports 60+ data sources:
- **Databases**: PostgreSQL, MySQL, MongoDB, Cassandra
- **Cloud**: BigQuery, Redshift, Snowflake, Athena
- **APIs**: Google Analytics, Salesforce, Jira
- **BI Tools**: Tableau, Looker, Power BI

### Customize Redash

1. **Branding:**
   - Upload company logo
   - Customize colors
   - Set organization name

2. **User Management:**
   - Invite team members
   - Create groups with permissions
   - Set up SSO (SAML, OAuth)

3. **Query Snippets:**
   - Create reusable SQL snippets
   - Share common queries
   - Build query templates

---

## Quick Reference

### Common Commands

#### Docker

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Rebuild
docker compose build

# View logs
docker compose logs -f server

# Restart a service
docker compose restart server

# Run commands in container
docker compose exec server bash
docker compose run --rm server create_db
```

#### Local Development

```bash
# Start web server
poetry run ./manage.py dev_server

# Start worker
poetry run ./manage.py dev_worker

# Start scheduler
poetry run ./manage.py dev_scheduler

# Build frontend
yarn build

# Watch frontend (dev)
yarn watch

# Run tests
yarn test
pytest
```

### Important URLs

- **Redash UI**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs (if enabled)
- **Admin Panel**: http://localhost:5000/admin

### Environment Variables Cheat Sheet

```bash
# Core
REDASH_COOKIE_SECRET=required-secret-key
REDASH_SECRET_KEY=required-secret-key
REDASH_DATABASE_URL=postgresql://user:pass@host:5432/db
REDASH_REDIS_URL=redis://localhost:6379/0

# AI Document Assistant
LLM_PROVIDER=openai|anthropic|bedrock|mock
LLM_API_KEY=your-api-key (not needed for bedrock/mock)
LLM_MODEL=model-id
AI_DOCUMENT_ENABLED=true|false
AI_DOCUMENT_MAX_ROWS=1000

# AWS Bedrock (if using)
AWS_BEDROCK_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Security
REDASH_ENFORCE_HTTPS=true|false
REDASH_ENFORCE_CSRF=true|false

# Performance
WORKERS_COUNT=4
```

---

## Support

### Documentation

- **Redash Official Docs**: https://redash.io/help/
- **AI Document Assistant**: See `AI_DOCUMENT_ASSISTANT.md`
- **API Reference**: https://redash.io/help/user-guide/integrations-and-api/api

### Community

- **Forum**: https://discuss.redash.io/
- **GitHub**: https://github.com/getredash/redash
- **Discord**: https://discord.gg/redash

### Contributing

Found a bug? Want to contribute?
1. Open an issue on GitHub
2. Submit a pull request
3. Join the discussion on Discord

---

**Congratulations!** 🎉 You now have Redash running with the AI Document Assistant feature. Happy analyzing!
