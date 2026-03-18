const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./src/config/db');


dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Đã kết nối Database thành công.');

        app.listen(PORT, () => {
            console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động Server:', error.message);
        process.exit(1); 
    }
};

startServer();