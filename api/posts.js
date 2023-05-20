const express = require('express');
const postsRouter = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getAllPosts, createPost, updatePost, getPostById } = require('../db');
const { requireUser, requireActiveUser } = require('./utils.js');

postsRouter.use((req, res, next) => {
  console.log('A request is being made to /posts');

  next();
});

//Get All Posts
postsRouter.get('/', async (req, res) => {
  try {
    const allPosts = await getAllPosts();

    //Will return all posts that are either active OR owned by the user
    const posts = allPosts.filter(
      (post) =>
        (post.active && post.author.active) || post.author.id === req.user?.id
    );

    res.send({
      posts,
    });
  } catch ({ name, message }) {
    next({ name, message });
  }
});

//Create a Post
postsRouter.post(
  '/',
  requireUser,
  requireActiveUser,
  async (req, res, next) => {
    const { title, content, tags = '' } = req.body;
    const tagArr = tags.trim().split(/\s+/);
    const postData = {};
    if (tagArr.length) {
      postData.tags = tagArr;
    }
    postData.authorId = req.user.id;
    postData.title = title;
    postData.content = content;

    const post = await createPost(postData);
    try {
      //  Need to set up more error scenarios

      if (post) {
        res.send({ success: true, post });
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  }
);

//Edit a Post
postsRouter.patch(
  '/:postId',
  requireUser,
  requireActiveUser,
  async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    const updateFields = {};

    if (tags && tags.length > 0) {
      updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
      updateFields.title = title;
    }

    if (content) {
      updateFields.content = content;
    }

    try {
      const originalPost = await getPostById(postId);

      if (originalPost.author.id === req.user.id) {
        const updatedPost = await updatePost(postId, updateFields);
        res.send({ success: true, post: updatedPost });
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: 'You cannot update a post that is not yours',
        });
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  }
);

//Delete a Post

postsRouter.delete(
  '/:postId',
  requireUser,
  requireActiveUser,
  async (req, res, next) => {
    try {
      const post = await getPostById(req.params.postId);
      console.log(post.author.id);
      console.log(req.user.id);

      if (post && post.author.id === req.user.id) {
        const deletedPost = await updatePost(post.id, {
          active: false,
        });

        res.send({ post: deletedPost });
      } else {
        next(
          post
            ? {
                success: false,
                name: 'UnauthorizedUserError',
                message:
                  'You cannot delete a post that you are not the author of',
              }
            : {
                success: false,
                name: 'PostNotFoundError',
                message: 'A post with that ID does not exist',
              }
        );
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  }
);

module.exports = postsRouter;
