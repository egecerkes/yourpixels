/*
 * Admin Cooldown Management
 * Stores admin cooldown preference in Redis
 */

import client from './client';

const PREFIX = 'admin:cooldown';

/*
 * Get admin cooldown preference
 * @param userId admin user ID
 * @return boolean - true if cooldown enabled, false if disabled (default: true)
 */
export async function getAdminCooldown(userId) {
  try {
    const value = await client.get(`${PREFIX}:${userId}`);
    if (value === null) {
      return true; // default: cooldown enabled
    }
    return value === '1';
  } catch (err) {
    return true; // default: cooldown enabled on error
  }
}

/*
 * Set admin cooldown preference
 * @param userId admin user ID
 * @param enabled boolean - true to enable cooldown, false to disable
 */
export async function setAdminCooldown(userId, enabled) {
  try {
    if (enabled) {
      await client.set(`${PREFIX}:${userId}`, '1');
    } else {
      await client.set(`${PREFIX}:${userId}`, '0');
    }
    return true;
  } catch (err) {
    return false;
  }
}

