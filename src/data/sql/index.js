import Whitelist from './Whitelist';
import RegUser from './RegUser';
import Channel from './Channel';
import UserChannel from './UserChannel';
import Message from './Message';
import UserBlock from './UserBlock';
import IPInfo from './IPInfo';
import Community from './Community';
import CommunityMember from './CommunityMember';
import CommunityRole from './CommunityRole';

/*
 * User Channel access
 */
RegUser.belongsToMany(Channel, {
  as: 'channel',
  through: UserChannel,
});
Channel.belongsToMany(RegUser, {
  as: 'user',
  through: UserChannel,
});

/*
 * User blocks of other user
 *
 * uid: User that blocks
 * buid: User that is blocked
 */
RegUser.belongsToMany(RegUser, {
  as: 'blocked',
  through: UserBlock,
  foreignKey: 'uid',
});
RegUser.belongsToMany(RegUser, {
  as: 'blockedBy',
  through: UserBlock,
  foreignKey: 'buid',
});

/*
 * Community relationships
 */
RegUser.belongsToMany(Community, {
  as: 'communities',
  through: CommunityMember,
  foreignKey: 'userId',
});
Community.belongsToMany(RegUser, {
  as: 'members',
  through: CommunityMember,
  foreignKey: 'communityId',
});


export {
  Whitelist,
  RegUser,
  Channel,
  UserChannel,
  Message,
  UserBlock,
  IPInfo,
  Community,
  CommunityMember,
  CommunityRole,
};
