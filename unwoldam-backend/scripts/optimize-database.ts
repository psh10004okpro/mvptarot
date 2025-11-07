import mongoose from 'mongoose';
import { User, TarotCard, Reading, Interpretation, Subscription } from '../src/models';

/**
 * Database Optimization Script
 * - Creates indexes for frequently queried fields
 * - Analyzes query performance
 * - Provides optimization recommendations
 */

async function createIndexes() {
  console.log('📊 Creating database indexes...\n');

  try {
    // User indexes
    console.log('Creating User indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ membershipType: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex(
      { 'subscription.endDate': 1 },
      { sparse: true }
    );
    console.log('✅ User indexes created\n');

    // TarotCard indexes
    console.log('Creating TarotCard indexes...');
    await TarotCard.collection.createIndex({ cardNumber: 1 }, { unique: true });
    await TarotCard.collection.createIndex({ arcana: 1 });
    await TarotCard.collection.createIndex({ suit: 1 }, { sparse: true });
    await TarotCard.collection.createIndex({ keywords: 1 });
    await TarotCard.collection.createIndex({ name: 1 });
    await TarotCard.collection.createIndex({ nameKo: 1 });
    console.log('✅ TarotCard indexes created\n');

    // Reading indexes
    console.log('Creating Reading indexes...');
    await Reading.collection.createIndex({ userId: 1, createdAt: -1 });
    await Reading.collection.createIndex({ type: 1 });
    await Reading.collection.createIndex({ context: 1 });
    await Reading.collection.createIndex({ isVoiceReading: 1 });
    await Reading.collection.createIndex(
      { userId: 1, createdAt: -1, type: 1 },
      { name: 'user_readings_compound' }
    );
    // Index for daily fortune lookup
    await Reading.collection.createIndex(
      { userId: 1, type: 1, createdAt: -1 },
      { name: 'daily_fortune_lookup' }
    );
    // Index for history pagination
    await Reading.collection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'history_pagination' }
    );
    console.log('✅ Reading indexes created\n');

    // Interpretation indexes (for RAG system)
    console.log('Creating Interpretation indexes...');
    await Interpretation.collection.createIndex({ cardId: 1 });
    await Interpretation.collection.createIndex({ orientation: 1 });
    await Interpretation.collection.createIndex({ context: 1 });
    await Interpretation.collection.createIndex({ language: 1 });
    await Interpretation.collection.createIndex(
      { cardId: 1, orientation: 1, context: 1 },
      { name: 'interpretation_lookup' }
    );
    // Text index for semantic search
    await Interpretation.collection.createIndex(
      { text: 'text', keywords: 'text' },
      { name: 'text_search' }
    );
    console.log('✅ Interpretation indexes created\n');

    // Subscription indexes
    console.log('Creating Subscription indexes...');
    await Subscription.collection.createIndex({ userId: 1 });
    await Subscription.collection.createIndex({ status: 1 });
    await Subscription.collection.createIndex({ type: 1 });
    await Subscription.collection.createIndex({ endDate: 1 });
    await Subscription.collection.createIndex(
      { userId: 1, status: 1 },
      { name: 'active_subscription_lookup' }
    );
    // Index for subscription renewal reminders
    await Subscription.collection.createIndex(
      { endDate: 1, status: 1 },
      { name: 'renewal_reminder' }
    );
    console.log('✅ Subscription indexes created\n');

    console.log('✅ All indexes created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

async function analyzeIndexUsage() {
  console.log('🔍 Analyzing index usage...\n');

  const collections = [
    { name: 'users', model: User },
    { name: 'tarotcards', model: TarotCard },
    { name: 'readings', model: Reading },
    { name: 'interpretations', model: Interpretation },
    { name: 'subscriptions', model: Subscription },
  ];

  for (const { name, model } of collections) {
    console.log(`\n📋 ${name.toUpperCase()} Collection:`);

    try {
      const indexes = await model.collection.indexes();
      console.log(`  Total indexes: ${indexes.length}`);

      indexes.forEach((index: any) => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        if (index.unique) console.log(`    (unique)`);
        if (index.sparse) console.log(`    (sparse)`);
      });

      // Get collection stats
      const stats = await model.collection.stats();
      console.log(`\n  Collection stats:`);
      console.log(`    Documents: ${stats.count}`);
      console.log(`    Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    Avg document size: ${stats.avgObjSize} bytes`);
      console.log(`    Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error(`  Error analyzing ${name}:`, error);
    }
  }
}

async function optimizeQueries() {
  console.log('\n🚀 Query Optimization Recommendations:\n');

  const recommendations = [
    {
      title: 'User Daily Reading Queries',
      query: 'User.findById() with daily reading count check',
      optimization: 'Use lean() for read-only queries, select only needed fields',
      example: 'User.findById(id).select("dailyReadingCount membershipType").lean()',
    },
    {
      title: 'Reading History Pagination',
      query: 'Reading.find({ userId }).sort({ createdAt: -1 })',
      optimization: 'Already optimized with compound index (userId + createdAt)',
      example: 'Reading.find({ userId }).sort({ createdAt: -1 }).limit(10).lean()',
    },
    {
      title: 'Daily Fortune Lookup',
      query: 'Finding today\'s daily fortune',
      optimization: 'Use compound index and date range query',
      example: 'Reading.findOne({ userId, type: "daily", createdAt: { $gte: startOfDay } })',
    },
    {
      title: 'Card Lookup',
      query: 'TarotCard.find({ cardNumber: { $in: [0, 1, 2] } })',
      optimization: 'Use index on cardNumber, consider caching all 78 cards in Redis',
      example: 'Cache all cards at server startup for instant access',
    },
    {
      title: 'Interpretation Search (RAG)',
      query: 'Finding similar interpretations for context',
      optimization: 'Use compound index (cardId + orientation + context) + Vector DB',
      example: 'Interpretation.find({ cardId, orientation, context }).limit(5)',
    },
  ];

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}`);
    console.log(`   Query: ${rec.query}`);
    console.log(`   Optimization: ${rec.optimization}`);
    console.log(`   Example: ${rec.example}\n`);
  });
}

async function cleanupOldData() {
  console.log('\n🧹 Database Cleanup:\n');

  try {
    // Remove old guest user readings (>90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const guestUsers = await User.find({
      membershipType: 'free',
      lastLoginAt: { $lt: ninetyDaysAgo },
    }).select('_id');

    if (guestUsers.length > 0) {
      const guestUserIds = guestUsers.map(u => u._id);
      const deleteResult = await Reading.deleteMany({
        userId: { $in: guestUserIds },
        createdAt: { $lt: ninetyDaysAgo },
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} old readings from inactive free users`);
    } else {
      console.log('✅ No old readings to clean up');
    }

    // Remove expired subscriptions (>1 year old)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const expiredSubs = await Subscription.deleteMany({
      status: 'expired',
      endDate: { $lt: oneYearAgo },
    });

    console.log(`✅ Deleted ${expiredSubs.deletedCount} old expired subscriptions\n`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function generatePerformanceReport() {
  console.log('\n📈 Performance Report:\n');

  try {
    // Get database stats
    const admin = mongoose.connection.db.admin();
    const dbStats = await admin.serverStatus();

    console.log('Database Server:');
    console.log(`  Version: ${dbStats.version}`);
    console.log(`  Uptime: ${(dbStats.uptime / 3600).toFixed(2)} hours`);
    console.log(`  Connections: ${dbStats.connections.current} current / ${dbStats.connections.available} available`);

    // Query performance metrics
    console.log('\nQuery Performance:');
    console.log(`  Total operations: ${dbStats.opcounters.query + dbStats.opcounters.insert + dbStats.opcounters.update}`);
    console.log(`  Queries: ${dbStats.opcounters.query}`);
    console.log(`  Inserts: ${dbStats.opcounters.insert}`);
    console.log(`  Updates: ${dbStats.opcounters.update}`);

    // Network stats
    if (dbStats.network) {
      console.log('\nNetwork:');
      console.log(`  Bytes in: ${(dbStats.network.bytesIn / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Bytes out: ${(dbStats.network.bytesOut / 1024 / 1024).toFixed(2)} MB`);
    }
  } catch (error) {
    console.error('❌ Error generating performance report:', error);
  }
}

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/unwoldam';
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Run optimization tasks
    await createIndexes();
    await analyzeIndexUsage();
    await optimizeQueries();
    await cleanupOldData();
    await generatePerformanceReport();

    console.log('\n✅ Database optimization completed!\n');
  } catch (error) {
    console.error('\n❌ Optimization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createIndexes, analyzeIndexUsage, optimizeQueries, cleanupOldData };
