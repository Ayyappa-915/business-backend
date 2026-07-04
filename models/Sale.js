const mongoose = require('mongoose');

const saleItemSchema = mongoose.Schema({
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true },
  customPrice: { type: Number }
});

const saleSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerName: { type: String },
    customerPhone: { type: String },
    saleDate: { type: String, required: true },
    paymentMethod: { type: String, required: true, enum: ['cash', 'upi', 'card', 'credit'] },
    paymentStatus: { type: String, required: true, enum: ['paid', 'unpaid', 'partial'], default: 'paid' },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    items: [saleItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
