const mongoose = require('mongoose');

const unitSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },
    isDecimalAllowed: { type: Boolean, required: true, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unit', unitSchema);
