const Category = require('../models/Category');
const { sendSuccess, sendError, HTTP_STATUS } = require('../utils/responseHandler');

const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await Category.findAll();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return sendError(res, 'Category not found.', HTTP_STATUS.NOT_FOUND);
      }
      return sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name || !name.trim()) {
        return sendError(res, 'Category name is required.', HTTP_STATUS.BAD_REQUEST);
      }

      const existing = await Category.findByName(name);
      if (existing) {
        return sendError(res, `Category "${name.trim()}" already exists.`, HTTP_STATUS.CONFLICT);
      }

      const category = await Category.create({ name, description });
      return sendSuccess(res, category, HTTP_STATUS.CREATED, 'Category created successfully.');
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { name, description } = req.body;
      const existing = await Category.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Category not found.', HTTP_STATUS.NOT_FOUND);
      }

      if (name && name.trim() !== existing.name) {
        const duplicate = await Category.findByName(name);
        if (duplicate && duplicate.id !== parseInt(req.params.id, 10)) {
          return sendError(res, `Category "${name.trim()}" already exists.`, HTTP_STATUS.CONFLICT);
        }
      }

      const updated = await Category.update(req.params.id, { name, description });
      return sendSuccess(res, updated, HTTP_STATUS.OK, 'Category updated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const existing = await Category.findById(req.params.id);
      if (!existing) {
        return sendError(res, 'Category not found.', HTTP_STATUS.NOT_FOUND);
      }

      const productCount = await Category.countProducts(req.params.id);
      if (productCount > 0) {
        return sendError(
          res,
          `Cannot delete category "${existing.name}": it is referenced by ${productCount} active products. Reassign products first.`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      await Category.delete(req.params.id);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Category deleted successfully.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = categoryController;
