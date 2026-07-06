const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/bms_db';
const ATLAS_URI = 'mongodb+srv://22f01a0540_db_user:ramanjaneyulu_business_center@businesscluster.kcxaice.mongodb.net/bms_db?retryWrites=true&w=majority';

// Define schemas to match
const ProductSchema = new mongoose.Schema({
  id: String,
  name: String,
  hasVariants: Boolean,
  hasSharedStock: Boolean,
  isStockTracked: Boolean,
  unitId: String
});

const VariantSchema = new mongoose.Schema({
  id: String,
  productId: String,
  name: String,
  stock: Number,
  cost: Number,
  price: Number,
  conversionFactor: Number,
  purpose: String
});

const Product = mongoose.model('Product', ProductSchema);
const Variant = mongoose.model('Variant', VariantSchema);

async function run() {
  for (const uri of [ATLAS_URI, MONGODB_URI]) {
    try {
      console.log(`Connecting to database at ${uri.substring(0, 45)}...`);
      const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected!');

      // Find the product
      const product = await Product.findOne({ name: /mineral/i });
      if (!product) {
        console.log('No mineral water product found on this DB. Skipping.');
        await mongoose.disconnect();
        continue;
      }

      console.log(`Found product: ${product.name} (${product.id})`);

      // Find variants
      const variants = await Variant.find({ productId: product.id });
      console.log(`Found ${variants.length} variants.`);

      // Identify Tank (base) vs Can
      let tankVariant = variants.find(v => v.name.toLowerCase().includes('tank') || v.conversionFactor === 1000);
      let canVariant = variants.find(v => v.name.toLowerCase().includes('can') || v.conversionFactor === 20);

      if (!tankVariant && variants.length > 0) tankVariant = variants[0];
      if (!canVariant && variants.length > 1) canVariant = variants[1];

      if (tankVariant) {
        tankVariant.name = 'Water Tank (Liters)';
        tankVariant.conversionFactor = 1.0;
        tankVariant.stock = 1000.0; // Set stock to exactly 1000 Liters
        tankVariant.cost = 400.0 / 1000.0; // Cost is ₹0.40 per liter
        await tankVariant.save();
        console.log(`Updated Tank variant: ${tankVariant.name}, stock=1000.0, conversionFactor=1.0`);
      }

      if (canVariant) {
        canVariant.name = '20 Liters water Can';
        canVariant.conversionFactor = 20.0;
        canVariant.stock = 1000.0 / 20.0; // 50 Cans
        canVariant.cost = (400.0 / 1000.0) * 20.0; // ₹8.00 per Can
        await canVariant.save();
        console.log(`Updated Can variant: ${canVariant.name}, stock=50.0, conversionFactor=20.0`);
      }

      // Verify and re-save
      console.log('Database updated successfully for: ' + product.name);
      await mongoose.disconnect();
    } catch (err) {
      console.error(`Error with database: ${err.message}`);
    }
  }
}

run();
