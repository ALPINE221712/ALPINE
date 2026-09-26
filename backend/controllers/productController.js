const productService = require('../services/productService');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const productController = {
  async getAll(req, res, next) {
    try {
      const { search, category_id, status } = req.query;
      const products = await productService.getAllProducts({
        search,
        category_id: category_id ? parseInt(category_id, 10) : null,
        status,
      });
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        name,
        sku,
        category_id,
        unit_of_measure,
        reorder_level,
        status,
        initial_stock,
        initial_location_id,
      } = req.body;

      const product = await productService.createProduct({
        name,
        sku,
        category_id: parseInt(category_id, 10),
        unit_of_measure,
        reorder_level,
        status,
        initial_stock,
        initial_location_id: initial_location_id ? parseInt(initial_location_id, 10) : null,
      });

      return sendSuccess(res, product, HTTP_STATUS.CREATED, 'Product created successfully.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, sku, category_id, unit_of_measure, reorder_level, status } = req.body;
      const updated = await productService.updateProduct(req.params.id, {
        name,
        sku,
        category_id: category_id ? parseInt(category_id, 10) : undefined,
        unit_of_measure,
        reorder_level,
        status,
      });

      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Product updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Product deleted successfully.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productController;
