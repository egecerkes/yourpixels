/*
 * Community Role Database Model
 */

import { DataTypes } from 'sequelize';

import sequelize from './sequelize';
import Community from './Community';

const CommunityRole = sequelize.define('CommunityRole', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  communityId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Community,
      key: 'id',
    },
  },

  name: {
    type: `${DataTypes.CHAR(32)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  permissions: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Bitmask for permissions: 1=manage_roles, 2=manage_members, 4=kick_members, 8=edit_community, 16=manage_channels',
  },
}, {
  timestamps: true,
  updatedAt: true,
});

CommunityRole.belongsTo(Community, {
  foreignKey: 'communityId',
});

export default CommunityRole;

