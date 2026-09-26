const StockMovement = require('../models/StockMovement');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHandler');

const ledgerController = {
  async getAll(req, res, next) {
    try {
      const {
        movement_type,
        product_id,
        warehouse_id,
        location_id,
        user_id,
        reference_type,
        from_date,
        to_date,
        search,
        limit = 100,
        offset = 0,
      } = req.query;

      const movements = await StockMovement.findAll({
        movement_type,
        product_id: product_id ? parseInt(product_id, 10) : null,
        warehouse_id: warehouse_id ? parseInt(warehouse_id, 10) : null,
        location_id: location_id ? parseInt(location_id, 10) : null,
        user_id: user_id ? parseInt(user_id, 10) : null,
        reference_type,
        from_date,
        to_date,
        search,
        limit: Math.min(parseInt(limit, 10) || 100, 500),
        offset: parseInt(offset, 10) || 0,
      });

      return sendSuccess(res, movements);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const movement = await StockMovement.findById(req.params.id);
      if (!movement) {
        return sendError(res, 'Stock ledger entry not found.', HTTP_STATUS.NOT_FOUND);
      }

      return sendSuccess(res, movement);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ledgerController;
