const inventoryService = require('../services/inventoryService');
const { sendSuccess } = require('../utils/responseHandler');

const inventoryController = {
  async getAll(req, res, next) {
    try {
      const { product_id, location_id, warehouse_id } = req.query;
      const records = await inventoryService.getAllInventory({
        product_id: product_id ? parseInt(product_id, 10) : null,
        location_id: location_id ? parseInt(location_id, 10) : null,
        warehouse_id: warehouse_id ? parseInt(warehouse_id, 10) : null,
      });
      return sendSuccess(res, records);
    } catch (error) {
      next(error);
    }
  },

  async getByProduct(req, res, next) {
    try {
      const data = await inventoryService.getInventoryByProduct(req.params.productId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getByLocation(req, res, next) {
    try {
      const data = await inventoryService.getInventoryByLocation(req.params.locationId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req, res, next) {
    try {
      const items = await inventoryService.getLowStockAlerts();
      return sendSuccess(res, items);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = inventoryController;
