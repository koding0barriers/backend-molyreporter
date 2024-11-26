const UserRepo = require('../repository/UserRepo');
const bcrypt = require('bcryptjs');

/**
 * Registers a new user by checking for existing usernames and creating the user if unique.
 *
 * This function checks if a user with the provided username already exists. If the username
 * is not taken, it creates a new user record in the database. It returns `null` if a user
 * with the same username already exists.
 *
 * @async
 * @function register
 *
 * @param {Object} user - The user object containing user details for registration.
 * @param {string} user.username - The username for the new user.
 * @param {string} user.password - The plaintext password that will be hashed before storage.
 *
 * @returns {Promise<Object|null>} - The created user object or `null` if the username exists.
 */
async function register(user) {
  // Check if the username already exists
  const existing_users = await UserRepo.getByUsername(user.username);
  // Check if the email already exists
  const existing_emails = await UserRepo.getByEmail(user.email);

  user.role = "admin";

  // If the username or email already exists, return the appropriate error message
  if (existing_users !== null) {
    return "username";
  }

  if (existing_emails !== null) {
    return "email";
  }

  user.password = bcrypt.hashSync(user.password);
  return await UserRepo.create(user);
}

/**
 * Registers a new user by checking for existing usernames and creating the user if unique.
 *
 * This function checks if a user with the provided username already exists. If the username
 * is not taken, it creates a new user record in the database. It returns `null` if a user
 * with the same username already exists.
 *
 * @async
 * @function register
 *
 * @param {Object} user - The user object containing user details for registration.
 * @param {string} user.username - The username for the new user.
 * @param {string} user.password - The plaintext password that will be hashed before storage.
 *
 * @returns {Promise<Object|null>} - The created user object or `null` if the username exists.
 */
async function registerClient(user) {
  // Check if the username already exists
  const existing_users = await UserRepo.getByUsername(user.username);
  // Check if the email already exists
  const existing_emails = await UserRepo.getByEmail(user.email);

  // If the username or email already exists, return the appropriate error message
  if (existing_users !== null) {
    return "username";
  }

  if (existing_emails !== null) {
    return "email";
  }

  return await UserRepo.create(user);
}

/**
 * Retrieves a user by their username.
 *
 * This function queries the UserRepo for a user with the specified username and returns
 * the user object if found.
 *
 * @async
 * @function getByUsername
 *
 * @param {string} username - The username of the user to retrieve.
 *
 * @returns {Promise<Object|null>} - The user object if found, or `null` if not found.
 */
async function getByUsername(username) {
  return await UserRepo.getByUsername(username);
}

async function getByUserId(userId) {
  return await UserRepo.getByUserId(userId);
}

/**
 * Approves a user account by modifying its approval status.
 *
 * This function updates the approval status of the specified user and returns the count
 * of modified records. If no records were modified, it returns `null`.
 *
 * @async
 * @function approve
 *
 * @param {string} target - The identifier (usually a username) of the user to approve.
 *
 * @returns {Promise<number|null>} - The count of modified records or `null` if none were modified.
 */
async function approve(target) {
  const modified_count = await UserRepo.approve_user(target);
  if (modified_count) {
    return modified_count;
  } else {
    return null;
  }
}

/**
 * Updates an existing user’s data, including password hashing if the password is provided.
 *
 * This function accepts a user object with updated data, hashes the password if provided,
 * and then updates the user record in the database.
 *
 * @async
 * @function edit
 *
 * @param {Object} user - The user object containing updated user details.
 * @param {string} [user.password] - The new plaintext password to be hashed if provided.
 *
 * @returns {Promise<Object>} - The updated user object.
 */
async function edit(user) {
  // TODO: Sanitize data
  if (user.password) {
    user.password = bcrypt.hashSync(user.password);
  }

  return await UserRepo.edit_user(user);
}

/**
 * Deletes a user from the database by username.
 *
 * This function deletes the user with the specified username from the database.
 *
 * @async
 * @function deleteUser
 *
 * @param {string} username - The username of the user to delete.
 *
 * @returns {Promise<boolean>} - `true` if the user was successfully deleted, `false` otherwise.
 */
async function deleteUser(username) {
  return await UserRepo.deleteUser(username);
}

/**
 * Retrieves a paginated list of users from the database.
 *
 * This function calculates the appropriate offset based on the page number and limit provided,
 * and queries the database to fetch a subset of users along with the total count of users for 
 * pagination. It returns an object containing the list of users and the total count.
 *
 * @async
 * @function getAll
 *
 * @param {number} page
 * @param {number} limit
 *
 * @returns {Promise<Object>}
 *
 * @example
 * // Usage
 * const { users, total } = await UserService.getAll(2, 5);
 *
 * // Response:
 * // {
 * //   users: [{ "id": "1", "name": "User 1" }, { "id": "2", "name": "User 2" }, ...],
 * //   total: 100
 * // }
 */
async function getAll(page, limit) {
  // Calculate the offset based on the page and limit
  const offset = (page - 1) * limit;

  const users = await UserRepo.getAll(limit, offset);
  const total = await UserRepo.getTotalCount()

  return { users, total };
}


module.exports = {
  register,
  registerClient,
  getByUsername,
  approve,
  edit,
  deleteUser,
  getAll,
  getByUserId,
};
