const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    category: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
