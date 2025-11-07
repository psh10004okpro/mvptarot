#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';

/**
 * CLI Performance Dashboard
 * Displays real-time performance metrics in the terminal
 */

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const REFRESH_INTERVAL = 5000; // 5 seconds

interface DashboardData {
  system: {
    status: string;
    uptime: string;
    memory: {
      used: string;
      total: string;
      percentage: string;
    };
    database: string;
  };
  performance: {
    requests: {
      totalRequests: number;
      avgResponseTime: number;
      slowRequests: number;
      errorRate: number;
    };
    cache: {
      keys: number;
      hitRate: string;
      memory: string;
    };
  };
  issues: {
    slowRequests: number;
    errors: number;
  };
}

async function fetchDashboardData(token: string): Promise<DashboardData | null> {
  try {
    const response = await axios.get(`${API_URL}/monitoring/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    return null;
  }
}

function clearScreen() {
  console.clear();
}

function displayDashboard(data: DashboardData) {
  clearScreen();

  console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║        운월담 타로 서비스 - Performance Dashboard         ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════════╝\n'));

  // System Status
  console.log(chalk.bold.yellow('📊 System Status:'));
  const statusColor = data.system.status === 'operational' ? chalk.green : chalk.red;
  console.log(`   Status: ${statusColor(data.system.status.toUpperCase())}`);
  console.log(`   Uptime: ${chalk.white(data.system.uptime)}`);
  console.log(`   Memory: ${chalk.white(data.system.memory.used)} / ${data.system.memory.total} (${data.system.memory.percentage})`);

  const dbColor = data.system.database === 'connected' ? chalk.green : chalk.red;
  console.log(`   Database: ${dbColor(data.system.database)}`);

  // Performance Metrics
  console.log(chalk.bold.yellow('\n⚡ Performance Metrics:'));
  console.log(`   Total Requests: ${chalk.white(data.performance.requests.totalRequests)}`);
  console.log(`   Avg Response Time: ${chalk.white(data.performance.requests.avgResponseTime + 'ms')}`);

  const slowColor = data.performance.requests.slowRequests > 10 ? chalk.red : chalk.green;
  console.log(`   Slow Requests: ${slowColor(data.performance.requests.slowRequests)}`);

  const errorColor = data.performance.requests.errorRate > 5 ? chalk.red : chalk.green;
  console.log(`   Error Rate: ${errorColor(data.performance.requests.errorRate + '%')}`);

  // Cache Statistics
  console.log(chalk.bold.yellow('\n💾 Cache Statistics:'));
  console.log(`   Total Keys: ${chalk.white(data.performance.cache.keys)}`);
  console.log(`   Hit Rate: ${chalk.white(data.performance.cache.hitRate)}`);
  console.log(`   Memory: ${chalk.white(data.performance.cache.memory)}`);

  // Issues
  console.log(chalk.bold.yellow('\n⚠️  Issues:'));
  if (data.issues.slowRequests > 0 || data.issues.errors > 0) {
    if (data.issues.slowRequests > 0) {
      console.log(chalk.yellow(`   ⚠  ${data.issues.slowRequests} slow requests detected`));
    }
    if (data.issues.errors > 0) {
      console.log(chalk.red(`   ❌ ${data.issues.errors} errors detected`));
    }
  } else {
    console.log(chalk.green('   ✅ No issues detected'));
  }

  // Status indicators
  console.log(chalk.bold.yellow('\n📈 Health Indicators:'));

  // Response time indicator
  const responseTime = data.performance.requests.avgResponseTime;
  let responseBar = '';
  if (responseTime < 100) {
    responseBar = chalk.green('█████') + chalk.gray('█████');
  } else if (responseTime < 500) {
    responseBar = chalk.yellow('███████') + chalk.gray('███');
  } else {
    responseBar = chalk.red('██████████');
  }
  console.log(`   Response Time: ${responseBar} ${responseTime}ms`);

  // Error rate indicator
  const errorRate = data.performance.requests.errorRate;
  let errorBar = '';
  if (errorRate < 1) {
    errorBar = chalk.green('█████') + chalk.gray('█████');
  } else if (errorRate < 5) {
    errorBar = chalk.yellow('███████') + chalk.gray('███');
  } else {
    errorBar = chalk.red('██████████');
  }
  console.log(`   Error Rate:    ${errorBar} ${errorRate}%`);

  console.log(chalk.gray('\n' + '─'.repeat(60)));
  console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
  console.log(chalk.gray(`Press Ctrl+C to exit\n`));
}

async function main() {
  const token = process.env.AUTH_TOKEN;

  if (!token) {
    console.error(chalk.red('❌ Error: AUTH_TOKEN environment variable not set'));
    console.error(chalk.gray('   Set it with: export AUTH_TOKEN=your_token_here'));
    process.exit(1);
  }

  console.log(chalk.cyan('🔄 Starting performance dashboard...'));
  console.log(chalk.gray(`   API URL: ${API_URL}`));
  console.log(chalk.gray(`   Refresh interval: ${REFRESH_INTERVAL}ms\n`));

  // Initial fetch
  const data = await fetchDashboardData(token);
  if (!data) {
    console.error(chalk.red('❌ Failed to fetch dashboard data'));
    console.error(chalk.gray('   Check your API URL and authentication token'));
    process.exit(1);
  }

  displayDashboard(data);

  // Set up periodic refresh
  setInterval(async () => {
    const newData = await fetchDashboardData(token);
    if (newData) {
      displayDashboard(newData);
    } else {
      console.error(chalk.red('\n❌ Failed to refresh data'));
    }
  }, REFRESH_INTERVAL);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.cyan('\n\n👋 Goodbye!\n'));
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Error:'), error.message);
    process.exit(1);
  });
}
