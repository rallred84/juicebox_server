const express = require('express');
const apiRouter = express.Router();

const usersRouter = require('./users');
const postsRouter = require('./posts');
const tagsRouter = require('./tags');
apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/tags', tagsRouter);

apiRouter.get('/users', (req, res) => {
  console.log('hi');
});

module.exports = apiRouter;
