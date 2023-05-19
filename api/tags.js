const express = require('express');
const tagsRouter = express.Router();

const { getAllTags, getPostsByTagName } = require('../db');

tagsRouter.use((req, res, next) => {
  console.log('A request is being made to /tags');

  next();
});

tagsRouter.get('/', async (req, res) => {
  const tags = await getAllTags();

  res.send(tags);
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
  const { tagName } = req.params;

  try {
    const allPosts = await getPostsByTagName(tagName);
    const posts = allPosts.filter(
      (post) => post.active || post.author.id === req.user?.id
    );

    if (posts.length > 0) {
      res.send(posts);
    } else {
      next({
        name: 'TagNameDoesNotExist',
        message: 'This Tag name does not exist, try another.',
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = tagsRouter;
