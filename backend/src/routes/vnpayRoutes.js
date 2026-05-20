const express = require('express');
const { optionalAuth } = require('../middlewares');
const { vnpayIpn, vnpayReturn, getPaymentStatus } = require('../controllers/vnpayController');

const router = express.Router();

router.get('/status/:txnRef', optionalAuth, getPaymentStatus);

router.get('/vnpay-ipn', vnpayIpn);

router.get('/vnpay-return', vnpayReturn);

module.exports = router;