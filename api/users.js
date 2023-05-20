const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const SALT = 10;

const {
  getAllUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
} = require('../db');
const { requireUser } = require('./utils');

//Log Route
usersRouter.use((req, res, next) => {
  console.log('A request is being made to /users');
  next();
});

//Get All Users
usersRouter.get('/', async (req, res) => {
  const users = await getAllUsers();

  res.send({
    success: true,
    users,
  });
});

//Login Existing User
usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    next({
      success: false,
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password',
    });
  }

  try {
    const user = await getUserByUsername(username);
    let token;
    let passwordsMatch;

    if (user) {
      token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET
      );

      passwordsMatch = await bcrypt.compare(password, user.password);
    }

    if (!user || !passwordsMatch) {
      next({
        success: false,
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect',
      });
    }

    if (user && passwordsMatch) {
      res.send({
        success: true,
        message: "You're logged in",
        token,
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//Register New User
usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body;

  try {
    const _user = await getUserByUsername(username);

    if (_user) {
      next({
        success: false,
        name: 'UserExistsError',
        message: 'A user by that username already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT);

    const user = await createUser({
      username,
      password: hashedPassword,
      name,
      location,
    });

    const token = jwt.sign(
      {
        id: user.id,
        username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1w' }
    );

    res.send({
      message: 'Thank you for signing up',
      token,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

//Delete (Deactivate) User

usersRouter.delete('/:userId', requireUser, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await getUserById(userId);

    if (!user) {
      next({
        success: false,
        name: 'NoUserMatchesIdError',
        message:
          'Could not find a user that matched that ID, check ID and try again',
      });
    }

    if (!user.active) {
      next({
        success: false,
        name: 'UserAlreadyDeletedError',
        message: 'This account has already been deactivated',
      });
    }

    if (req.user.id === user.id) {
      const deletedUser = await updateUser(userId, { active: false });
      res.send({ success: true, user: deletedUser });
    } else {
      res.send({
        success: false,
        name: 'WrongUserError',
        message: 'You cannot delete account of other users',
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// Reactivate or Update User

usersRouter.patch('/:userId', requireUser, async (req, res, next) => {
  const user = await getUserById(req.params.userId);

  // If no user, send error
  if (!user) {
    res.send({
      success: false,
      name: 'NoUserFoundError',
      message: 'No user was found that matches this ID',
    });
  }

  // If user matches params userId
  if (user && user.id === req.user.id) {
    const active = req.body.active;
    //If currently deactivated user, can only change to active
    if (!user.active) {
      const reInstatedUser = await updateUser(user.id, { active: true });
      res.send({
        success: true,
        reInstatedUser,
      });
    }
    // If active user, can change all user settings EXCEPT for active
    // (That is handled by the DELETE path)
    if (user.active) {
      const updateFields = {};
      const { name, username, location, password } = req.body;

      if (name) {
        updateFields.name = name;
      }
      if (username) {
        updateFields.username = username;
      }
      if (location) {
        updateFields.location = location;
      }
      if (password) {
        hashedPassword = await bcrypt.hash(password, SALT);
        updateFields.password = hashedPassword;
      }

      const reInstatedUser = await updateUser(user.id, updateFields);
      res.send({
        success: true,
        reInstatedUser,
      });
    }
  } else {
    //If user does not match parms userId
    res.send({
      success: false,
      name: 'CannotModifyOtherUsersError',
      message: 'You cannot modify other users',
    });
  }

  try {
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = usersRouter;
