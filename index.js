import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import axios from 'axios';
import cron from 'node-cron';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is required!');
  console.log('Please set your Discord bot token in the Secrets tab.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

function formatNumber(num) {
  if (num >= 1e9) {
    return '$' + (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return '$' + (num / 1e6).toFixed(2) + 'M';
  } else {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

async function fetchRedStoneTVS() {
  try {
    const response = await axios.get('https://api.llama.fi/protocol/redstone');
    const data = response.data;
    
    let totalTVS = 0;
    const breakdown = {};
    
    if (data.currentChainTvls) {
      for (const [key, value] of Object.entries(data.currentChainTvls)) {
        totalTVS += value;
        
        if (key.includes('-staking')) {
          breakdown.staking = (breakdown.staking || 0) + value;
        } else if (key.includes('-pool2')) {
          breakdown.pool2 = (breakdown.pool2 || 0) + value;
        } else if (key.includes('-borrowed')) {
          breakdown.borrowed = (breakdown.borrowed || 0) + value;
        } else if (key.includes('-doublecounted')) {
          breakdown.doublecounted = (breakdown.doublecounted || 0) + value;
        } else if (key.includes('-liquidstaking')) {
          breakdown.liquidstaking = (breakdown.liquidstaking || 0) + value;
        } else if (key.includes('-vesting')) {
          breakdown.vesting = (breakdown.vesting || 0) + value;
        } else {
          breakdown.tvl = (breakdown.tvl || 0) + value;
        }
      }
    }
    
    console.log(`Fetched RedStone TVS: ${formatNumber(totalTVS)}`);
    console.log(`Breakdown:`, breakdown);
    
    return totalTVS;
  } catch (error) {
    console.error('Error fetching RedStone TVS:', error.message);
    return null;
  }
}

async function updateBotStatus() {
  try {
    const tvs = await fetchRedStoneTVS();
    
    if (tvs === null) {
      console.log('Failed to fetch TVS, skipping status update');
      return;
    }
    
    const formattedTVS = formatNumber(tvs);
    
    if (client.isReady()) {
      client.user.setPresence({
        activities: [{
          name: `RedStone TVS: ${formattedTVS}`,
          type: ActivityType.Watching
        }],
        status: 'online'
      });
      
      console.log(`✅ Bot status updated: RedStone TVS: ${formattedTVS}`);
    } else {
      console.log('⚠️  Bot not ready yet, skipping status update');
    }
  } catch (error) {
    console.error('Error updating bot status:', error.message);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  await updateBotStatus();
  
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running scheduled TVS update...');
    await updateBotStatus();
  });
  
  console.log('✅ Bot is running. TVS will update every 15 minutes.');
});

client.on('error', (error) => {
  console.error('Discord client error:', error);
});

console.log('🚀 Starting RedStone TVS Discord Bot...');
client.login(DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Failed to login to Discord:', error.message);
  process.exit(1);
});
