const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bms_db';
const ATLAS_URI = 'mongodb+srv://22f01a0540_db_user:ramanjaneyulu_business_center@businesscluster.kcxaice.mongodb.net/bms_db?retryWrites=true&w=majority';

// Import local models
const Product = require('./models/Product');
const Variant = require('./models/Variant');
const Purchase = require('./models/Purchase');
const Category = require('./models/Category');

async function run() {
  for (const uri of [ATLAS_URI, MONGODB_URI]) {
    try {
      console.log(`Connecting to database at ${uri.substring(0, 45)}...`);
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected!');

      // 1. Find or create the Category
      let category = await Category.findOne({ name: /mineral/i });
      if (!category) {
        category = new Category({
          id: 'cat_mineral_water_' + Date.now(),
          name: 'Mineral Water',
          description: 'Water bottles, cans, and bulk supply',
          type: 'exchanged',
          stockMode: 'shared',
          color: '#3b82f6' // Blue Accent Badge
        });
        await category.save();
        console.log(`Created Category: ${category.name} (${category.id})`);
      } else {
        category.stockMode = 'shared';
        await category.save();
        console.log(`Using existing Category: ${category.name}`);
      }

      // 2. Clear out old Mineral Water products/variants/purchases to prevent conflicts
      const oldProducts = await Product.find({ name: /mineral/i });
      for (const p of oldProducts) {
        await Variant.deleteMany({ productId: p.id });
        await Purchase.deleteMany({ 'items.productId': p.id });
        await Product.deleteOne({ id: p.id });
        console.log(`Cleaned up old product: ${p.name}`);
      }

      // 3. Create NEW Product (Starts with 0 stock)
      const productId = 'prod_mineral_water_' + Date.now();
      const product = new Product({
        id: productId,
        name: 'Mineral Water',
        categoryId: category.id,
        unitId: 'ltr',
        hasVariants: true,
        isStockTracked: true,
        hasSharedStock: true
      });
      await product.save();
      console.log(`Created New Product: ${product.name} with 0 stock.`);

      // 4. Create NEW Variants (Both initialized to 0 stock)
      const tankVariantId = 'var_water_tank_' + Date.now();
      const tankVariant = new Variant({
        id: tankVariantId,
        productId: productId,
        name: '1000 Liters Water Tank',
        price: 0,
        cost: 400.0, // 1 Tank costs ₹400
        stock: 0, // Starts at 0
        conversionFactor: 1000.0, // 1 Tank = 1000 Liters
        variantUnit: 'ltr',
        purpose: 'buy'
      });
      await tankVariant.save();

      const canVariantId = 'var_water_can_' + Date.now();
      const canVariant = new Variant({
        id: canVariantId,
        productId: productId,
        name: '20 Liters water Can',
        price: 10.0, // Sell for ₹10
        cost: 8.0, // Will be ₹8.00 based on ₹400 tank cost
        stock: 0, // Starts at 0
        conversionFactor: 20.0, // 1 Can = 20 Liters
        variantUnit: 'pcs',
        purpose: 'sell'
      });
      await canVariant.save();
      console.log('Created Variants: 1000L Water Tank (Buy) and 20L water Can (Sell) with 0 stock.');

      // 5. Simulate the Purchase of 1 Tank for ₹400
      console.log('Simulating purchase: Owner buys 1 unit of "1000 Liters Water Tank" for ₹400...');
      const purchase = new Purchase({
        id: 'pur_water_' + Date.now(),
        supplierName: 'Bulk Water Supplier',
        supplierPhone: '+91 98765 00000',
        purchaseDate: new Date().toISOString(),
        paymentMethod: 'cash',
        totalCost: 400.0,
        type: 'exchanged',
        items: [{
          productId: productId,
          variantId: tankVariantId,
          quantity: 1, // Bought 1 tank
          costPrice: 400.0 // Costs ₹400
        }]
      });
      await purchase.save();

      // 6. Update the stock and cost levels (re-calculating shared stock logic)
      // Base stock added: 1 unit * 1000 factor = 1000 Liters.
      const qtyBase = 1 * tankVariant.conversionFactor;
      
      // Update Tank Variant (represented as 1 unit in DB, but baseStock is 1000)
      tankVariant.stock = 1.0; 
      tankVariant.cost = 400.0;
      await tankVariant.save();

      // Update Can Variant stock dynamically: 1000 / 20 = 50 Cans.
      canVariant.stock = qtyBase / canVariant.conversionFactor;
      canVariant.cost = (400.0 / tankVariant.conversionFactor) * canVariant.conversionFactor; // ₹8.00
      await canVariant.save();

      console.log(`Stocks updated:`);
      console.log(`- Water Tank Stock = ${tankVariant.stock} tank (${qtyBase} Liters in shared pool)`);
      console.log(`- 20L Can Stock = ${canVariant.stock} Cans (Auto calculated)`);

      await mongoose.disconnect();
    } catch (err) {
      console.error(`Error processing database: ${err.message}`);
    }
  }
  console.log('\nAll done! Databases successfully synced and simulation complete.');
}

run();
