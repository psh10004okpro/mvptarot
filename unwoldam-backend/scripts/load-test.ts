#!/usr/bin/env node

import axios from 'axios';

/**
 * Load Testing Script
 * Tests API performance under load
 */

interface LoadTestConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: any;
  concurrency: number;
  totalRequests: number;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTime: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  responseTimes: number[];
}

async function makeRequest(config: LoadTestConfig): Promise<number> {
  const start = Date.now();

  try {
    await axios({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data,
    });

    return Date.now() - start;
  } catch (error) {
    return -1; // Indicate failure
  }
}

async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  console.log(`\n🚀 Starting load test...`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Method: ${config.method}`);
  console.log(`   Concurrency: ${config.concurrency}`);
  console.log(`   Total requests: ${config.totalRequests}\n`);

  const startTime = Date.now();
  const responseTimes: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  // Create batches of concurrent requests
  const batchSize = config.concurrency;
  const numBatches = Math.ceil(config.totalRequests / batchSize);

  for (let batch = 0; batch < numBatches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, config.totalRequests);
    const batchCount = batchEnd - batchStart;

    const promises = Array(batchCount)
      .fill(null)
      .map(() => makeRequest(config));

    const results = await Promise.all(promises);

    results.forEach(time => {
      if (time > 0) {
        responseTimes.push(time);
        successfulRequests++;
      } else {
        failedRequests++;
      }
    });

    // Progress indicator
    const progress = ((batchEnd / config.totalRequests) * 100).toFixed(1);
    process.stdout.write(`\r   Progress: ${progress}% (${batchEnd}/${config.totalRequests})`);
  }

  const totalTime = Date.now() - startTime;

  console.log('\n\n✅ Load test completed!\n');

  return {
    totalRequests: config.totalRequests,
    successfulRequests,
    failedRequests,
    totalTime,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    requestsPerSecond: (successfulRequests / totalTime) * 1000,
    responseTimes,
  };
}

function displayResults(result: LoadTestResult) {
  console.log('📊 Load Test Results:');
  console.log('─'.repeat(50));
  console.log(`Total requests:       ${result.totalRequests}`);
  console.log(`Successful:           ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed:               ${result.failedRequests} (${((result.failedRequests / result.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Total time:           ${(result.totalTime / 1000).toFixed(2)}s`);
  console.log(`\nResponse times:`);
  console.log(`  Average:            ${result.avgResponseTime.toFixed(2)}ms`);
  console.log(`  Minimum:            ${result.minResponseTime}ms`);
  console.log(`  Maximum:            ${result.maxResponseTime}ms`);
  console.log(`\nThroughput:           ${result.requestsPerSecond.toFixed(2)} req/s`);

  // Calculate percentiles
  const sorted = result.responseTimes.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p90 = sorted[Math.floor(sorted.length * 0.9)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  console.log(`\nPercentiles:`);
  console.log(`  50th (median):      ${p50}ms`);
  console.log(`  90th:               ${p90}ms`);
  console.log(`  95th:               ${p95}ms`);
  console.log(`  99th:               ${p99}ms\n`);

  // Performance assessment
  if (result.avgResponseTime < 100) {
    console.log('✅ Performance: EXCELLENT (< 100ms avg)');
  } else if (result.avgResponseTime < 500) {
    console.log('✅ Performance: GOOD (< 500ms avg)');
  } else if (result.avgResponseTime < 1000) {
    console.log('⚠️  Performance: ACCEPTABLE (< 1000ms avg)');
  } else {
    console.log('❌ Performance: POOR (> 1000ms avg)');
  }

  if (result.failedRequests / result.totalRequests > 0.05) {
    console.log('❌ High failure rate detected (> 5%)');
  }

  console.log();
}

// Predefined test scenarios
const testScenarios = {
  light: {
    concurrency: 5,
    totalRequests: 50,
  },
  medium: {
    concurrency: 20,
    totalRequests: 200,
  },
  heavy: {
    concurrency: 50,
    totalRequests: 500,
  },
  stress: {
    concurrency: 100,
    totalRequests: 1000,
  },
};

async function main() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  const scenario = (process.argv[2] || 'light') as keyof typeof testScenarios;
  const endpoint = process.argv[3] || '/health';
  const token = process.env.AUTH_TOKEN;

  if (!testScenarios[scenario]) {
    console.error(`❌ Unknown scenario: ${scenario}`);
    console.error(`   Available: ${Object.keys(testScenarios).join(', ')}`);
    process.exit(1);
  }

  const config: LoadTestConfig = {
    url: `${apiUrl}${endpoint}`,
    method: 'GET',
    ...testScenarios[scenario],
  };

  if (token) {
    config.headers = {
      Authorization: `Bearer ${token}`,
    };
  }

  const result = await runLoadTest(config);
  displayResults(result);

  // Exit with error if performance is poor
  if (result.avgResponseTime > 1000 || result.failedRequests / result.totalRequests > 0.05) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { runLoadTest, LoadTestConfig, LoadTestResult };
