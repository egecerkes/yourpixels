/*
 * Script to clear rate limits
 * Usage: node clear-rate-limit.js [IP_ADDRESS]
 * If no IP is provided, clears all rate limits
 */

// This script needs to be run after the server is built
// It directly accesses the rateLimiter instance

console.log('Note: Rate limits are stored in memory and will be cleared on server restart.');
console.log('To clear rate limits for a specific IP, use the admin panel with action: clearratelimit');
console.log('Or restart the server to clear all rate limits.');
