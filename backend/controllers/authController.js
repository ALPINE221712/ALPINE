const authService = require('../services/authService');
const { setAuthCookie, clearAuthCookie } = require('../middleware/authMiddleware');
const { sendSuccess, HTTP_STATUS } = require('../utils/responseHandler');

const authController = {
  async signup(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const { user, token } = await authService.signup({ name, email, password, role });
      setAuthCookie(res, token);
      return sendSuccess(res, { user }, HTTP_STATUS.CREATED, 'Operator account created successfully.');
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login({ email, password });
      setAuthCookie(res, token);
      return sendSuccess(res, { user }, HTTP_STATUS.OK, 'Authenticated successfully.');
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      clearAuthCookie(res);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Logged out successfully.');
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      // req.user is set by requireAuth middleware
      return sendSuccess(res, { user: req.user });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return sendSuccess(res, result.dev_otp ? { dev_otp: result.dev_otp } : null, HTTP_STATUS.OK, result.message);
    } catch (error) {
      next(error);
    }
  },

  async verifyOtp(req, res, next) {
    try {
      const { email, otp } = req.body;
      await authService.verifyOtp(email, otp);
      return sendSuccess(res, null, HTTP_STATUS.OK, 'Verification code confirmed.');
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp, new_password } = req.body;
      const result = await authService.resetPassword(email, otp, new_password);
      return sendSuccess(res, null, HTTP_STATUS.OK, result.message);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
