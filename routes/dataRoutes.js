const express = require('express');
const router = express.Router();
const { protect, ownerOnly } = require('../middleware/auth');
const {
  syncAll,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createUnit,
  deleteUnit,
  createSale,
  updateSale,
  deleteSale,
  createPurchase,
  deletePurchase,
  createAdjustment,
  createExpense,
  updateExpense,
  deleteExpense,
  slaughterConversion,
  importData,
  addVariant,
  updateVariant,
  deleteVariant
} = require('../controllers/dataController');

// All data routes are protected
router.use(protect);

// Master Sync Route
router.get('/sync', syncAll);

// One-time Import Sync Route
router.post('/import', importData);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', ownerOnly, deleteCategory);

// Subcategories
router.post('/subcategories', createSubcategory);
router.put('/subcategories/:id', updateSubcategory);
router.delete('/subcategories/:id', deleteSubcategory);

// Products
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', ownerOnly, deleteProduct);

// Variants
router.post('/variants', addVariant);
router.put('/variants/:id', updateVariant);
router.delete('/variants/:id', deleteVariant);

// Units
router.post('/units', createUnit);
router.delete('/units/:id', deleteUnit);

// Sales
router.post('/sales', createSale);
router.put('/sales/:id', updateSale);
router.delete('/sales/:id', deleteSale);

// Purchases
router.post('/purchases', createPurchase);
router.delete('/purchases/:id', deletePurchase);

// Adjustments
router.post('/adjustments', createAdjustment);

// Expenses
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// Slaughter Conversion
router.post('/slaughter', slaughterConversion);

module.exports = router;
