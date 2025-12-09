/*
 * Community Database Model
 */

import { DataTypes } from 'sequelize';

import sequelize from './sequelize';
import RegUser from './RegUser';

const Community = sequelize.define('Community', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: `${DataTypes.CHAR(64)} CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  creatorId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: RegUser,
      key: 'id',
    },
  },

  totalPixels: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  updatedAt: true,
});

Community.belongsTo(RegUser, {
  as: 'creator',
  foreignKey: 'creatorId',
});

export default Community;

