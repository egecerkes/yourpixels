/*
 * Community Member Database Model (Join Table)
 */

import { DataTypes } from 'sequelize';

import sequelize from './sequelize';
import RegUser from './RegUser';
import Community from './Community';
import CommunityRole from './CommunityRole';

const CommunityMember = sequelize.define('CommunityMember', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  communityId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'Communities',
      key: 'id',
    },
  },

  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: RegUser,
      key: 'id',
    },
  },

  roleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'CommunityRoles',
      key: 'id',
    },
  },
}, {
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['communityId', 'userId'],
    },
  ],
});

CommunityMember.belongsTo(Community, {
  foreignKey: 'communityId',
  as: 'Community',
});

CommunityMember.belongsTo(RegUser, {
  foreignKey: 'userId',
});

CommunityMember.belongsTo(CommunityRole, {
  foreignKey: 'roleId',
});

export default CommunityMember;

