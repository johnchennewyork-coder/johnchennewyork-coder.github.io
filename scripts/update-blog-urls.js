#!/usr/bin/env node

/**
 * Script to update blog URLs based on configuration
 * Replaces old domain with new domain in all blog HTML/XML files
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.resolve(__dirname, '..', 'blog-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const blogDir = path.resolve(__dirname, '..', 'prev', 'blog');

console.log('Updating blog URLs...');
console.log(`Old domain: ${config.oldDomain}`);
console.log(`New domain: ${config.newDomain}`);
console.log(`Base URL: ${config.baseUrl}${config.blogPath}`);

// Find all HTML and XML files in the blog directory
const findCommand = `find "${blogDir}" -type f \\( -name "*.html" -o -name "*.xml" \\)`;

try {
  const files = execSync(findCommand, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(line => line.length > 0);

  console.log(`Found ${files.length} files to process`);

  let totalReplacements = 0;

  files.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Replace old domain with new domain
      content = content.replace(
        new RegExp(config.oldDomain.replace(/\./g, '\\.'), 'g'),
        config.newDomain
      );
      
      // Count replacements
      const matches = (originalContent.match(new RegExp(config.oldDomain.replace(/\./g, '\\.'), 'g')) || []).length;
      if (matches > 0) {
        totalReplacements += matches;
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  Updated ${file} (${matches} replacements)`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });

  console.log(`\n✓ Complete! Made ${totalReplacements} total replacements`);
} catch (error) {
  console.error('Error finding files:', error.message);
  process.exit(1);
}

