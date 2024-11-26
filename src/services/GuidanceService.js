const GuidanceRepo = require('../repository/GuidanceRepo');

async function getGuidanceLevels() {
  const results = await GuidanceRepo.getGuidanceLevels();
  return results.map((doc) => doc.level);
}

module.exports = {getGuidanceLevels};
