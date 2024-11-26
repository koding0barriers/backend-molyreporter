// Import the connectDatabase function from the database DAO module.
const {connectDatabase} = require('../dao/database');

// Define a constant for the MongoDB collection name to be used.
const COLLECTION_NAME = 'rules';

// Async function to retrieve all documents/rules from the database.
async function getAll() {
    // Connect to the database.
    const db = await connectDatabase();
    // Access the specified collection within the database.
    const collection = db.collection(COLLECTION_NAME);

    // Find all documents in the collection and convert the result to an array.
    return await collection.find().toArray();
}

// Async function to create a new document/rule in the database.
async function create(rule) {
    // Connect to the database.
    const db = await connectDatabase();
    // Access the specified collection within the database.
    const collection = db.collection(COLLECTION_NAME);

    // Insert the new rule document into the collection.
    const result = await collection.insertOne(rule);
    // Return the ID of the inserted document.
    return result.insertedId;
}

// Async function to retrieve a specific document/rule from the database by its ID.
async function getRule(ruleId) {
    // Connect to the database.
    const database = await connectDatabase();
    // Access the specified collection within the database.
    const result_collection = database.collection(COLLECTION_NAME);
  
    // Find one document in the collection that matches the specified ruleId.
    return await result_collection.findOne({
      ruleId: ruleId,
    });
  }

  // Export the functions to be used in other parts of the application.
  module.exports = {
    getAll,
    getRule,
    create
  };
