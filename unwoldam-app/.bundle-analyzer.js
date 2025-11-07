/**
 * Bundle Size Analyzer
 * Run with: node .bundle-analyzer.js
 */

const fs = require('fs');
const path = require('path');

function analyzeBundle() {
  console.log('📦 Analyzing bundle size...\n');

  const dependencies = require('./package.json').dependencies;
  const devDependencies = require('./package.json').devDependencies;

  console.log('📊 Production Dependencies:');
  console.log('─'.repeat(50));

  let totalSize = 0;
  const largeDeps = [];

  Object.entries(dependencies).forEach(([name, version]) => {
    try {
      const packagePath = path.join(__dirname, 'node_modules', name, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkgJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const size = getDirectorySize(path.join(__dirname, 'node_modules', name));
        totalSize += size;

        const sizeMB = (size / 1024 / 1024).toFixed(2);
        largeDeps.push({ name, size, sizeMB });
      }
    } catch (error) {
      // Skip if can't analyze
    }
  });

  // Sort by size
  largeDeps.sort((a, b) => b.size - a.size);

  // Show top 10 largest
  console.log('\nTop 10 Largest Dependencies:');
  largeDeps.slice(0, 10).forEach((dep, index) => {
    console.log(`${index + 1}. ${dep.name}: ${dep.sizeMB} MB`);
  });

  console.log('\n📈 Summary:');
  console.log(`Total dependencies: ${Object.keys(dependencies).length}`);
  console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n💡 Optimization Suggestions:');

  // Check for large dependencies
  const largeOnes = largeDeps.filter(d => parseFloat(d.sizeMB) > 5);
  if (largeOnes.length > 0) {
    console.log('⚠️  Large dependencies found (>5MB):');
    largeOnes.forEach(dep => {
      console.log(`   - ${dep.name} (${dep.sizeMB}MB) - Consider alternatives or lazy loading`);
    });
  }

  // Check for duplicate functionality
  const duplicates = findPotentialDuplicates(dependencies);
  if (duplicates.length > 0) {
    console.log('\n⚠️  Potential duplicate functionality:');
    duplicates.forEach(dup => console.log(`   - ${dup}`));
  }

  // React Native specific optimizations
  console.log('\n✅ React Native Optimization Tips:');
  console.log('   1. Enable Hermes engine for faster startup');
  console.log('   2. Use react-native-fast-image for image optimization');
  console.log('   3. Enable inline requires in metro.config.js');
  console.log('   4. Use React.memo() for expensive components');
  console.log('   5. Implement code splitting where possible');
  console.log('   6. Remove unused dependencies');
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Skip if can't read directory
  }

  return totalSize;
}

function findPotentialDuplicates(dependencies) {
  const duplicates = [];
  const names = Object.keys(dependencies);

  // Check for common patterns
  const patterns = [
    { pattern: ['moment', 'date-fns', 'dayjs'], type: 'Date libraries' },
    { pattern: ['lodash', 'underscore', 'ramda'], type: 'Utility libraries' },
    { pattern: ['axios', 'fetch', 'request'], type: 'HTTP clients' },
  ];

  patterns.forEach(({ pattern, type }) => {
    const found = pattern.filter(p => names.includes(p));
    if (found.length > 1) {
      duplicates.push(`${type}: ${found.join(', ')}`);
    }
  });

  return duplicates;
}

// Run analysis
analyzeBundle();
