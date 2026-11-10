const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/recipes/:id/reviews', reviewController.getReviews);

router.post(
    '/recipes/:id/reviews',
    verifyToken,
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    },
    reviewController.addReview
);

router.put(
    '/reviews/:id',
    verifyToken,
    (req, res, next) => {
        upload.single('image')(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });
            next();
        });
    },
    reviewController.updateReview
);

router.delete('/reviews/:id', verifyToken, reviewController.deleteReview);

module.exports = router;
