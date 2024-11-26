const { connectDatabase } = require('../dao/database');

/**
 * Stores custom violation descriptions for a specific admin
 * @param {string} username - The admin's username
 * @param {Object} descriptions - Object mapping violation IDs to new descriptions
 */
async function storeCustomDescriptions(username, descriptions) {
    const database = await connectDatabase();
    const customDescriptions = database.collection('custom_violation_descriptions');

    // Upsert the custom descriptions for this admin
    await customDescriptions.updateOne(
        { username: username },
        {
            $set: {
                descriptions: descriptions,
                lastUpdated: new Date()
            }
        },
        { upsert: true }
    );
}

/**
 * Gets custom violation descriptions for a specific admin
 * @param {string} username - The admin's username
 * @returns {Object} - Mapping of violation IDs to custom descriptions
 */
async function getCustomDescriptions(username) {
    const database = await connectDatabase();
    const customDescriptions = database.collection('custom_violation_descriptions');

    const result = await customDescriptions.findOne({ username: username });
    return result ? result.descriptions : {};
}

/**
 * Updates scan results with custom descriptions for a specific admin
 * @param {Array} results - The original scan results
 * @param {string} username - The admin's username
 * @returns {Array} - Updated scan results with custom descriptions
 */
async function applyCustomDescriptions(results, username) {
    const customDescriptions = await getCustomDescriptions(username);

    // If no custom descriptions exist for this admin, return original results
    if (!customDescriptions || Object.keys(customDescriptions).length === 0) {
        return results;
    }

    // Deep clone the results to avoid modifying the original
    const updatedResults = JSON.parse(JSON.stringify(results));

    // Update descriptions for each result
    updatedResults.forEach(result => {
        if (result.violations) {
            result.violations.forEach(violation => {
                if (customDescriptions[violation.id]) {
                    violation.description = customDescriptions[violation.id];
                }
            });
        }
    });

    return updatedResults;
}

module.exports = {
    storeCustomDescriptions,
    getCustomDescriptions,
    applyCustomDescriptions
};