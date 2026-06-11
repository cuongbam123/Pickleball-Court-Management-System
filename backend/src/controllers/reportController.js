const reportService = require("../services/reportService");

const getDailyRevenue = async (req, res, next) => {
  try {
    const report = await reportService.getDailyRevenue(req.query, req.user);
    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const analytics = await reportService.getDashboardAnalytics(req.query, req.user);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

const syncRevenue = async (req, res, next) => {
  try {
    const { date } = req.body;
    await reportService.aggregateAndSaveRevenue(date);
    res.status(200).json({
      success: true,
      message: `Đồng bộ doanh thu thành công cho ngày ${date}`,
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await reportService.getTransactions(req.query, req.user);
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyRevenue,
  getDashboardAnalytics,
  syncRevenue,
  getTransactions,
};
