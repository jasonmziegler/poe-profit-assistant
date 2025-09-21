#!/usr/bin/env tsx

import { ManualTrigger } from '@/lib/utils/trigger';
import { logger } from '@/lib/utils/logger';

interface FetchOptions {
  league?: string;
  limit?: number;
  verbose?: boolean;
}

async function main() {
  const args = process.argv.slice(2);
  const options: FetchOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--league':
        options.league = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Usage: npm run fetch-characters [options]

Options:
  --league <name>    League name (default: Standard)
  --limit <number>   Number of characters to fetch (default: 100)
  --verbose         Enable verbose logging
  --help            Show this help message

Examples:
  npm run fetch-characters
  npm run fetch-characters -- --league "Hardcore" --limit 50
  npm run fetch-characters -- --league "League Name" --verbose
        `);
        process.exit(0);
        break;
    }
  }

  const trigger = new ManualTrigger({
    apiUrl: 'http://localhost:3001/api',
    timeout: 120000 // 2 minutes timeout
  });
  const league = options.league || 'Standard';
  const limit = options.limit || 100;

  console.log(`🚀 Starting character fetch for league: ${league} (limit: ${limit})`);

  if (options.verbose) {
    console.log('Verbose logging enabled');
  }

  try {
    // Get cache info first
    const cacheResult = await trigger.getCacheInfo();
    if (cacheResult.success) {
      console.log(`📊 Cache info: ${cacheResult.data.totalEntries} entries, ${Math.round(cacheResult.data.totalSizeBytes / 1024)}KB`);
    }

    // Trigger character fetch
    const result = await trigger.triggerCharacterFetch(league, limit);

    if (result.success) {
      const stats = result.data?.stats;
      console.log(`✅ ${result.message}`);

      if (stats) {
        console.log(`📈 Stats:`);
        console.log(`  - Total: ${stats.total}`);
        console.log(`  - Successful: ${stats.successful}`);
        console.log(`  - Failed: ${stats.failed}`);
        console.log(`  - From cache: ${stats.fromCache ? 'Yes' : 'No'}`);
      }

      if (options.verbose && result.data?.characters) {
        console.log(`\n🔍 Character sample:`);
        result.data.characters.slice(0, 3).forEach((char: any, index: number) => {
          console.log(`  ${index + 1}. ${char.name} (${char.class}, Level ${char.level}) - ${char.items?.length || 0} items`);
        });
      }

    } else {
      console.error(`❌ Error: ${result.message}`);
      if (result.error) {
        console.error(`   Details: ${result.error}`);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error(`💥 Unexpected error:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}