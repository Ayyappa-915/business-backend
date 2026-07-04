const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    color: { type: String },
    type: { type: String, required: true, enum: ['prepared', 'exchanged'], default: 'exchanged' },
    stockMode: { type: String, enum: ['shared', 'independent'], default: 'independent' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
