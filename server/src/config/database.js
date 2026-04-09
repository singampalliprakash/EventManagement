const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const connectionString = process.env.MYSQL_URL || process.env.DATABASE_URL;

// Enable SSL for cloud databases (TiDB Cloud, PlanetScale, etc.)
const useSSL = process.env.MYSQL_SSL === 'true' || 
               (connectionString && connectionString.includes('tidbcloud'));

const sslConfig = useSSL ? {
  dialectOptions: {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  },
} : {};

const sequelize = connectionString
  ? new Sequelize(connectionString, {
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
      define: {
        timestamps: true,
        underscored: true,
      },
      ...sslConfig,
    })
  : new Sequelize(
      process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
      process.env.DB_USER || process.env.MYSQLUSER,
      process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQLPASSWORD,
      {
        host: process.env.DB_HOST || process.env.MYSQLHOST,
        port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      }
    );

module.exports = sequelize;
