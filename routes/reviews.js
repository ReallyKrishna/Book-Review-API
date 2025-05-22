const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');

router.post(
  '/:id/reviews',
  authMiddleware,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;

    try {
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const review = new Review({
        book: req.params.id,
        user: req.user.id,
        rating,
        comment,
      });

      await review.save();
      res.status(201).json(review);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'You have already reviewed this book' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, comment } = req.body;

    try {
      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (review.user.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this review' });
      }

      review.rating = rating;
      review.comment = comment;
      await review.save();

      res.json(review);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.remove();
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;