const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/recipes/:id/reviews', verifyToken, reviewController.addReview);
router.put('/reviews/:id', verifyToken, reviewController.updateReview);
router.delete('/reviews/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
