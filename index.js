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
    const response = await axios.get('https://defillama.com/oracles/RedStone', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">({.*?})<\/script>/);
    
    if (nextDataMatch && nextDataMatch[1]) {
      const jsonData = JSON.parse(nextDataMatch[1]);
      const chartData = jsonData?.props?.pageProps?.chartData;
      
      if (chartData && chartData.length > 0) {
        const latestData = chartData[chartData.length - 1][1];
        
        const tvl = latestData.tvl || 0;
        const staking = latestData.staking || 0;
        const pool2 = latestData.pool2 || 0;
        const borrowed = latestData.borrowed || 0;
        const doublecounted = latestData.doublecounted || 0;
        const liquidstaking = latestData.liquidstaking || 0;
        const vesting = latestData.vesting || 0;
        
        const totalTVS = tvl + staking + pool2 + borrowed + doublecounted + liquidstaking + vesting;
        
        console.log('RedStone TVS Breakdown:');
        console.log(`  TVL: ${formatNumber(tvl)}`);
        console.log(`  Staking: ${formatNumber(staking)}`);
        console.log(`  Pool2: ${formatNumber(pool2)}`);
        console.log(`  Borrowed: ${formatNumber(borrowed)}`);
        if (doublecounted > 0) console.log(`  Double Count: ${formatNumber(doublecounted)}`);
        if (liquidstaking > 0) console.log(`  Liquid Staking: ${formatNumber(liquidstaking)}`);
        if (vesting > 0) console.log(`  Vesting: ${formatNumber(vesting)}`);
        console.log(`  ---`);
        console.log(`  Total TVS: ${formatNumber(totalTVS)}`);
        
        return totalTVS;
      }
    }
    
    console.log('Could not extract TVS from Next.js data, trying fallback method...');
    
    const tvsMatch = html.match(/Total\s+Value\s+Secured[^$]*\$([0-9,.]+[BMK]?)/i) ||
                     html.match(/TVS[^$]*\$([0-9,.]+[BMK]?)/i) ||
                     html.match(/\$([0-9,.]+[BMK]?)\s*(?:billion|B|million|M)/i);
    
    if (tvsMatch && tvsMatch[1]) {
      const tvsString = tvsMatch[1];
      console.log(`Found TVS string (fallback): ${tvsString}`);
      
      const numericPart = tvsString.replace(/[^0-9.]/g, '');
      let tvsValue = parseFloat(numericPart);
      
      if (tvsString.toLowerCase().includes('b') || tvsString.toLowerCase().includes('billion')) {
        tvsValue = tvsValue * 1e9;
      } else if (tvsString.toLowerCase().includes('m') || tvsString.toLowerCase().includes('million')) {
        tvsValue = tvsValue * 1e6;
      } else if (tvsString.toLowerCase().includes('k') || tvsString.toLowerCase().includes('thousand')) {
        tvsValue = tvsValue * 1e3;
      }
      
      return tvsValue;
    }
    
    console.error('Could not extract TVS from DeFiLlama page');
    return null;
    
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

client.once('clientReady', async () => {
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
