/* global process */
import fs from 'node:fs';
import path from 'node:path';

// 读取 package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 提取 node 版本
const nodeVersion = packageJson.engines?.node;

if (!nodeVersion) {
  console.error('Error: No node version found in package.json engines');
  process.exit(1);
}

// 提取版本号（去掉 >= 等前缀）
const versionMatch = nodeVersion.match(/>=?([0-9]+\.[0-9]+\.[0-9]+)/);

if (!versionMatch) {
  console.error('Error: Could not parse node version:', nodeVersion);
  process.exit(1);
}

const cleanVersion = versionMatch[1];

// 写入 .node-version 文件
const nodeVersionPath = path.join(process.cwd(), '.node-version');
fs.writeFileSync(nodeVersionPath, cleanVersion, 'utf8');

console.log(`Synced node version: ${cleanVersion}`);
