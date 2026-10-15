#!/usr/bin/env npx tsx
/**
 * CLI Entry Point - Wrapper to work around tsx ESM resolution issues
 * 
 * This file exists at the project root to avoid tsx's issues with
 * relative imports from subdirectories on Node.js 22+.
 */
import './src/cli/cli';
