/**
 * basic mod api
 * is used by ../components/Modtools
 *
 */

import express from 'express';
import multer from 'multer';

import CanvasCleaner from '../../core/CanvasCleaner';
import chatProvider from '../../core/ChatProvider';
import { getIPFromRequest } from '../../utils/ip';
import { escapeMd } from '../../core/utils';
import logger, { modtoolsLogger } from '../../core/logger';
import {
  executeIPAction,
  executeIIDAction,
  executeImageAction,
  executeProtAction,
  executeRollback,
  executeCleanerAction,
  executeWatchAction,
  getModList,
  removeMod,
  makeMod,
  getVIPList,
  addVIP,
  removeVIP,
  getAdminCooldownStatus,
  setAdminCooldownStatus,
  regenerateAllTiles,
} from '../../core/adminfunctions';


const router = express.Router();

/*
 * multer middleware for getting POST parameters
 * into req.file (if file) and req.body for text
 */
router.use(express.urlencoded({ extended: true }));
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (PNG, JPEG, GIF, WebP) are allowed.'), false);
    }
  },
});


/*
 * make sure User is logged in and mod or mod
 */
router.use(async (req, res, next) => {
  const ip = getIPFromRequest(req);
  if (!req.user) {
    logger.warn(
      `MODTOOLS: ${ip} tried to access modtools without login`,
    );
    const { t } = req.ttag;
    res.status(403).send(t`You are not logged in`);
    return;
  }
  /*
   * 1 = Admin
   * 2 = Mod
   */
  if (!req.user.userlvl) {
    logger.warn(
      `MODTOOLS: ${ip} / ${req.user.id} tried to access modtools`,
    );
    const { t } = req.ttag;
    res.status(403).send(t`You are not allowed to access this page`);
    return;
  }

  next();
});


/*
 * Post for mod + admin
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  const aLogger = (text) => {
    const timeString = new Date().toLocaleTimeString();
    // eslint-disable-next-line max-len
    const logText = `@[${escapeMd(req.user.regUser.name)}](${req.user.id}) ${text}`;
    modtoolsLogger.info(
      `${timeString} | MODTOOLS> ${logText}`,
    );
    chatProvider.broadcastChatMessage(
      'info',
      logText,
      chatProvider.enChannelId,
      chatProvider.infoUserId,
    );
  };

  const bLogger = (text) => {
    logger.info(`IID> ${req.user.regUser.name}[${req.user.id}]> ${text}`);
  };

  try {
    if (req.body.cleanerstat) {
      const ret = CanvasCleaner.reportStatus();
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.cleanercancel) {
      const ret = CanvasCleaner.stop();
      res.status(200).send(ret);
      return;
    }
    if (req.body.watchaction) {
      const {
        watchaction, ulcoor, brcoor, time, iid, canvasid,
      } = req.body;
      const ret = await executeWatchAction(
        watchaction,
        ulcoor,
        brcoor,
        time,
        iid,
        canvasid,
      );
      res.status(200).json(ret);
      return;
    }
    if (req.body.iidaction) {
      const {
        iidaction, iid, reason, time,
      } = req.body;
      const ret = await executeIIDAction(
        iidaction,
        iid,
        reason,
        time,
        req.user.id,
        bLogger,
      );
      res.status(200).send(ret);
      return;
    }
    if (req.body.cleaneraction) {
      const {
        cleaneraction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeCleanerAction(
        cleaneraction,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.imageaction) {
      const { imageaction, coords, canvasid } = req.body;
      const [ret, msg] = await executeImageAction(
        imageaction,
        req.file,
        coords,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.protaction) {
      const {
        protaction, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeProtAction(
        protaction,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.rollback) {
      // rollback is date as YYYYMMdd
      const {
        rollback, ulcoor, brcoor, canvasid,
      } = req.body;
      const [ret, msg] = await executeRollback(
        rollback,
        ulcoor,
        brcoor,
        canvasid,
        aLogger,
        (req.user.userlvl === 1),
      );
      res.status(ret).send(msg);
      return;
    }
    if (req.body.viplist) {
      const ret = await getVIPList();
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.addvip) {
      // Input validation: ensure userId is a valid number
      const userId = parseInt(req.body.addvip, 10);
      if (Number.isNaN(userId) || userId <= 0) {
        res.status(400).send('Invalid user ID');
        return;
      }
      const ret = await addVIP(userId);
      res.status(200).send(ret);
      return;
    }
    if (req.body.remvip) {
      // Input validation: ensure userId is a valid number
      const userId = parseInt(req.body.remvip, 10);
      if (Number.isNaN(userId) || userId <= 0) {
        res.status(400).send('Invalid user ID');
        return;
      }
      const ret = await removeVIP(userId);
      res.status(200).send(ret);
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
});


/*
 * just admins past here, no Mods
 */
router.use(async (req, res, next) => {
  if (req.user.userlvl !== 1) {
    const { t } = req.ttag;
    res.status(403).send(t`Just admins can do that`);
    return;
  }
  next();
});

/*
 * Post just for admin
 */
router.post('/', async (req, res, next) => {
  const aLogger = (text) => {
    logger.info(`ADMIN> ${req.user.regUser.name}[${req.user.id}]> ${text}`);
  };

  try {
    if (req.body.ipaction) {
      const ret = await executeIPAction(
        req.body.ipaction,
        req.body.ip,
        aLogger,
      );
      res.status(200).send(ret);
      return;
    }
    if (req.body.modlist) {
      const ret = await getModList();
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.remmod) {
      // Input validation: ensure userId is a valid number
      const userId = parseInt(req.body.remmod, 10);
      if (Number.isNaN(userId) || userId <= 0) {
        res.status(400).send('Invalid user ID');
        return;
      }
      const ret = await removeMod(userId);
      res.status(200).send(ret);
      return;
    }
    if (req.body.makemod) {
      // Input validation: ensure name is valid
      const name = String(req.body.makemod).trim();
      if (!name || name.length > 32 || name.length < 2) {
        res.status(400).send('Invalid username');
        return;
      }
      const ret = await makeMod(name);
      res.status(200);
      res.json(ret);
      return;
    }
    if (req.body.getadmincooldown) {
      const ret = await getAdminCooldownStatus(req.user.id);
      res.status(200);
      res.json({ enabled: ret });
      return;
    }
    if (req.body.setadmincooldown !== undefined) {
      const enabled = req.body.setadmincooldown === 'true' || req.body.setadmincooldown === true;
      const ret = await setAdminCooldownStatus(req.user.id, enabled);
      res.status(200);
      res.send(ret);
      return;
    }
    if (req.body.regeneratetiles) {
      aLogger('Starting tile regeneration for all canvases...');
      // Run in background, don't block the response
      regenerateAllTiles()
        .then((result) => {
          aLogger(`Tile regeneration completed:\n${result}`);
        })
        .catch((error) => {
          aLogger(`Tile regeneration failed: ${error.message}`);
        });
      res.status(200);
      res.send('Tile regeneration started in background. This may take a while. Check logs for progress.');
      return;
    }
    next();
  } catch (err) {
    next(err);
  }
});

router.use(async (req, res) => {
  res.status(400).send('Invalid request');
});

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  res.status(400).send(err.message);
});

export default router;
