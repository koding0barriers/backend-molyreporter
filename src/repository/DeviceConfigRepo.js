const {connectDatabase} = require('../dao/database');

async function getDeviceConfigByName(deviceName) {
  const client = await connectDatabase();

  try {
    const collection = client.collection('device_configs');

    return await collection.findOne({name: deviceName});
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getDeviceConfigs() {
  const database = await connectDatabase();
  const collection = database.collection('device_configs');

  return collection.find().toArray();
}

module.exports = {getDeviceConfigByName, getDeviceConfigs};
