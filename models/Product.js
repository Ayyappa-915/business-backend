const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    categoryId: { type: String, required: true },
    subcategoryId: { type: String },
    unitId: { type: String, required: true },
    hasVariants: { type: Boolean, required: true, default: false },
    isStockTracked: { type: Boolean, required: true, default: true },
    hasSharedStock: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
