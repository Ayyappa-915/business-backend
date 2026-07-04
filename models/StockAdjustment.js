const mongoose = require('mongoose');

const stockAdjustmentSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    variantId: { type: String, required: true },
    type: { type: String, required: true, enum: ['add', 'subtract', 'set'] },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
