const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Review = require('../models/Review');
const authMiddleware = require('../middleware/auth');

router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('author').notEmpty().withMessage('Author is required'),
    body('genre').notEmpty().withMessage('Genre is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, genre, description } = req.body;

    try {
      const book = new Book({ title, author, genre, description });
      await book.save();
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
    query('author').optional().trim(),
    query('genre').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 10, author, genre } = req.query;
    const query = {};
    if (author) query.author = { $regex: author, $options: 'i' };
    if (genre) query.genre = { $regex: genre, $options: 'i' };

    try {
      const books = await Book.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await Book.countDocuments(query);

      res.json({
        books,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const reviews = await Review.find({ book: req.params.id })
      .populate('user', 'username')
      .limit(10); // Paginate reviews (simplified)
    const averageRating = reviews.length
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ book, averageRating, reviews });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get(
  '/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, page = 1, limit = 10 } = req.query;
    const searchQuery = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
      ],
    };

    try {
      const books = await Book.find(searchQuery)
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await Book.countDocuments(searchQuery);

      res.json({
        books,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;