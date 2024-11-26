const {connectDatabase} = require('../dao/database');

async function getSteps() {
  const database = await connectDatabase();
  const collection = database.collection('steps');

  return collection.find().toArray();
}

module.exports = {getSteps};
