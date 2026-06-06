require('dotenv').config();
const connectDB = require('./config/db');
const reportService = require('./services/reportService');
const mongoose = require('mongoose');

const test = async () => {
  try {
    await connectDB();
    console.log("Connected to DB successfully!");

    const query = {
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    };
    const user = {
      role: "admin",
    };

    const results = await reportService.getTransactions(query, user);
    console.log("Query Results length:", results.length);
    if (results.length > 0) {
      console.log("First transaction item keys:", Object.keys(results[0]));
      console.log("First transaction breakdown:", results[0].breakdown);
      console.log("First transaction summary:", results[0].summary);
      console.log("First transaction cashier:", results[0].cashier);
    } else {
      console.log("No transactions found in this date range.");
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from DB");
  }
};

test();
