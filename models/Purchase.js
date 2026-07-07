const mongoose = require('mongoose');

const purchaseItemSchema = mongoose.Schema({
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  pieces: { type: Number },
  weight: { type: Number }
});

const preparedItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  cost: { type: Number, required: true }
});

const freePurchaseItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  pieces: { type: Number },
  weight: { type: Number }
});

const purchaseSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    supplierName: { type: String },
    supplierPhone: { type: String },
    purchaseDate: { type: String, required: true },
    targetSalesDate: { type: String }, // Target sales date for prepared items profit matching
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String },
    totalCost: { type: Number }, // Keep for backward compatibility
    totalAmount: { type: Number }, // Match frontend Purchase interface
    type: { type: String, required: true, enum: ['prepared', 'exchanged'], default: 'exchanged' },
    categoryId: { type: String },
    notes: { type: String },
    items: [purchaseItemSchema],
    preparedItems: [preparedItemSchema],
    exchangedItems: [freePurchaseItemSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
