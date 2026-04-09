const express = require('express');
const { vnpayIpn, vnpayReturn } = require('../controllers/vnpayController');

const router = express.Router();

router.get('/vnpay-ipn', vnpayIpn);

router.get('/vnpay-return', vnpayReturn);

module.exports = router;