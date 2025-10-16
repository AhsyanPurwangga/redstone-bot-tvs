# RedStone TVS Discord Bot

## Overview
A Discord bot that displays RedStone Oracle's Total Value Secured (TVS) from DeFiLlama in its status. The bot automatically updates the TVS value every 15 minutes to keep the data fresh.

## Recent Changes
- **October 16, 2025**: Initial implementation
  - Created Discord bot with web scraping functionality
  - Implemented TVS data extraction from DeFiLlama
  - Added number formatting (M/B notation)
  - Set up 15-minute automatic refresh with node-cron
  - Fixed parsing bug for billion/million notation

## Project Architecture

### Tech Stack
- **Runtime**: Node.js 20
- **Discord Library**: discord.js v14
- **HTTP Client**: axios
- **Scheduler**: node-cron
- **Authentication**: Discord OAuth integration

### Key Files
- `index.js`: Main bot logic including TVS fetching, parsing, and status updates
- `package.json`: Project dependencies and scripts
- `.gitignore`: Excludes node_modules and other generated files

### How It Works
1. **Authentication**: Uses Discord OAuth integration via Replit connectors
2. **Data Fetching**: Scrapes RedStone TVS from DeFiLlama oracle page
3. **Parsing**: Extracts TVS value and handles B/M/K notation
4. **Formatting**: Converts numbers to readable format ($7.35B instead of $7,353,000,000)
5. **Status Update**: Sets bot presence/activity to display current TVS
6. **Scheduling**: Updates every 15 minutes via cron job

### Data Source
- **Primary Source**: DeFiLlama RedStone Oracle page (https://defillama.com/oracles/RedStone)
- **Method**: Web scraping (no direct API endpoint available for oracle TVS)
- **Fallback**: Alternative regex patterns if primary pattern fails

## Environment Variables
- `DISCORD_BOT_TOKEN`: Bot authentication token from Discord Developer Portal
- `REPL_IDENTITY` / `WEB_REPL_RENEWAL`: Replit authentication for Discord OAuth
- `REPLIT_CONNECTORS_HOSTNAME`: Replit connectors API hostname

## Running the Bot
- **Start**: `npm start`
- **Workflow**: Configured to run automatically via Replit workflow
- **Update Frequency**: Every 15 minutes

## Notes
- Bot uses Discord.js v14 with modern presence API
- TVS calculation sums all protocol TVL that depends on RedStone Oracle
- Web scraping approach needed due to lack of dedicated DeFiLlama API for oracle TVS
- Graceful error handling for API failures and parsing errors
