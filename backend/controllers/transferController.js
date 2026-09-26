const transferService = require('../services/transferService');
const Location = require('../models/Location');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const transferController = {
  async getAll(req, res, next) {
    try {
      const { source_warehouse_id, destination_warehouse_id, status, search } = req.query;
      const transfers = await transferService.getAllTransfers({
        source_warehouse_id: source_warehouse_id ? parseInt(source_warehouse_id, 10) : null,
        destination_warehouse_id: destination_warehouse_id ? parseInt(destination_warehouse_id, 10) : null,
        status,
        search,
      });
      return sendSuccess(res, transfers);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const transfer = await transferService.getTransferById(req.params.id);
      return sendSuccess(res, transfer);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      let {
        transfer_number,
        source_warehouse_id,
        source_location_id,
        destination_warehouse_id,
        destination_location_id,
        reason,
        items = [],
      } = req.body;

      // Auto-resolve warehouses from locations if not explicitly supplied
      if (!source_warehouse_id && source_location_id) {
        const srcLoc = await Location.findById(source_location_id);
        if (srcLoc) source_warehouse_id = srcLoc.warehouse_id;
      }

      if (!destination_warehouse_id && destination_location_id) {
        const destLoc = await Location.findById(destination_location_id);
        if (destLoc) destination_warehouse_id = destLoc.warehouse_id;
      }

      const normalizedItems = (items || []).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity !== undefined ? item.quantity : (item.quantity_transferred || item.quantity_ordered),
      }));

      const transfer = await transferService.createTransfer(
        {
          transfer_number,
          source_warehouse_id: source_warehouse_id ? parseInt(source_warehouse_id, 10) : undefined,
          source_location_id: source_location_id ? parseInt(source_location_id, 10) : undefined,
          destination_warehouse_id: destination_warehouse_id ? parseInt(destination_warehouse_id, 10) : undefined,
          destination_location_id: destination_location_id ? parseInt(destination_location_id, 10) : undefined,
          reason,
          items: normalizedItems,
        },
        req.user.id
      );

      return sendSuccess(res, transfer, HTTP_STATUS.CREATED, 'Internal transfer order created in DRAFT status.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await transferService.updateTransfer(req.params.id, req.body);
      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Transfer order updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async validate(req, res, next) {
    try {
      const result = await transferService.validateTransfer(req.params.id, req.user.id);
      return sendSuccess(
        res,
        result,
        HTTP_STATUS.OK,
        `Internal transfer "${result.transfer_number}" validated successfully. Dual movements recorded.`
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = transferController;
