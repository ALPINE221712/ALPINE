const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHandler');

const locationController = {
  async getAll(req, res, next) {
    try {
      const { warehouse_id } = req.query;
      const locations = await Location.findAll(warehouse_id || null);
      return sendSuccess(res, locations);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const location = await Location.findById(req.params.id);
      if (!location) {
        return sendError(res, 'Storage location not found.', HTTP_STATUS.NOT_FOUND);
      }
      return sendSuccess(res, location);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { warehouse_id, name, code, status } = req.body;
      if (!warehouse_id) {
        return sendError(res, 'Warehouse ID is required.', HTTP_STATUS.BAD_REQUEST);
      }
      if (!name || !name.trim()) {
        return sendError(res, 'Location name is required.', HTTP_STATUS.BAD_REQUEST);
      }
      if (!code || !code.trim()) {
        return sendError(res, 'Location code/bin is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const warehouse = await Warehouse.findById(warehouse_id);
      if (!warehouse) {
        return sendError(res, `Warehouse with ID ${warehouse_id} does not exist.`, HTTP_STATUS.BAD_REQUEST);
      }

      const existing = await Location.findByWarehouseAndCode(warehouse_id, code);
      if (existing) {
        return sendError(
          res,
          `Location code "${code.trim().toUpperCase()}" already exists in warehouse "${warehouse.name}".`,
          HTTP_STATUS.CONFLICT
        );
      }

      const location = await Location.create({ warehouse_id, name, code, status });
      return sendSuccess(res, location, HTTP_STATUS.CREATED, 'Storage location created successfully.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { warehouse_id, name, code, status } = req.body;
      const existing = await Location.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Storage location not found.', HTTP_STATUS.NOT_FOUND);
      }

      const targetWhId = warehouse_id || existing.warehouse_id;
      if (warehouse_id && warehouse_id !== existing.warehouse_id) {
        const wh = await Warehouse.findById(warehouse_id);
        if (!wh) {
          return sendError(res, `Warehouse with ID ${warehouse_id} does not exist.`, HTTP_STATUS.BAD_REQUEST);
        }
      }

      if (code && code.trim().toUpperCase() !== existing.code) {
        const duplicate = await Location.findByWarehouseAndCode(targetWhId, code);
        if (duplicate && duplicate.id !== parseInt(req.params.id, 10)) {
          return sendError(
            res,
            `Location code "${code.trim().toUpperCase()}" already exists in the target warehouse.`,
            HTTP_STATUS.CONFLICT
          );
        }
      }

      const updated = await Location.update(req.params.id, {
        warehouse_id: targetWhId,
        name: name !== undefined ? name : existing.name,
        code: code !== undefined ? code : existing.code,
        status: status !== undefined ? status : existing.status,
      });

      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Storage location updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Location.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Storage location not found.', HTTP_STATUS.NOT_FOUND);
      }

      const activeStock = await Location.countInventory(req.params.id);
      if (activeStock > 0) {
        return sendError(
          res,
          `Cannot delete location "${existing.code}": it currently contains ${activeStock} units of active physical stock. Relocate stock first.`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await Location.delete(req.params.id);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Storage location deleted successfully.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = locationController;
