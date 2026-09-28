const express = require('express');
const router = express.Router();
const followController = require('../controllers/follow.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/users/:id/follow', verifyToken, followController.followUser);
router.delete('/users/:id/follow', verifyToken, followController.unfollowUser);
router.get('/users/:id/followers', followController.getFollowers);
router.get('/users/:id/following', followController.getFollowing);
router.get('/users/:id/follow-status', verifyToken, followController.checkFollowStatus);

module.exports = router;
