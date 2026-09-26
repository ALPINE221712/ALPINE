const Warehouse = require('../models/Warehouse');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHandler');

const warehouseController = {
  async getAll(req, res, next) {
    try {
      const warehouses = await Warehouse.findAll();
      return sendSuccess(res, warehouses);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const warehouse = await Warehouse.findById(req.params.id);
      if (!warehouse) {
        return sendError(res, 'Warehouse not found.', HTTP_STATUS.NOT_FOUND);
      }
      return sendSuccess(res, warehouse);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, code, address, status } = req.body;
      if (!name || !name.trim()) {
        return sendError(res, 'Warehouse name is required.', HTTP_STATUS.BAD_REQUEST);
      }
      if (!code || !code.trim()) {
        return sendError(res, 'Warehouse code is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const existing = await Warehouse.findByCode(code);
      if (existing) {
        return sendError(res, `Warehouse code "${code.trim().toUpperCase()}" is already in use.`, HTTP_STATUS.CONFLICT);
      }

      const warehouse = await Warehouse.create({ name, code, address, status });
      return sendSuccess(res, warehouse, HTTP_STATUS.CREATED, 'Warehouse created successfully.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, code, address, status } = req.body;
      const existing = await Warehouse.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Warehouse not found.', HTTP_STATUS.NOT_FOUND);
      }

      if (code && code.trim().toUpperCase() !== existing.code) {
        const duplicate = await Warehouse.findByCode(code);
        if (duplicate && duplicate.id !== parseInt(req.params.id, 10)) {
          return sendError(res, `Warehouse code "${code.trim().toUpperCase()}" is already in use.`, HTTP_STATUS.CONFLICT);
        }
      }

      const updated = await Warehouse.update(req.params.id, { name, code, address, status });
      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Warehouse updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Warehouse.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Warehouse not found.', HTTP_STATUS.NOT_FOUND);
      }

      const locationCount = await Warehouse.countLocations(req.params.id);
      if (locationCount > 0) {
        return sendError(
          res,
          `Cannot delete warehouse "${existing.name}": it contains ${locationCount} storage locations. Remove locations first.`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await Warehouse.delete(req.params.id);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Warehouse deleted successfully.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = warehouseController;
