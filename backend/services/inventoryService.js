const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Location = require('../models/Location');

const inventoryService = {
  /**
   * List inventory balances across products and locations
   */
  async getAllInventory({ product_id, location_id, warehouse_id }) {
    return Inventory.findAll({ product_id, location_id, warehouse_id });
  },

  /**
   * Get inventory balance breakdown for a specific product
   */
  async getInventoryByProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    const records = await Inventory.findByProductId(productId);
    return {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      total_stock: product.total_stock,
      locations: records,
    };
  },

  /**
   * Get inventory stored in a specific location
   */
  async getInventoryByLocation(locationId) {
    const location = await Location.findById(locationId);
    if (!location) {
      const err = new Error('Location not found.');
      err.statusCode = 404;
      throw err;
    }

    const records = await Inventory.findByLocationId(locationId);
    return {
      location_id: location.id,
      location_name: location.name,
      location_code: location.code,
      warehouse_name: location.warehouse_name,
      warehouse_code: location.warehouse_code,
      total_units: location.total_units,
      items: records,
    };
  },

  /**
   * Identify low-stock and out-of-stock products
   */
  async getLowStockAlerts() {
    return Inventory.findLowStock();
  },
};

module.exports = inventoryService;
