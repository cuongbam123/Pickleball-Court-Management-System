const sharedMatchService = require("../services/sharedMatchService");

const createSharedMatch = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({ message: "Không tìm thấy userId trong token" });
    }

    const data = {
      ...req.body,
      user_id: userId,
    };

    const result = await sharedMatchService.createSharedMatch(data);

    return res.status(201).json({
      success: true,
      message: "Tạo ca sân ghép thành công",
      data: {
        booking_id: result.booking._id,
        shared_match_id: result.sharedMatch._id,
        status: result.sharedMatch.status,
        ticket_price: result.sharedMatch.ticket_price,
        max_slots: result.sharedMatch.max_slots,
        booked_slots: result.sharedMatch.booked_slots,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Tạo sân ghép thất bại",
    });
  }
};

const getSharedMatches = async (req, res) => {
  try {
    const result = await sharedMatchService.getSharedMatches(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lấy danh sách sân ghép thất bại",
    });
  }
};

const getSharedMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sharedMatchService.getSharedMatchById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sân ghép không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy thông tin sân ghép thành công",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lấy thông tin sân ghép thất bại",
    });
  }
};

const updateSharedMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await sharedMatchService.updateSharedMatch(id, data);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sân ghép không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật sân ghép thành công",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Cập nhật sân ghép thất bại",
    });
  }
};

const updateSharedMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await sharedMatchService.updateSharedMatchStatus(id, status);

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái ca ghép thành công",
      data: {
        _id: result._id,
        status: result.status,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Cập nhật trạng thái ca ghép thất bại",
    });
  }
};

const buySharedMatchTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await sharedMatchService.buySharedMatchTicket(
      id,
      userId,
      req.body,
      req,
    );

    return res.status(201).json({
      success: true,
      message: "Mua vé thành công",
      data: {
        ticket_id: result.ticket._id,
        shared_match_id: result.ticket.shared_match_id,
        payment_status: result.ticket.payment_status,
        ticket_price: result.sharedMatch.ticket_price,
        expires_at: result.ticket.expires_at,
        payment_url: result.payment.payment_url,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error_code: error.errorCode,
      message: error.message || "Mua vé thất bại",
    });
  }
};
const getSharedMatchTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sharedMatchService.getSharedMatchTicket(id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vé thành công",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Lấy danh sách vé thất bại",
    });
  }
};

const cancelSharedTicket = async (req, res) => {
  try {
    const result = await sharedMatchService.cancelSharedTicket(
      req.params.ticket_id,
      req.user,
    );

    return res.status(200).json({
      success: true,
      message: "Hủy vé thành công",
      data: {
        ticket_id: result.ticket._id,
        refund_action: result.refund_action,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Hủy vé thất bại",
    });
  }
};

module.exports = {
  createSharedMatch,
  getSharedMatches,
  getSharedMatchById,
  updateSharedMatch,
  updateSharedMatchStatus,
  buySharedMatchTicket,
  getSharedMatchTicket,
  cancelSharedTicket,
};
