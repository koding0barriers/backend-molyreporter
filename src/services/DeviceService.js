const DeviceRepo = require('../repository/DeviceConfigRepo');

async function getDeviceConfigs() {
  const results = await DeviceRepo.getDeviceConfigs();
  const sanitized = results.map((doc) => doc.name);
  console.log(sanitized);
  return sanitized;
}

module.exports = {getDeviceConfigs};
