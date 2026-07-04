const mongoose = require('mongoose');

const subcategorySchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    categoryId: { type: String, required: true },
    name: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subcategory', subcategorySchema);
