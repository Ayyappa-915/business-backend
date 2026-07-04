const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const StockAdjustment = require('../models/StockAdjustment');
const Unit = require('../models/Unit');

// Sync all data in a single request on startup
const syncAll = async (req, res) => {
  try {
    const categories = await Category.find({});
    const subcategories = await Subcategory.find({});
    const products = await Product.find({});
    const variants = await Variant.find({});
    const sales = await Sale.find({});
    const purchases = await Purchase.find({});
    const expenses = await Expense.find({});
    const adjustments = await StockAdjustment.find({});
    const units = await Unit.find({});

    res.json({
      categories,
      subcategories,
      products,
      variants,
      sales,
      purchases,
      expenses,
      adjustments,
      units
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CATEGORIES ---
const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ id: req.params.id });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- SUBCATEGORIES ---
const createSubcategory = async (req, res) => {
  try {
    const subcat = new Subcategory(req.body);
    await subcat.save();
    res.status(201).json(subcat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSubcategory = async (req, res) => {
  try {
    const subcat = await Subcategory.findOneAndDelete({ id: req.params.id });
    if (!subcat) return res.status(404).json({ message: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- PRODUCTS ---
const createProduct = async (req, res) => {
  const { product, variants } = req.body;
  try {
    const newProd = new Product(product);
    await newProd.save();

    const savedVariants = [];
    if (variants && variants.length > 0) {
      for (let vData of variants) {
        const v = new Variant(vData);
        await v.save();
        savedVariants.push(v);
      }
    }
    res.status(201).json({ product: newProd, variants: savedVariants });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  const { product, variants } = req.body;
  try {
    const updatedProd = await Product.findOneAndUpdate({ id: req.params.id }, product, { new: true });
    if (!updatedProd) return res.status(404).json({ message: 'Product not found' });

    // Update variants (delete old and re-insert or sync)
    await Variant.deleteMany({ productId: req.params.id });
    const savedVariants = [];
    if (variants && variants.length > 0) {
      for (let vData of variants) {
        const v = new Variant(vData);
        await v.save();
        savedVariants.push(v);
      }
    }
    res.json({ product: updatedProd, variants: savedVariants });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const prod = await Product.findOneAndDelete({ id: req.params.id });
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    await Variant.deleteMany({ productId: req.params.id });
    res.json({ message: 'Product and variants deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- UNITS ---
const createUnit = async (req, res) => {
  try {
    const unit = new Unit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findOneAndDelete({ id: req.params.id });
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- SALES ---
const createSale = async (req, res) => {
  try {
    const sale = new Sale(req.body);
    await sale.save();

    // Deduct stock levels atomically
    for (const item of sale.items) {
      const variant = await Variant.findOne({ id: item.variantId });
      if (!variant) continue;

      const product = await Product.findOne({ id: variant.productId });
      const isTracked = product?.isStockTracked !== false;
      if (!isTracked) continue;

      if (product.hasSharedStock) {
        const allProductVariants = await Variant.find({ productId: product.id });
        const baseVariant = allProductVariants.find(v => v.conversionFactor === 1) || allProductVariants[0];
        const qtyBase = item.quantity * variant.conversionFactor;

        // Deduct base stock
        baseVariant.stock -= qtyBase;
        await baseVariant.save();

        // Sync other variants
        for (const other of allProductVariants) {
          if (other.id !== baseVariant.id) {
            other.stock = baseVariant.stock / other.conversionFactor;
            await other.save();
          }
        }
      } else {
        // Independent stock deduction
        variant.stock -= item.quantity;
        await variant.save();
      }
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findOne({ id: req.params.id });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Refund stocks atomically
    for (const item of sale.items) {
      const variant = await Variant.findOne({ id: item.variantId });
      if (!variant) continue;

      const product = await Product.findOne({ id: variant.productId });
      const isTracked = product?.isStockTracked !== false;
      if (!isTracked) continue;

      if (product.hasSharedStock) {
        const allProductVariants = await Variant.find({ productId: product.id });
        const baseVariant = allProductVariants.find(v => v.conversionFactor === 1) || allProductVariants[0];
        const qtyBase = item.quantity * variant.conversionFactor;

        // Refund base stock
        baseVariant.stock += qtyBase;
        await baseVariant.save();

        // Sync others
        for (const other of allProductVariants) {
          if (other.id !== baseVariant.id) {
            other.stock = baseVariant.stock / other.conversionFactor;
            await other.save();
          }
        }
      } else {
        variant.stock += item.quantity;
        await variant.save();
      }
    }

    await Sale.deleteOne({ id: req.params.id });
    res.json({ message: 'Sale deleted and stocks refunded successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- PURCHASES ---
const createPurchase = async (req, res) => {
  try {
    const purchase = new Purchase(req.body);
    await purchase.save();

    // Exchanged items update stock levels
    if (purchase.type !== 'prepared') {
      for (const item of purchase.items) {
        const variant = await Variant.findOne({ id: item.variantId });
        if (!variant) continue;

        const product = await Product.findOne({ id: variant.productId });
        
        // Check if it's Live Hens
        const isHens = variant.name.toLowerCase().includes('hen') || 
                       variant.name.toLowerCase().includes('live') ||
                       product?.name.toLowerCase().includes('hen') ||
                       product?.name.toLowerCase().includes('live');

        if (product && product.hasSharedStock) {
          const allProductVariants = await Variant.find({ productId: product.id });
          const baseVariant = allProductVariants.find(v => v.conversionFactor === 1) || allProductVariants[0];
          const qtyBase = item.quantity * variant.conversionFactor;

          baseVariant.stock += qtyBase;
          await baseVariant.save();

          for (const other of allProductVariants) {
            if (other.id === variant.id) {
              other.cost = item.costPrice;
            }
            if (other.id !== baseVariant.id) {
              other.stock = baseVariant.stock / other.conversionFactor;
            }
            await other.save();
          }
        } else {
          // Independent stock
          if (isHens) {
            variant.stock += (item.pieces !== undefined ? item.pieces : Math.round(item.quantity / 3.33));
            variant.weightStock = (variant.weightStock || 0) + (item.weight !== undefined ? item.weight : item.quantity);
          } else {
            variant.stock += item.quantity;
          }
          variant.cost = item.costPrice;
          await variant.save();
        }
      }
    }

    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ id: req.params.id });
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    // Deduct/revert added stock
    if (purchase.type !== 'prepared') {
      for (const item of purchase.items) {
        const variant = await Variant.findOne({ id: item.variantId });
        if (!variant) continue;

        const product = await Product.findOne({ id: variant.productId });
        const isHens = variant.name.toLowerCase().includes('hen') || 
                       variant.name.toLowerCase().includes('live') ||
                       product?.name.toLowerCase().includes('hen') ||
                       product?.name.toLowerCase().includes('live');

        if (product && product.hasSharedStock) {
          const allProductVariants = await Variant.find({ productId: product.id });
          const baseVariant = allProductVariants.find(v => v.conversionFactor === 1) || allProductVariants[0];
          const qtyBase = item.quantity * variant.conversionFactor;

          baseVariant.stock -= qtyBase;
          await baseVariant.save();

          for (const other of allProductVariants) {
            if (other.id !== baseVariant.id) {
              other.stock = baseVariant.stock / other.conversionFactor;
              await other.save();
            }
          }
        } else {
          if (isHens) {
            variant.stock -= (item.pieces !== undefined ? item.pieces : Math.round(item.quantity / 3.33));
            variant.weightStock = Math.max(0, (variant.weightStock || 0) - (item.weight !== undefined ? item.weight : item.quantity));
          } else {
            variant.stock -= item.quantity;
          }
          await variant.save();
        }
      }
    }

    await Purchase.deleteOne({ id: req.params.id });
    res.json({ message: 'Purchase deleted and stock reverted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- ADJUSTMENTS ---
const createAdjustment = async (req, res) => {
  try {
    const adj = new StockAdjustment(req.body);
    await adj.save();

    const variant = await Variant.findOne({ id: adj.variantId });
    if (variant) {
      const product = await Product.findOne({ id: variant.productId });
      const isHens = variant.name.toLowerCase().includes('hen') || 
                     variant.name.toLowerCase().includes('live') ||
                     product?.name.toLowerCase().includes('hen') ||
                     product?.name.toLowerCase().includes('live');

      if (adj.type === 'add') {
        if (isHens) {
          variant.stock += adj.quantity;
          // Scale weight stock proportionally if average weight is known
          const avgWeight = variant.stock > 0 ? (variant.weightStock || 0) / (variant.stock - adj.quantity) : 2.25;
          variant.weightStock = (variant.weightStock || 0) + (adj.quantity * avgWeight);
        } else {
          variant.stock += adj.quantity;
        }
      } else if (adj.type === 'subtract') {
        if (isHens) {
          variant.stock = Math.max(0, variant.stock - adj.quantity);
          const avgWeight = (variant.stock + adj.quantity) > 0 ? (variant.weightStock || 0) / (variant.stock + adj.quantity) : 2.25;
          variant.weightStock = Math.max(0, (variant.weightStock || 0) - (adj.quantity * avgWeight));
        } else {
          variant.stock = Math.max(0, variant.stock - adj.quantity);
        }
      } else if (adj.type === 'set') {
        if (isHens) {
          const oldStock = variant.stock;
          variant.stock = adj.quantity;
          const avgWeight = oldStock > 0 ? (variant.weightStock || 0) / oldStock : 2.25;
          variant.weightStock = adj.quantity * avgWeight;
        } else {
          variant.stock = adj.quantity;
        }
      }
      await variant.save();
    }

    res.status(201).json(adj);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- EXPENSES ---
const createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- SLAUGHTER CONVERSION ---
const slaughterConversion = async (req, res) => {
  const { liveVariantId, fleshVariantId, hensCount, hensWeight, fleshWeight, fleshCost, logReason } = req.body;
  try {
    // 1. Deduct from Live Hens variant
    const live = await Variant.findOne({ id: liveVariantId });
    if (!live) return res.status(404).json({ message: 'Live Hens variant not found' });

    live.stock = Math.max(0, live.stock - hensCount);
    live.weightStock = Math.max(0, (live.weightStock || 0) - hensWeight);
    await live.save();

    // 2. Add to Chicken Flesh variant (Shared Stock base variant)
    const flesh = await Variant.findOne({ id: fleshVariantId });
    if (!flesh) return res.status(404).json({ message: 'Target Flesh variant not found' });

    // Flesh product should track shared stock, so scale all its variants relative to base conversionFactor = 1
    const fleshProd = await Product.findOne({ id: flesh.productId });
    const allFleshVariants = await Variant.find({ productId: flesh.productId });
    
    // Find base variant (conversionFactor === 1) or default to the target flesh variant
    const baseVariant = allFleshVariants.find(v => v.conversionFactor === 1) || flesh;
    const addedBaseQty = fleshWeight * (1 / (flesh.conversionFactor || 1)); // scale to base factor

    baseVariant.stock += addedBaseQty;
    // Set updated cost
    baseVariant.cost = fleshCost;
    await baseVariant.save();

    // Sync all linked variants in the shared pool
    for (const v of allFleshVariants) {
      if (v.id !== baseVariant.id) {
        v.stock = baseVariant.stock / v.conversionFactor;
        // Cost is base cost multiplied by conversionFactor
        v.cost = baseVariant.cost * v.conversionFactor;
        await v.save();
      }
    }

    // 3. Log Stock Adjustments for tracking audit
    const adjLive = new StockAdjustment({
      id: 'adj_live_' + Math.random().toString(36).substr(2, 9),
      productId: live.productId,
      variantId: live.id,
      type: 'subtract',
      quantity: hensCount,
      reason: logReason,
      date: new Date().toISOString()
    });
    await adjLive.save();

    const adjFlesh = new StockAdjustment({
      id: 'adj_flesh_' + Math.random().toString(36).substr(2, 9),
      productId: flesh.productId,
      variantId: flesh.id,
      type: 'add',
      quantity: fleshWeight,
      reason: `Result of slaughtering ${hensCount} Hens`,
      date: new Date().toISOString()
    });
    await adjFlesh.save();

    res.json({
      message: 'Slaughter transaction processed successfully',
      liveVariant: live,
      fleshVariant: baseVariant,
      adjustments: [adjLive, adjFlesh]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const importData = async (req, res) => {
  const { categories, subcategories, products, variants, sales, purchases, expenses, adjustments, units } = req.body;
  try {
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ message: 'Database already has data. Import aborted.' });
    }

    if (categories && categories.length > 0) {
      await Category.deleteMany({});
      await Category.insertMany(categories);
    }
    if (subcategories && subcategories.length > 0) {
      await Subcategory.deleteMany({});
      await Subcategory.insertMany(subcategories);
    }
    if (products && products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(products);
    }
    if (variants && variants.length > 0) {
      await Variant.deleteMany({});
      await Variant.insertMany(variants);
    }
    if (sales && sales.length > 0) {
      await Sale.deleteMany({});
      await Sale.insertMany(sales);
    }
    if (purchases && purchases.length > 0) {
      await Purchase.deleteMany({});
      await Purchase.insertMany(purchases);
    }
    if (expenses && expenses.length > 0) {
      await Expense.deleteMany({});
      await Expense.insertMany(expenses);
    }
    if (adjustments && adjustments.length > 0) {
      await StockAdjustment.deleteMany({});
      await StockAdjustment.insertMany(adjustments);
    }
    if (units && units.length > 0) {
      await Unit.deleteMany({});
      await Unit.insertMany(units);
    }

    res.json({ message: 'Data imported and migrated successfully into MongoDB!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSubcategory = async (req, res) => {
  try {
    const subcat = await Subcategory.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!subcat) return res.status(404).json({ message: 'Subcategory not found' });
    res.json(subcat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const addVariant = async (req, res) => {
  try {
    const variant = new Variant(req.body);
    await variant.save();
    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateVariant = async (req, res) => {
  try {
    const variant = await Variant.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteVariant = async (req, res) => {
  try {
    const variant = await Variant.findOneAndDelete({ id: req.params.id });
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};
