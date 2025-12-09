/**
 * Add communityId column to Channels table
 */

const Sequelize = require('sequelize');
const { DataTypes } = Sequelize;
const sequelize = require('./src/data/sql/sequelize').default;

async function addCommunityChannelColumn() {
  try {
    await sequelize.authenticate();
    console.log('Database\'e bağlanıldı...');

    const queryInterface = sequelize.getQueryInterface();
    const tableDescription = await queryInterface.describeTable('Channels');

    if (!tableDescription.communityId) {
      await queryInterface.addColumn('Channels', 'communityId', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'Communities',
          key: 'id',
        },
      });
      console.log('communityId kolonu eklendi!');
    } else {
      console.log('communityId kolonu zaten mevcut.');
    }

    console.log('İşlem tamamlandı!');
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

addCommunityChannelColumn();

