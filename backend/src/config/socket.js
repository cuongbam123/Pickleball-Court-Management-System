const { Server } = require("socket.io");

let io = null;

const initSocket = (server) => {
  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected to Socket.io: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

/**
 * Helper to emit a booking change event
 * @param {string} action - 'create', 'update', or 'cancel'
 * @param {object} booking - the modified booking document
 */
const emitBookingChange = (action, booking) => {
  try {
    const ioInstance = getIO();
    ioInstance.emit("booking_change", {
      action,
      booking: {
        _id: booking._id,
        court_id: booking.court_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
      },
    });
    console.log(`📡 Broadcasted booking_change event: action=${action}, bookingId=${booking._id}`);
  } catch (error) {
    console.error("❌ Error emitting booking change socket event:", error.message);
  }
};

/**
 * Helper to emit a court tag/status update event
 * @param {object} court - the modified court document
 */
const emitCourtUpdate = (court) => {
  try {
    const ioInstance = getIO();
    ioInstance.emit("court_updated", {
      _id: court._id,
      name: court.name,
      branch_id: court.branch_id,
      status: court.status,
      tagStatus: court.tagStatus,
    });
    console.log(`📡 Broadcasted court_updated event for courtId=${court._id}`);
  } catch (error) {
    console.error("❌ Error emitting court update socket event:", error.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitBookingChange,
  emitCourtUpdate,
};
