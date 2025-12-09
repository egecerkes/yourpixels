/**
 * Regenerate all tiles for all canvases
 * This will fix the issue where zoomed out view shows nothing
 */

import fs from 'fs';
import { initializeTiles } from './src/core/Tile.js';
import logger from './src/core/logger.js';

async function regenerateAllTiles() {
  try {
    // Read canvases.json
    const canvasesData = JSON.parse(fs.readFileSync('./src/canvases.json', 'utf8'));
    const canvases = Object.entries(canvasesData).map(([id, canvas]) => ({
      id,
      ...canvas,
    }));

    logger.info(`Regenerating tiles for ${canvases.length} canvases...`);

    for (const canvas of canvases) {
      const canvasId = canvas.id;
      const canvasTileFolder = `./dist/tiles/${canvasId}`;
      
      logger.info(`Regenerating tiles for canvas ${canvasId}...`);
      await initializeTiles(
        canvasId,
        canvas,
        canvasTileFolder,
        true, // force = true to regenerate all tiles
      );
      logger.info(`Finished regenerating tiles for canvas ${canvasId}`);
    }

    logger.info('All tiles regenerated successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Error regenerating tiles: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

regenerateAllTiles();

