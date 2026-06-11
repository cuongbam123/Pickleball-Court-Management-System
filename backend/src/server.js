// const dotenv = require('dotenv');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const expireBookingsJob = require('./jobs/expireBookingsJob');
const expireSharedTicketsJob = require('./jobs/expireSharedTicketsJob');
const expireTournamentPaymentsJob = require('./jobs/expireTournamentPaymentsJob');
const autoRankJob = require('./jobs/autoRankJob');
const tournamentCron = require("./jobs/tournamentCron");
const revenueAggregationJob = require('./jobs/revenueAggregationJob');


// dotenv.config();

const http = require('http');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Đã kết nối Database thành công.');

        expireBookingsJob();
        expireSharedTicketsJob();
        expireTournamentPaymentsJob();
        autoRankJob();
        tournamentCron();
        revenueAggregationJob();

        const server = http.createServer(app);
        initSocket(server);

        server.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động Server:', error.message);
        process.exit(1); 
    }
};

startServer();
