const deliveryService = require('../services/deliveryService');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const deliveryController = {
  async getAll(req, res, next) {
    try {
      const { warehouse_id, status, stage, search } = req.query;
      const deliveries = await deliveryService.getAllDeliveries({
        warehouse_id: warehouse_id ? parseInt(warehouse_id, 10) : null,
        status,
        stage,
        search,
      });
      return sendSuccess(res, deliveries);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const delivery = await deliveryService.getDeliveryById(req.params.id);
      return sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const {
        delivery_number,
        customer_name,
        shipping_address,
        warehouse_id,
        source_warehouse_id,
        source_location_id,
        location_id,
        items = [],
      } = req.body;

      const resolvedWarehouseId = warehouse_id || source_warehouse_id;
      const defaultLocId = location_id || source_location_id;

      const normalizedItems = (items || []).map((item) => ({
        product_id: item.product_id,
        location_id: item.location_id || item.source_location_id || (defaultLocId ? parseInt(defaultLocId, 10) : undefined),
        quantity: item.quantity !== undefined ? item.quantity : item.quantity_ordered,
      }));

      const delivery = await deliveryService.createDelivery(
        {
          delivery_number,
          customer_name,
          shipping_address,
          warehouse_id: resolvedWarehouseId ? parseInt(resolvedWarehouseId, 10) : undefined,
          items: normalizedItems,
        },
        req.user.id
      );
      return sendSuccess(res, delivery, HTTP_STATUS.CREATED, 'Delivery order created in DRAFT status.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const updated = await deliveryService.updateDelivery(req.params.id, req.body);
      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Delivery order updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async pick(req, res, next) {
    try {
      const result = await deliveryService.pickDelivery(req.params.id);
      return sendSuccess(res, result, HTTP_STATUS.OK, 'Delivery order moved to PICKED stage.');
    } catch (error) {
      next(error);
    }
  },

  async pack(req, res, next) {
    try {
      const result = await deliveryService.packDelivery(req.params.id);
      return sendSuccess(res, result, HTTP_STATUS.OK, 'Delivery order moved to PACKED stage.');
    } catch (error) {
      next(error);
    }
  },

  async validate(req, res, next) {
    try {
      const result = await deliveryService.validateDelivery(req.params.id, req.user.id);
      return sendSuccess(
        res,
        result,
        HTTP_STATUS.OK,
        `Delivery order "${result.delivery_number}" validated successfully. Stock deducted and ledger updated.`
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = deliveryController;
