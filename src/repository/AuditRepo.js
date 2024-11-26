// Import the connectDatabase function from the database DAO module.
const { ObjectId } = require('mongodb');
const {connectDatabase} = require('../dao/database');

// Define a constant for the MongoDB collection name to be used.
const COLLECTION_NAME = 'audit_data';

// Async function to create a new audit data in the database.
async function create(data) {
    // Connect to the database.
    const db = await connectDatabase();
    // Access the specified collection within the database.
    const collection = db.collection(COLLECTION_NAME);

    // Insert the new rule document into the collection.
    const result = await collection.insertOne(data);
    // Return the ID of the inserted document.
    return result.insertedId;
}

// Async function to retrieve a specific audit data from the database by its ID.
async function get(id) {
    // Connect to the database.
    const database = await connectDatabase();
    // Access the specified collection within the database.
    const result_collection = database.collection(COLLECTION_NAME);
  
    // Find one document in the collection that matches the specified id.
    return await result_collection.findOne({
      _id: new ObjectId(id),
    });
  }

  // Export the functions to be used in other parts of the application.
  module.exports = {
    get,
    create
  };
