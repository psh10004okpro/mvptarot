import mongoose from 'mongoose';
import { User, TarotCard, Reading } from '../src/models';
import { createTestUser, createTestCards, createTestReading } from '../tests/utils/testHelpers';

/**
 * Query Performance Testing Script
 * Tests common queries and measures their performance
 */

interface QueryTest {
  name: string;
  fn: () => Promise<any>;
  expectedTime?: number; // ms
}

async function measureQuery(test: QueryTest): Promise<{ name: string; time: number; result: any }> {
  const start = Date.now();
  const result = await test.fn();
  const time = Date.now() - start;

  return { name: test.name, time, result };
}

async function runPerformanceTests() {
  console.log('🏁 Starting Query Performance Tests\n');

  const tests: QueryTest[] = [
    {
      name: 'Find user by email (indexed)',
      fn: async () => User.findOne({ email: 'test@example.com' }),
      expectedTime: 10,
    },
    {
      name: 'Find user by ID',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return User.findById(user?._id);
      },
      expectedTime: 5,
    },
    {
      name: 'Get user reading count (lean)',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return User.findById(user?._id).select('dailyReadingCount membershipType').lean();
      },
      expectedTime: 5,
    },
    {
      name: 'Find card by card number (indexed)',
      fn: async () => TarotCard.findOne({ cardNumber: 0 }),
      expectedTime: 5,
    },
    {
      name: 'Get all cards (cached query)',
      fn: async () => TarotCard.find({}).lean(),
      expectedTime: 20,
    },
    {
      name: 'Find readings by user (indexed)',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return Reading.find({ userId: user?._id }).sort({ createdAt: -1 }).limit(10).lean();
      },
      expectedTime: 15,
    },
    {
      name: 'Find today\'s daily fortune (compound index)',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return Reading.findOne({
          userId: user?._id,
          type: 'daily',
          createdAt: { $gte: startOfDay },
        });
      },
      expectedTime: 10,
    },
    {
      name: 'Paginated reading history (indexed)',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return Reading.find({ userId: user?._id })
          .sort({ createdAt: -1 })
          .skip(0)
          .limit(10)
          .lean();
      },
      expectedTime: 15,
    },
    {
      name: 'Count user readings (indexed)',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return Reading.countDocuments({ userId: user?._id });
      },
      expectedTime: 10,
    },
    {
      name: 'Aggregate readings by type',
      fn: async () => {
        const user = await User.findOne({ email: 'test@example.com' });
        return Reading.aggregate([
          { $match: { userId: user?._id } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]);
      },
      expectedTime: 20,
    },
  ];

  const results: Array<{ name: string; time: number; status: string }> = [];

  for (const test of tests) {
    try {
      const result = await measureQuery(test);
      const status = test.expectedTime && result.time > test.expectedTime ? '⚠️  SLOW' : '✅ OK';

      console.log(`${status} ${result.name}: ${result.time}ms`);
      if (test.expectedTime && result.time > test.expectedTime) {
        console.log(`   Expected: <${test.expectedTime}ms, Got: ${result.time}ms`);
      }

      results.push({
        name: result.name,
        time: result.time,
        status,
      });
    } catch (error) {
      console.error(`❌ ${test.name}: ERROR`);
      console.error(error);
      results.push({
        name: test.name,
        time: -1,
        status: '❌ ERROR',
      });
    }
  }

  // Summary
  console.log('\n📊 Performance Summary:\n');
  const totalTime = results.reduce((sum, r) => sum + (r.time > 0 ? r.time : 0), 0);
  const avgTime = totalTime / results.filter(r => r.time > 0).length;
  const slowQueries = results.filter(r => r.status.includes('SLOW'));

  console.log(`Total queries: ${results.length}`);
  console.log(`Average time: ${avgTime.toFixed(2)}ms`);
  console.log(`Slow queries: ${slowQueries.length}`);
  console.log(`Total test time: ${totalTime}ms\n`);

  if (slowQueries.length > 0) {
    console.log('⚠️  Slow queries that need optimization:');
    slowQueries.forEach(q => console.log(`  - ${q.name}: ${q.time}ms`));
    console.log();
  }

  return results;
}

async function testWithExplain() {
  console.log('\n🔍 Query Execution Plans:\n');

  const user = await User.findOne({ email: 'test@example.com' });

  if (!user) {
    console.log('No test user found');
    return;
  }

  // Test 1: Reading history query
  console.log('1. Reading History Query:');
  const readingExplain = await Reading.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .explain('executionStats');

  console.log(`   Execution time: ${readingExplain.executionStats.executionTimeMillis}ms`);
  console.log(`   Documents examined: ${readingExplain.executionStats.totalDocsExamined}`);
  console.log(`   Documents returned: ${readingExplain.executionStats.nReturned}`);
  console.log(`   Index used: ${readingExplain.executionStats.executionStages.indexName || 'NONE'}\n`);

  // Test 2: Daily fortune lookup
  console.log('2. Daily Fortune Lookup:');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const fortuneExplain = await Reading.findOne({
    userId: user._id,
    type: 'daily',
    createdAt: { $gte: startOfDay },
  }).explain('executionStats');

  console.log(`   Execution time: ${fortuneExplain.executionStats.executionTimeMillis}ms`);
  console.log(`   Documents examined: ${fortuneExplain.executionStats.totalDocsExamined}`);
  console.log(`   Index used: ${fortuneExplain.executionStats.executionStages.indexName || 'NONE'}\n`);
}

async function main() {
  try {
    // Connect to test database
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/unwoldam_test';
    console.log('🔌 Connecting to test database...\n');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected\n');

    // Setup test data
    console.log('📝 Setting up test data...\n');
    await User.deleteMany({});
    await TarotCard.deleteMany({});
    await Reading.deleteMany({});

    const user = await createTestUser({ email: 'test@example.com' });
    await createTestCards(78);

    // Create some test readings
    const cards = await TarotCard.find({}).limit(10);
    for (let i = 0; i < 20; i++) {
      await createTestReading(
        user._id.toString(),
        cards.slice(0, Math.floor(Math.random() * 3) + 1).map(c => c._id.toString())
      );
    }

    console.log('✅ Test data ready\n');

    // Run tests
    await runPerformanceTests();
    await testWithExplain();

    console.log('\n✅ Performance testing completed!\n');
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database\n');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runPerformanceTests, testWithExplain };
