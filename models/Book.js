const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, unique:true },
  author: { type: String, required: true },
  genre: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);