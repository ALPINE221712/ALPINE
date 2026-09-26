const { withTransaction, pool } = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Location = require('../models/Location');
const Inventory = require('../models/Inventory');

const productService = {
  /**
   * List all products with optional search and filters
   */
  async getAllProducts({ search, category_id, status }) {
    return Product.findAll({ search, category_id, status });
  },

  /**
   * Get single product by ID with category info and location inventory breakdown
   */
  async getProductById(id) {
    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    const locations = await Product.findLocationBreakdown(id);

    return {
      ...product,
      locations,
    };
  },

  /**
   * Create a new SKU product with optional initial stock allocation
   */
  async createProduct({
    name,
    sku,
    category_id,
    unit_of_measure = 'Units',
    reorder_level = 0,
    status = 'ACTIVE',
    initial_stock = 0,
    initial_location_id = null,
  }) {
    if (!name || !name.trim()) {
      const err = new Error('Product name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!sku || !sku.trim()) {
      const err = new Error('Product SKU is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!category_id) {
      const err = new Error('Category ID is required.');
      err.statusCode = 400;
      throw err;
    }

    // Verify category exists
    const category = await Category.findById(category_id);
    if (!category) {
      const err = new Error(`Category with ID ${category_id} does not exist.`);
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate SKU
    const existingSku = await Product.findBySku(sku);
    if (existingSku) {
      const err = new Error(`SKU "${sku.trim().toUpperCase()}" is already assigned to another product.`);
      err.statusCode = 409;
      throw err;
    }

    const numInitialStock = parseFloat(initial_stock) || 0;
    if (numInitialStock < 0) {
      const err = new Error('Initial stock quantity cannot be negative.');
      err.statusCode = 400;
      throw err;
    }

    let targetLocationId = initial_location_id;

    // If initial stock is specified, resolve destination storage location
    if (numInitialStock > 0) {
      if (targetLocationId) {
        const loc = await Location.findById(targetLocationId);
        if (!loc) {
          const err = new Error(`Specified initial storage location ID ${targetLocationId} does not exist.`);
          err.statusCode = 400;
          throw err;
        }
        if (loc.status !== 'ACTIVE') {
          const err = new Error(`Specified storage location "${loc.code}" is inactive.`);
          err.statusCode = 400;
          throw err;
        }
      } else {
        // Fallback rule: Select the first active storage location in the system
        const [defaultLocations] = await pool.query(
          `SELECT id, name, code FROM locations WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1`
        );
        if (defaultLocations.length === 0) {
          const err = new Error('Cannot allocate initial stock: no active storage locations exist in the system.');
          err.statusCode = 400;
          throw err;
        }
        targetLocationId = defaultLocations[0].id;
      }
    }

    // Execute product and inventory creation inside a database transaction
    return withTransaction(async (conn) => {
      const productId = await Product.create(
        {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category_id,
          unit_of_measure: unit_of_measure.trim(),
          reorder_level: Math.max(0, parseFloat(reorder_level) || 0),
          status,
        },
        conn
      );

      if (numInitialStock > 0 && targetLocationId) {
        await Inventory.setQuantity(productId, targetLocationId, numInitialStock, conn);
      }

      // Return fully hydrated product
      const [newProductRows] = await conn.query(`
        SELECT 
          p.id, 
          p.name, 
          p.sku, 
          p.category_id, 
          c.name AS category_name,
          p.unit_of_measure, 
          p.reorder_level, 
          p.status, 
          p.created_at, 
          p.updated_at,
          COALESCE(SUM(i.quantity), 0) AS total_stock
        FROM products p
        INNER JOIN categories c ON c.id = p.category_id
        LEFT JOIN inventory i ON i.product_id = p.id
        WHERE p.id = ?
        GROUP BY p.id
      `, [productId]);

      return {
        ...newProductRows[0],
        total_stock: parseFloat(newProductRows[0].total_stock) || 0,
        reorder_level: parseFloat(newProductRows[0].reorder_level) || 0,
      };
    });
  },

  /**
   * Update existing product details
   */
  async updateProduct(id, { name, sku, category_id, unit_of_measure, reorder_level, status }) {
    const existing = await Product.findById(id);
    if (!existing) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    if (sku && sku.trim().toUpperCase() !== existing.sku) {
      const duplicate = await Product.findBySku(sku);
      if (duplicate && duplicate.id !== parseInt(id, 10)) {
        const err = new Error(`SKU "${sku.trim().toUpperCase()}" is already assigned to another product.`);
        err.statusCode = 409;
        throw err;
      }
    }

    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category) {
        const err = new Error(`Category with ID ${category_id} does not exist.`);
        err.statusCode = 400;
        throw err;
      }
    }

    return Product.update(id, {
      name: name !== undefined ? name.trim() : existing.name,
      sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
      category_id: category_id !== undefined ? category_id : existing.category_id,
      unit_of_measure: unit_of_measure !== undefined ? unit_of_measure.trim() : existing.unit_of_measure,
      reorder_level: reorder_level !== undefined ? Math.max(0, parseFloat(reorder_level) || 0) : existing.reorder_level,
      status: status !== undefined ? status : existing.status,
    });
  },

  /**
   * Delete product if no active stock
   */
  async deleteProduct(id) {
    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    if (product.total_stock > 0) {
      const err = new Error(`Cannot delete product "${product.name}": it has ${product.total_stock} units on hand across locations.`);
      err.statusCode = 400;
      throw err;
    }

    return Product.delete(id);
  },
};

module.exports = productService;
