/**
 * Community API
 * Handles community creation, joining, leaving, role management
 */

import express from 'express';

import {
  Community,
  CommunityMember,
  CommunityRole,
  RegUser,
  Channel,
  UserChannel,
} from '../../data/sql';
import { ChatProvider } from '../../core/ChatProvider';
import { getUserRanks } from '../../data/redis/ranks';
import logger from '../../core/logger';

// Ensure models are initialized
import '../../data/sql';

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

/*
 * Middleware: Check if user is logged in
 */
router.use(async (req, res, next) => {
  try {
    // req.user is already set by main API middleware
    if (!req.user || !req.user.id || !req.user.regUser) {
      res.status(401).send('Not logged in');
      return;
    }
    next();
  } catch (err) {
    logger.error(`Community middleware error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);
    res.status(500).send('Internal server error');
  }
});

/*
 * GET /api/community/list
 * Get list of all communities with total pixels
 */
router.get('/list', async (req, res) => {
  try {
    const communities = await Community.findAll({
      attributes: ['id', 'name', 'description', 'totalPixels', 'createdAt'],
      include: [{
        model: RegUser,
        as: 'creator',
        attributes: ['id', 'name'],
      }],
      order: [['totalPixels', 'DESC']],
    });

    // Update pixel counts for all communities
    await Promise.all(communities.map((c) => updateCommunityPixels(c.id)));

    // Fetch updated communities
    const updatedCommunities = await Community.findAll({
      attributes: ['id', 'name', 'description', 'totalPixels', 'createdAt'],
      include: [{
        model: RegUser,
        as: 'creator',
        attributes: ['id', 'name'],
      }],
      order: [['totalPixels', 'DESC']],
    });

    res.json(updatedCommunities.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      totalPixels: c.totalPixels,
      creatorId: c.creatorId,
      creatorName: c.creator ? c.creator.name : null,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    logger.error(`Community list error: ${err.message}`);
    res.status(500).send('Error fetching communities');
  }
});

/*
 * GET /api/community/my
 * Get communities user is member of
 */
router.get('/my', async (req, res) => {
  try {
    const memberships = await CommunityMember.findAll({
      where: {
        userId: req.user.id,
      },
      include: [{
        model: Community,
        as: 'Community',
        attributes: ['id', 'name', 'description', 'totalPixels', 'createdAt', 'creatorId'],
        include: [{
          model: RegUser,
          as: 'creator',
          attributes: ['id', 'name'],
        }],
      }, {
        model: CommunityRole,
        attributes: ['id', 'name', 'permissions'],
      }],
    });

    res.json(memberships.map((m) => {
      const community = m.Community || m.community;
      if (!community) {
        logger.warn(`Community member ${m.id} has no community association`);
        return null;
      }
      return {
        id: community.id,
        name: community.name,
        description: community.description,
        totalPixels: community.totalPixels,
        creatorId: community.creatorId,
        creatorName: community.creator ? community.creator.name : null,
        roleId: m.roleId,
        roleName: m.CommunityRole ? m.CommunityRole.name : null,
        rolePermissions: m.CommunityRole ? m.CommunityRole.permissions : 0,
        isCreator: community.creatorId === req.user.id,
        createdAt: community.createdAt,
      };
    }).filter(Boolean));
  } catch (err) {
    logger.error(`Community my error: ${err.message}`);
    res.status(500).send('Error fetching user communities');
  }
});

/*
 * POST /api/community/create
 * Create a new community
 */
router.post('/create', async (req, res) => {
  try {
    logger.info(`Community create request from user ${req.user?.id}`);
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).send('Community name is required');
      return;
    }

    if (name.length > 64) {
      res.status(400).send('Community name too long (max 64 characters)');
      return;
    }

    // Check if user already created a community
    logger.info(`Checking for existing community for user ${req.user.id}`);
    const existingCommunity = await Community.findOne({
      where: {
        creatorId: req.user.id,
      },
    });

    if (existingCommunity) {
      res.status(400).send('You can only create one community');
      return;
    }

    logger.info(`Creating community: ${name}`);
    const community = await Community.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      creatorId: req.user.id,
      totalPixels: 0,
    });

    logger.info(`Community created with ID: ${community.id}`);

    // Add creator as member
    await CommunityMember.create({
      communityId: community.id,
      userId: req.user.id,
      roleId: null, // Creator has no role, they have all permissions
    });

    logger.info(`Creator added as member`);

    res.json({
      id: community.id,
      name: community.name,
      description: community.description,
      totalPixels: 0,
    });
  } catch (err) {
    logger.error(`Community create error: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);
    res.status(500).send(`Error creating community: ${err.message}`);
  }
});

/*
 * POST /api/community/join
 * Join a community
 */
router.post('/join', async (req, res) => {
  try {
    const { communityId } = req.body;

    if (!communityId) {
      res.status(400).send('Community ID is required');
      return;
    }

    const community = await Community.findByPk(communityId);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check if already a member
    const existingMember = await CommunityMember.findOne({
      where: {
        communityId,
        userId: req.user.id,
      },
    });

    if (existingMember) {
      res.status(400).send('Already a member of this community');
      return;
    }

    await CommunityMember.create({
      communityId,
      userId: req.user.id,
      roleId: null,
    });

    // Add user to all community channels
    const communityChannels = await Channel.findAll({
      where: {
        communityId,
        type: 4, // Community channel type
      },
    });

    for (const ch of communityChannels) {
      const channelArray = [ch.name, 4, ch.lastTs];
      await ChatProvider.addUserToChannel(
        req.user.id,
        ch.id,
        channelArray,
      );
    }

    // Update community total pixels
    await updateCommunityPixels(communityId);

    res.json({ success: true });
  } catch (err) {
    logger.error(`Community join error: ${err.message}`);
    res.status(500).send('Error joining community');
  }
});

/*
 * POST /api/community/leave
 * Leave a community
 */
router.post('/leave', async (req, res) => {
  try {
    const { communityId } = req.body;

    if (!communityId) {
      res.status(400).send('Community ID is required');
      return;
    }

    const community = await Community.findByPk(communityId);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Cannot leave if creator
    if (community.creatorId === req.user.id) {
      res.status(400).send('Creator cannot leave community');
      return;
    }

    const member = await CommunityMember.findOne({
      where: {
        communityId,
        userId: req.user.id,
      },
    });

    if (!member) {
      res.status(404).send('Not a member of this community');
      return;
    }

    await member.destroy();

    // Remove user from all community channels
    const communityChannels = await Channel.findAll({
      where: {
        communityId,
        type: 4,
      },
      attributes: ['id'],
      raw: true,
    });

    for (const ch of communityChannels) {
      await UserChannel.destroy({
        where: {
          UserId: req.user.id,
          ChannelId: ch.id,
        },
      });
    }

    // Update community total pixels
    await updateCommunityPixels(communityId);

    res.json({ success: true });
  } catch (err) {
    logger.error(`Community leave error: ${err.message}`);
    res.status(500).send('Error leaving community');
  }
});

/*
 * GET /api/community/:id/members
 * Get members of a community
 */
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    const members = await CommunityMember.findAll({
      where: {
        communityId: id,
      },
      include: [{
        model: RegUser,
        attributes: ['id', 'name'],
      }, {
        model: CommunityRole,
        attributes: ['id', 'name', 'permissions'],
      }],
    });

    // Get pixel counts for all members
    const memberData = await Promise.all(members.map(async (m) => {
      const [totalPixels] = await getUserRanks(m.userId);
      return {
        userId: m.userId,
        userName: m.RegUser.name,
        roleId: m.roleId,
        roleName: m.CommunityRole ? m.CommunityRole.name : null,
        isCreator: community.creatorId === m.userId,
        totalPixels: totalPixels || 0,
      };
    }));

    res.json(memberData);
  } catch (err) {
    logger.error(`Community members error: ${err.message}`);
    res.status(500).send('Error fetching members');
  }
});

/*
 * GET /api/community/:id/roles
 * Get roles of a community
 */
router.get('/:id/roles', async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check if user is creator or has manage_roles permission
    const member = await CommunityMember.findOne({
      where: {
        communityId: id,
        userId: req.user.id,
      },
      include: [{
        model: CommunityRole,
      }],
    });

    const isCreator = community.creatorId === req.user.id;
    const hasPermission = isCreator || (member && member.CommunityRole
      && (member.CommunityRole.permissions & 1) !== 0);

    if (!isCreator && !hasPermission) {
      res.status(403).send('No permission to view roles');
      return;
    }

    const roles = await CommunityRole.findAll({
      where: {
        communityId: id,
      },
      order: [['createdAt', 'ASC']],
    });

    res.json(roles.map((r) => ({
      id: r.id,
      name: r.name,
      permissions: r.permissions,
    })));
  } catch (err) {
    logger.error(`Community roles error: ${err.message}`);
    res.status(500).send('Error fetching roles');
  }
});

/*
 * POST /api/community/:id/role/create
 * Create a role in a community
 */
router.post('/:id/role/create', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).send('Role name is required');
      return;
    }

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check if user is creator or has manage_roles permission
    const member = await CommunityMember.findOne({
      where: {
        communityId: id,
        userId: req.user.id,
      },
      include: [{
        model: CommunityRole,
      }],
    });

    const isCreator = community.creatorId === req.user.id;
    const hasPermission = isCreator || (member && member.CommunityRole
      && (member.CommunityRole.permissions & 1) !== 0);

    if (!isCreator && !hasPermission) {
      res.status(403).send('No permission to create roles');
      return;
    }

    const role = await CommunityRole.create({
      communityId: id,
      name: name.trim(),
      permissions: permissions ? parseInt(permissions, 10) : 0,
    });

    res.json({
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    });
  } catch (err) {
    logger.error(`Community role create error: ${err.message}`);
    res.status(500).send('Error creating role');
  }
});

/*
 * POST /api/community/:id/role/assign
 * Assign a role to a member
 */
router.post('/:id/role/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, roleId } = req.body;

    if (!userId) {
      res.status(400).send('User ID is required');
      return;
    }

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check if user is creator or has manage_members permission
    const member = await CommunityMember.findOne({
      where: {
        communityId: id,
        userId: req.user.id,
      },
      include: [{
        model: CommunityRole,
      }],
    });

    const isCreator = community.creatorId === req.user.id;
    const hasPermission = isCreator || (member && member.CommunityRole
      && (member.CommunityRole.permissions & 2) !== 0);

    if (!isCreator && !hasPermission) {
      res.status(403).send('No permission to assign roles');
      return;
    }

    // Cannot assign role to creator
    if (community.creatorId === userId) {
      res.status(400).send('Cannot assign role to creator');
      return;
    }

    const targetMember = await CommunityMember.findOne({
      where: {
        communityId: id,
        userId,
      },
    });

    if (!targetMember) {
      res.status(404).send('User is not a member of this community');
      return;
    }

    // If roleId is null or 0, remove role
    if (!roleId || roleId === '0' || roleId === 0) {
      await targetMember.update({ roleId: null });
    } else {
      // Verify role exists in this community
      const role = await CommunityRole.findOne({
        where: {
          id: roleId,
          communityId: id,
        },
      });

      if (!role) {
        res.status(404).send('Role not found');
        return;
      }

      await targetMember.update({ roleId });
    }

    res.json({ success: true });
  } catch (err) {
    logger.error(`Community role assign error: ${err.message}`);
    res.status(500).send('Error assigning role');
  }
});

/*
 * Helper function to update community total pixels
 */
async function updateCommunityPixels(communityId) {
  try {
    const members = await CommunityMember.findAll({
      where: {
        communityId,
      },
      include: [{
        model: RegUser,
        attributes: ['id'],
      }],
    });

    let totalPixels = 0;
    for (const member of members) {
      const [pixels] = await getUserRanks(member.userId);
      totalPixels += pixels || 0;
    }

    await Community.update(
      { totalPixels },
      { where: { id: communityId } },
    );
  } catch (err) {
    logger.error(`Error updating community pixels: ${err.message}`);
  }
}

/*
 * Helper function to check if user has permission to manage channels
 */
async function hasManageChannelsPermission(userId, communityId) {
  const community = await Community.findByPk(communityId);
  if (!community) {
    return false;
  }

  // Creator always has permission
  if (community.creatorId === userId) {
    return true;
  }

  // Check role permissions
  const member = await CommunityMember.findOne({
    where: {
      communityId,
      userId,
    },
    include: [{
      model: CommunityRole,
    }],
  });

  if (member && member.CommunityRole) {
    // 16 = manage_channels permission
    return (member.CommunityRole.permissions & 16) !== 0;
  }

  return false;
}

/*
 * GET /api/community/:id/channels
 * Get all channels for a community
 */
router.get('/:id/channels', async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check if user is a member
    const member = await CommunityMember.findOne({
      where: {
        communityId: id,
        userId: req.user.id,
      },
    });

    if (!member && community.creatorId !== req.user.id) {
      res.status(403).send('Not a member of this community');
      return;
    }

    const channels = await Channel.findAll({
      where: {
        communityId: id,
        type: 4, // Community channel type
      },
      attributes: ['id', 'name', 'lastMessage'],
      order: [['lastMessage', 'DESC']],
    });

    res.json(channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
      lastMessage: ch.lastMessage,
      lastTs: ch.lastTs,
    })));
  } catch (err) {
    logger.error(`Community channels list error: ${err.message}`);
    res.status(500).send('Error fetching channels');
  }
});

/*
 * POST /api/community/:id/channels/create
 * Create a new channel for a community
 */
router.post('/:id/channels/create', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).send('Channel name is required');
      return;
    }

    if (name.length > 32) {
      res.status(400).send('Channel name too long (max 32 characters)');
      return;
    }

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    // Check permission
    const hasPermission = await hasManageChannelsPermission(req.user.id, id);
    if (!hasPermission) {
      res.status(403).send('No permission to create channels');
      return;
    }

    // Check if channel name already exists in this community
    const existingChannel = await Channel.findOne({
      where: {
        communityId: id,
        name: name.trim(),
        type: 4,
      },
    });

    if (existingChannel) {
      res.status(400).send('Channel name already exists in this community');
      return;
    }

    const channel = await Channel.create({
      name: name.trim(),
      type: 4, // Community channel
      communityId: id,
      lastMessage: new Date(),
    });

    // Add all community members to the channel
    const members = await CommunityMember.findAll({
      where: { communityId: id },
      attributes: ['userId'],
      raw: true,
    });

    const channelArray = [channel.name, 4, channel.lastTs];
    for (const member of members) {
      await ChatProvider.addUserToChannel(
        member.userId,
        channel.id,
        channelArray,
      );
    }

    res.json({
      id: channel.id,
      name: channel.name,
      lastMessage: channel.lastMessage,
      lastTs: channel.lastTs,
    });
  } catch (err) {
    logger.error(`Community channel create error: ${err.message}`);
    res.status(500).send('Error creating channel');
  }
});

/*
 * POST /api/community/:id/channels/:channelId/delete
 * Delete a channel from a community
 */
router.post('/:id/channels/:channelId/delete', async (req, res) => {
  try {
    const { id, channelId } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    const channel = await Channel.findOne({
      where: {
        id: channelId,
        communityId: id,
        type: 4,
      },
    });

    if (!channel) {
      res.status(404).send('Channel not found');
      return;
    }

    // Check permission
    const hasPermission = await hasManageChannelsPermission(req.user.id, id);
    if (!hasPermission) {
      res.status(403).send('No permission to delete channels');
      return;
    }

    // Remove all users from channel and delete it
    await Channel.destroy({
      where: { id: channelId },
    });

    res.status(200).send('Channel deleted successfully');
  } catch (err) {
    logger.error(`Community channel delete error: ${err.message}`);
    res.status(500).send('Error deleting channel');
  }
});

/*
 * POST /api/community/:id/channels/:channelId/edit
 * Edit a channel name
 */
router.post('/:id/channels/:channelId/edit', async (req, res) => {
  try {
    const { id, channelId } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).send('Channel name is required');
      return;
    }

    if (name.length > 32) {
      res.status(400).send('Channel name too long (max 32 characters)');
      return;
    }

    const community = await Community.findByPk(id);
    if (!community) {
      res.status(404).send('Community not found');
      return;
    }

    const channel = await Channel.findOne({
      where: {
        id: channelId,
        communityId: id,
        type: 4,
      },
    });

    if (!channel) {
      res.status(404).send('Channel not found');
      return;
    }

    // Check permission
    const hasPermission = await hasManageChannelsPermission(req.user.id, id);
    if (!hasPermission) {
      res.status(403).send('No permission to edit channels');
      return;
    }

    // Check if new name already exists
    const existingChannel = await Channel.findOne({
      where: {
        communityId: id,
        name: name.trim(),
        type: 4,
        id: { [require('sequelize').Op.ne]: channelId },
      },
    });

    if (existingChannel) {
      res.status(400).send('Channel name already exists in this community');
      return;
    }

    await channel.update({
      name: name.trim(),
    });

    res.status(200).send('Channel updated successfully');
  } catch (err) {
    logger.error(`Community channel edit error: ${err.message}`);
    res.status(500).send('Error editing channel');
  }
});

export default router;

