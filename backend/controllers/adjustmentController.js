const adjustmentService = require('../services/adjustmentService');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const adjustmentController = {
  async getAll(req, res, next) {
    try {
      const { location_id, product_id, status, search } = req.query;
      const adjustments = await adjustmentService.getAllAdjustments({
        location_id: location_id ? parseInt(location_id, 10) : null,
        product_id: product_id ? parseInt(product_id, 10) : null,
        status,
        search,
      });
      return sendSuccess(res, adjustments);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const adjustment = await adjustmentService.getAdjustmentById(req.params.id);
      return sendSuccess(res, adjustment);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const adjustment = await adjustmentService.createAdjustment(req.body, req.user.id);
      return sendSuccess(res, adjustment, HTTP_STATUS.CREATED, 'Stock adjustment created successfully in DRAFT state.');
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const adjustment = await adjustmentService.updateAdjustment(req.params.id, req.body);
      return sendSuccess(res, adjustment, HTTP_STATUS.OK, 'Stock adjustment updated successfully.');
    } catch (err) {
      next(err);
    }
  },

  async apply(req, res, next) {
    try {
      const result = await adjustmentService.applyAdjustment(req.params.id, req.user.id);
      return sendSuccess(
        res,
        result,
        HTTP_STATUS.OK,
        `Stock adjustment ${result.adjustment_number} applied successfully. Inventory reconciled.`
      );
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adjustmentController;
