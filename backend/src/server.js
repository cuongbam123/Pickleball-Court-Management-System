// const dotenv = require('dotenv');
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const expireBookingsJob = require('./jobs/expireBookingsJob');
const expireTournamentPaymentsJob = require('./jobs/expireTournamentPaymentsJob');
const autoRankJob = require('./jobs/autoRankJob');
const tournamentCron = require("./jobs/tournamentCron");


// dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Đã kết nối Database thành công.');

        expireBookingsJob();
        expireTournamentPaymentsJob();
        autoRankJob();
        tournamentCron();

        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động Server:', error.message);
        process.exit(1); 
    }
};

startServer();
