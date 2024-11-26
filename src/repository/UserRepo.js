const { ObjectId } = require('mongodb');
const {connectDatabase} = require('../dao/database');

const COLLECTION_NAME = 'users';

async function create(user) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);
  const admin = user.role === 'admin' ? true : false;

  const result = await collection.insertOne({
    // assigns a default timezone and avatar
    ...user,
    timezone: "America/Toronto",
    avatar: "",
    admin: admin,
    approved: false,
  });
  return result.insertedId;
}

async function getByUsername(username) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  return collection.findOne({username});
}

// Add a new function to retrieve a user by their email address
async function getByEmail(email) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  return collection.findOne({email});
}

async function getByUserId(userId) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  return collection.findOne({_id: new ObjectId(userId)});
}

async function approve_user(username) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  return (
    await collection.updateOne({username}, {$set: {approved: true}})
  ).modifiedCount;
}

async function edit_user(user) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const old_user = await collection.findOne({username: user.username});
  const modified_user = {...old_user, ...user};
  return collection.findOneAndReplace(
      {username: user.username},
      modified_user,
      {returnDocument: 'after'},
  );
}

async function deleteUser(username) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const result = await collection.deleteOne({username});
  return result.deletedCount;
}

async function getAll(limit, offset) {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);


  try {
    if (limit === undefined || offset === undefined) {
      const users = await collection.find({}).toArray();
      return users;
    } else {
      const users = await collection.find({})
          .skip(offset)
          .limit(limit)
          .toArray();

      return users;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function getTotalCount() {
  const db = await connectDatabase();
  const collection = db.collection(COLLECTION_NAME);

  // Get the total count of documents (users) in the collection
  return await collection.countDocuments();
}


module.exports = {
  create,
  getByUsername,
  getByEmail,
  approve_user,
  edit_user,
  deleteUser,
  getAll,
  getTotalCount,
  getByUserId
};
