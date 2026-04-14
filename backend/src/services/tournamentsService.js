const Tournaments = require("../models/tournaments");

const createTournament = async (tournamentData) => {
  const {
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    end_date,
    location,
    branch_id, // Thêm branch_id cho giải đấu
  } = tournamentData;

  // Kiểm tra xem giải đấu đã tồn tại chưa
  const existingTournament = await Tournaments.findOne({ name });
  if (existingTournament) {
    throw new Error("Giải đấu với tên này đã tồn tại");
  }

  // Nếu không có branch_id, gán giá trị mặc định (ví dụ lấy id chi nhánh mặc định từ cơ sở dữ liệu)
  if (!branch_id) {
    throw new Error("Chi nhánh (branch_id) là bắt buộc!");
  }

  // Tạo giải đấu mới
  const tournament = new Tournaments({
    name,
    required_rank,
    entry_fee,
    max_participants,
    start_date,
    end_date,
    location,
    branch_id, // Gán branch_id vào dữ liệu
    current_participants: 0,
    status: "open_registration", // Trạng thái ban đầu là mở đăng ký
  });

  // Lưu giải đấu vào cơ sở dữ liệu
  await tournament.save();

  return tournament; // Trả về giải đấu vừa tạo
};

const getTournaments = async (query) => {
  const { status, required_rank, branch_id, page = 1, limit = 10 } = query;
  const filter = { is_deleted: false };

  if (status) {
    filter.status = status;
  }
  if (required_rank) {
    filter.required_rank = required_rank;
  }
  if (branch_id) {
    filter.branch_id = branch_id;
  }

  const tournaments = await Tournaments.find(filter)
    .skip((page - 1) * limit) // Tính toán bỏ qua số lượng đã xem
    .limit(limit); // Giới hạn số lượng kết quả trả về

  const totalItems = await Tournaments.countDocuments(filter); // Tổng số giải đấu thỏa mãn filter
  const totalPages = Math.ceil(totalItems / limit); // Tính tổng số trang

  return {
    tournaments,
    meta: {
      currentPage: page,
      totalPages,
      totalItems,
    },
  };
};

module.exports = {
  createTournament,
  getTournaments,
};
