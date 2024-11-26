const {MongoClient} = require('mongodb');
const config = require('../environments/environment.development.json');

const conn_string = config.mongo_connection_string;
const client = new MongoClient(conn_string);

async function connectDatabase() {
  try {
    await client.connect();
    return client.db(config.mongo_database);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  connectDatabase,
};
