const mongoose = require('mongoose');

const variantSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    cost: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    weightStock: { type: Number },
    conversionFactor: { type: Number, default: 1 },
    variantUnit: { type: String },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String },
    purpose: { type: String, enum: ['both', 'buy', 'sell'], default: 'both' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Variant', variantSchema);
