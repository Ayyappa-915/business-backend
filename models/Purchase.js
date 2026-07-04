const mongoose = require('mongoose');

const purchaseItemSchema = mongoose.Schema({
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  pieces: { type: Number },
  weight: { type: Number }
});

const purchaseSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    supplierName: { type: String },
    supplierPhone: { type: String },
    purchaseDate: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    totalCost: { type: Number, required: true },
    type: { type: String, required: true, enum: ['prepared', 'exchanged'], default: 'exchanged' },
    items: [purchaseItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
