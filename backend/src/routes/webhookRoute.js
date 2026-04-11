const express = require('express');
const router = express.Router();
// Đảm bảo bạn đã import vnpayReturn từ controller
const { vnpayIpn, vnpayReturn } = require('../controllers/vnpayController');

// 1. Cửa cho IPN (Cập nhật DB ngầm - Cái này nãy bạn làm rồi)
router.get('/payment/vnpay', vnpayIpn);

// 2. Cửa cho Return (Hiển thị kết quả lên trình duyệt - CÁI ĐANG THIẾU ĐÂY)
router.get('/payment/vnpay-return', vnpayReturn); 

module.exports = router;