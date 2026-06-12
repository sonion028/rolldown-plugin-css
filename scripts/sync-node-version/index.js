#!/usr/bin/env node
/* global process */

import { syncNodeVersion } from "./sync.js";

const parseArgs = (argv) => {
  const options = {
    versionRange: false,
  };

  for (const arg of argv) {
    if (arg === "--version-range" || arg === "--version-range=true") {
      options.versionRange = true;
      continue;
    }

    if (arg === "--version-range=false") {
      options.versionRange = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

try {
  const options = parseArgs(process.argv.slice(2));
  syncNodeVersion(process.cwd(), options);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
