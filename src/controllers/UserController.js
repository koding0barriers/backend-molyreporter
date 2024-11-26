const UserService = require('../services/UserService');

/**
 * Sanitizes the registration data by validating the presence of essential fields.
 *
 * This function extracts essential fields from the user object and ensures they are
 * non-null and valid. If any required fields are missing, it returns `null`.
 *
 * @function sanitizeRegistration
 *
 * @param {Object} user - The user object containing registration details.
 * @param {string} user.username - Username for the new user.
 * @param {string} user.first_name - First name of the user.
 * @param {string} user.last_name - Last name of the user.
 * @param {string} user.email - Email address of the user.
 * @param {string} user.password - Plaintext password for the new user.
 *
 * @returns {Object|null} - The sanitized user object if valid, or `null` if invalid.
 */
function sanitizeRegistration(user) {
  const {
    first_name,
    last_name,
    username,
    email,
    password,
  } = user;
  if (
    !first_name ||
    !last_name ||
    !username ||
    !email ||
    !password
  ) {
    return null;
  } else {
    return {
      first_name,
      last_name,
      username,
      email,
      password
    };
  }
}

function sanitizeClientRegistration(user) {
  const {
    first_name,
    last_name,
    username,
    email,
    role,
    is_active
  } = user;
  if (
    !first_name ||
    !last_name ||
    !username ||
    !email ||
    !role ||
    !is_active
  ) {
    return null;
  } else {
    return {
      first_name,
      last_name,
      username,
      email,
      role,
      is_active
    };
  }
}

/**
 * Registers a new user after validating and sanitizing input data.
 *
 * This function uses `sanitizeRegistration` to validate user data, then attempts to
 * register the user using `UserService`. Sends an error message if registration fails
 * due to invalid data or duplicate username.
 *
 * @async
 * @function register
 *
 * @param {Object} req - Express request object containing user data.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a response indicating success or failure of registration.
 */
async function register(req, res) {
  const user = sanitizeRegistration(req.body);
  
  if (user == null) {
    res.status(400).send('First Name, Last Name, Username, Email, and Password are required.');
    return;
  }

  const password = req.body.password;
  
  // Password must have at least one digit [0-9],
  // one lowercase character [a-z],
  // one uppercase character [A-Z],
  // one special character [*!@#$%], 
  // and be between 8 and 32 characters
  const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*!@#$%]).{8,32}$/;
  
  if (!passwordRegex.test(password)) {
    const validations = [
      'Password must have at least one digit [0-9].',
      'Password must have at least one lowercase character [a-z].',
      'Password must have at least one uppercase character [A-Z].',
      'Password must have at least one special character [*!@#$%].',
      'Password must be between 8 and 32 characters long.',
    ];
    res.status(401).send(`Password is weak. Requirements:\n${validations.join('\n')}`);
    return;
  }

  if (req.body?.country_code) {
    user.country_code = req.body.country_code;
  }
  if (req.body?.phone) {
    user.phone = req.body.phone;
  }
  if (req.body?.company) {
    user.company = req.body.company;
  }

  const user_id = await UserService.register(user);

  if (user_id === "username") {
    res.status(408).send('A user with that username already exists.');
  } else if (user_id === "email") {
    res.status(409).send('A user with that email already exists.');
  } else {
    res.status(201).send('User created successfully with id: ' + user_id);
  }
}


/**
 * Registers a new user after validating and sanitizing input data.
 *
 * This function uses `sanitizeRegistration` to validate user data, then attempts to
 * register the user using `UserService`. Sends an error message if registration fails
 * due to invalid data or duplicate username.
 *
 * @async
 * @function register
 *
 * @param {Object} req - Express request object containing user data.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a response indicating success or failure of registration.
 */
async function registerClient(req, res) {
  const user = sanitizeClientRegistration(req.body);
  if (user == null) {
    res.status(400);
    res.send('User properties are invalid');
  }

  const user_id = await UserService.registerClient(user);

  // If the user_id is a string, then it is an error message
  if (user_id == "username") {
    res.status(408);
    res.send('A user with that username already exists.');
  } else if (user_id == "email") {
    res.status(409);
    res.send('A user with that email already exists.');
  } else {
    res.status(201);
    res.send('User created successfully with id: ' + user_id);
  }
}

/**
 * Approves a user account, requiring admin privileges.
 *
 * This function checks if the requester has admin rights before approving a specified
 * user account. If the user is successfully approved, a confirmation message is sent;
 * otherwise, an error message is returned.
 *
 * @async
 * @function approve
 *
 * @param {Object} req - Express request object containing the username to approve.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a response indicating success or failure of the approval.
 */
async function approve(req, res) {
  const requester = await UserService.getByUsername(req.user.username);

  if (requester.admin === false) {
    return res.sendStatus(403);
  } else {
    const result = await UserService.approve(req.body.username);
    if (result) {
      res.status(200);
      res.send('User approved successfully.');
    } else {
      res.status(404);
      res.send('User not found.');
    }
  }
}

/**
 * Edits an existing user's profile, allowing for avatar updates.
 *
 * This function verifies permissions and checks if the user exists. It allows the requester
 * to update their profile or other users if they have admin rights. If a file is provided,
 * it generates an avatar URL.
 *
 * @async
 * @function edit
 *
 * @param {Object} req - Express request object containing user data for editing.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a response with updated user data or error messages.
 */
async function edit(req, res) {
  const requester = await UserService.getByUsername(req.user.username);
  console.log("Requester:", requester);

  // Cannot edit someone else's profile if you are not an admin
  if (requester.username != req.body.username && requester.admin === false) {
    return res.sendStatus(403);
  }

  if (!req.body.username) {
    res.status(400);
    res.send('Username not found.');
    return;
  }

  const target = await UserService.getByUsername(req.body.username);
  if (!target) {
    res.status(404);
    res.send('User does not exist.');
    return;
  }
  // If there is an file in the request, then create a URL for the avatar.
  if (req.file) {
    const baseUrl = 'http://localhost:8080';
    let avatarUrl = baseUrl + `/uploads/images/${req.file.filename}`;
    req.body.avatar = avatarUrl;
  }
  console.log("BODY:", req.body)

  res.status(200);
  res.json(await UserService.edit(req.body));
}

/**
 * Deletes a user account, requiring admin privileges.
 *
 * This function checks if the requester has admin rights before deleting a user.
 * If the user exists, it deletes them from the system.
 *
 * @async
 * @function deleteUser
 *
 * @param {Object} req - Express request object containing username to delete.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a response indicating success or failure of deletion.
 */
async function deleteUser(req, res) {
  const requester = await UserService.getByUsername(req.user.username);
  if (requester.admin === false) {
    return res.sendStatus(403);
  }

  if (!req.body.username) {
    res.status(400);
    res.send('Username not provided.');
    return;
  }

  const target = await UserService.getByUsername(req.body.username);
  if (!target) {
    res.status(404);
    res.send('User does not exist.');
    return;
  }

  const deleted_count = await UserService.deleteUser(req.body.username);
  if (deleted_count) {
    res.status(200);
    res.send('User deleted successfully.');
  } else {
    res.status(400);
    res.send('Error. User not deleted.');
  }
}

/**
 * Retrieves the details of the currently authenticated user.
 *
 * This function fetches user details based on the username stored in the
 * authentication token and returns them if found.
 *
 * @async
 * @function getUsername
 *
 * @param {Object} req - Express request object containing the username.
 * @param {Object} res - Express response object for sending responses.
 *
 * @returns {void} Sends a JSON response with user details or a 404 error if not found.
 */
async function getUsername(req, res) {
  const username = req.user.username;
  const user = await UserService.getByUsername(username);
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404).send('User not found.');
  }
}

/**
 * Handles an HTTP request to retrieve a paginated list of users from the database.
 *
 * This function checks if the requester has admin privileges before proceeding to retrieve users.
 * It supports pagination through `page` and `limit` query parameters and returns the user list,
 * total count of users, total pages, and current page. If the requester is not an admin, the 
 * function sends a 403 status code response.
 *
 * @async
 * @function getAll
 *
 * @param {Object} request
 * @param {Object} request.user
 * @param {Object} request.query
 * @param {number} [request.query.page=1]
 * @param {number} [request.query.limit=5]
 *
 * @param {Object} response
 *
 * @returns {void} Sends a JSON response containing the paginated list of users, total count, total pages,
 *                 and current page. Sends an error message in case of failure.
 *
 * @throws Will send a 403 status code if the requester is not an admin.
 *         Will send a 500 status code if the database operation fails.
 *
 * @example
 * Request URL:
 * // GET /users?page=2&limit=5
 *
 * // Successful Response:
 * // {
 * //   "users": [{ "id": "1", "name": "User 1" }, { "id": "2", "name": "User 2" }, ...],
 * //   "total": 100,
 * //   "totalPages": 20,
 * //   "currentPage": 2
 * // }
 */
async function getAll(req, res) {
  const requester = await UserService.getByUsername(req.user.username);

  if (requester.admin === false) {
    return res.sendStatus(403); // Forbidden
  }

  // Get page and limit from query parameters, with default values
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  try {
    // Call the service function with pagination parameters
    const { users, total } = await UserService.getAll(page, limit);

    res.json({
      users,
      total,                    // Total number of users in the system
      totalPages: Math.ceil(total / limit), // Total pages based on the limit
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports = {
  register,
  registerClient,
  approve,
  edit,
  deleteUser,
  getAll,
  getUsername
};
