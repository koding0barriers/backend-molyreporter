const {connectDatabase} = require('../dao/database');

async function getGuidanceLevels() {
  const database = await connectDatabase();
  const collection = database.collection('guidance_levels');

  return collection.find().toArray();
}

module.exports = {getGuidanceLevels};
