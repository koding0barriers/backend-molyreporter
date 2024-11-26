const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDatabase } = require("../dao/database");
const UserService = require("../services/UserService");

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "59m" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.status(401);
      res.send("Authentication Error: jwt expired");
      return;
    }
    req.user = user;
    next();
  });
}

async function login(req, res) {
  const user = await UserService.getByUsername(req.body.username);

  if (!user) {
    res.status(404);
    res.send("User not found.");
    return;
  }

  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(401);
    res.send("Incorrect password.");
    return;
  }

  if (user.approved === false) {
    res.status(403);
    res.send("Your user has not yet been approved by an admin.");
    return;
  }

  const accessToken = generateAccessToken({ username: req.body.username });
  const refreshToken = jwt.sign(
    { username: req.body.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const db = await connectDatabase();
  const refresh_collection = db.collection("refresh_tokens");
  await refresh_collection.insertOne({ token: refreshToken });

  res.json({ accessToken: accessToken, refreshToken: refreshToken });
}

async function refresh(req, res) {
  const refreshToken = req.body.token;
  if (refreshToken == null) return res.sendStatus(401);
  const db = await connectDatabase();
  const refresh_collection = db.collection("refresh_tokens");
  const valid = await refresh_collection.countDocuments({
    token: refreshToken,
  });
  if (!valid) return res.sendStatus(403);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken({ username: user.username });
    res.json({ accessToken: accessToken });
  });
}

async function logout(req, res) {
  const db = await connectDatabase();
  const refresh_collection = db.collection("refresh_tokens");
  await refresh_collection.deleteOne({ token: req.body.token });
  res.sendStatus(204);
}

module.exports = {
  login,
  logout,
  refresh,
  authenticateToken,
  getAccessToken,
};

// TODO: delete
function getAccessToken(user) {
  return generateAccessToken(user);
}
