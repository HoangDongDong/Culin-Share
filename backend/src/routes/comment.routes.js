const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/recipes/:id/comments', commentController.getComments);
router.post('/recipes/:id/comments', verifyToken, commentController.addComment);
router.delete('/comments/:id', verifyToken, commentController.deleteComment);

module.exports = router;
