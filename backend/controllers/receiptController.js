const receiptService = require('../services/receiptService');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const receiptController = {
  async getAll(req, res, next) {
    try {
      const { warehouse_id, status, search } = req.query;
      const receipts = await receiptService.getAllReceipts({
        warehouse_id: warehouse_id ? parseInt(warehouse_id, 10) : null,
        status,
        search,
      });
      return sendSuccess(res, receipts);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const receipt = await receiptService.getReceiptById(req.params.id);
      return sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        receipt_number,
        supplier_name,
        warehouse_id,
        destination_warehouse_id,
        location_id,
        destination_location_id,
        items = [],
      } = req.body;

      const resolvedWarehouseId = warehouse_id || destination_warehouse_id;
      const resolvedLocationId = location_id || destination_location_id;

      const normalizedItems = (items || []).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity !== undefined ? item.quantity : item.quantity_expected,
      }));

      const receipt = await receiptService.createReceipt(
        {
          receipt_number,
          supplier_name,
          warehouse_id: resolvedWarehouseId ? parseInt(resolvedWarehouseId, 10) : undefined,
          location_id: resolvedLocationId ? parseInt(resolvedLocationId, 10) : undefined,
          items: normalizedItems,
        },
        req.user.id
      );
      return sendSuccess(res, receipt, HTTP_STATUS.CREATED, 'Inbound receipt created in DRAFT status.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await receiptService.updateReceipt(req.params.id, req.body);
      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Receipt updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async validate(req, res, next) {
    try {
      const validated = await receiptService.validateReceipt(req.params.id, req.user.id);
      return sendSuccess(
        res,
        validated,
        HTTP_STATUS.OK,
        `Receipt "${validated.receipt_number}" validated successfully. Inventory incremented and ledger updated.`
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = receiptController;
