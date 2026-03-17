# Pickleball-Court-Management-System
# 1. Phân quyền Người dùng (User Roles)
Hệ thống xoay quanh 3 nhóm người dùng chính:
→ Chủ sân (Admin/Super Admin): Quản lý toàn quyền, xem báo cáo doanh thu, thiết lập cấu hình giá, chi nhánh, phân quyền nhân viên, tạo giải đấu và sân ghép.
→ Nhân viên/Lễ tân (Staff): Thao tác nghiệp vụ hàng ngày: Nhận khách, tạo lịch đặt sân offline, bán hàng (POS), thanh toán, cập nhật trạng thái sân.
→ Người chơi (Customer): Đăng nhập, xem lịch trống, đặt sân online (có cọc), xem thứ hạng (Rank), điểm tích lũy và đăng ký giải đấu.
# 2. Yêu cầu Chức năng (Functional Requirements)
# Module 1: Quản lý Tài khoản & Xác thực (Authentication)
→ Đăng ký/Đăng nhập: Hỗ trợ đăng nhập bằng Email/Password hoặc Google/Facebook.
→ Hồ sơ người chơi (Profile): Hiển thị thông tin cá nhân, Lịch sử đặt sân, Điểm thành viên (dựa trên chi tiêu) và Hạng kỹ năng - Rank (4 cấp độ).
→ Quản lý nhân sự (Chỉ Admin): Thêm, sửa, xóa tài khoản Nhân viên và phân bổ về các chi nhánh cụ thể.
# Module 2: Quản lý Cơ sở vật chất (Facility Management)
→ Quản lý Chi nhánh: Thêm/sửa thông tin các cơ sở (Địa chỉ, hotline, giờ hoạt động).
→ Quản lý Sân bãi: Định nghĩa số lượng sân tại mỗi chi nhánh. Phân loại sân: Sân 2 người, Sân 4 người.
→ Cấu hình Giá: Thiết lập giá linh hoạt theo loại sân, theo khung giờ (Giờ vàng, Giờ thường) và ngày lễ/cuối tuần.
# Module 3: Lịch và Đặt sân (Booking & Scheduling)
→ Lịch trực quan (Booking Calendar): Hiển thị lưới thời gian (time-grid) theo từng ngày. Có màu sắc phân biệt trạng thái: Trống, Đã cọc (Online), Đã giữ (Offline), Đang chơi, Bảo trì.
→ Quy tắc Đặt sân: Khách hàng chọn giờ, chọn sân, hệ thống tạm giữ chỗ trong 10 phút để thanh toán cọc.
→ Hỗ trợ thời gian đệm (Buffer time): Tự động cộng thêm 5-10 phút giữa 2 ca để dọn sân (không khóa hẳn 1 tiếng).
→ Nghiệp vụ Sân ghép (Sân 10 người/Hỗn hợp): Chỉ Admin/Lễ tân mới có quyền tạo "Ca chơi ghép". Khách hàng nhìn thấy ca này trên web và mua "Vé lẻ" (tối đa 10 vé/ca).
→ Hủy đặt sân: Cho phép khách hủy trước X giờ (do admin cài đặt) để được hoàn cọc/lưu cọc.
Module 4: POS & Thanh toán (Billing & POS)
→ Bán lẻ/Dịch vụ: Tích hợp giao diện POS tại quầy cho Lễ tân để bán nước, bóng, cho thuê vợt, thuê giày... cộng dồn vào hóa đơn tiền sân.
→ Tính tiền & Trả sân: Hệ thống tự động tính: (Tiền thuê sân + Tiền dịch vụ POS) - Tiền cọc = Tổng cần thu.
→ Thanh toán: Tích hợp cổng thanh toán online (VNPay/Momo/Chuyển khoản QR code) cho việc Đặt cọc và Thanh toán tại quầy.
Module 5: Cấp bậc & Chăm sóc khách hàng (Loyalty & Ranking System)
→ Hệ thống Điểm thành viên (Loyalty Points): Tích lũy dựa trên số tiền chi tiêu (thuê sân, mua nước). Dùng để đổi voucher hoặc nâng hạng thẻ (Bạc, Vàng, Kim Cương) để nhận chiết khấu.
→ Hệ thống Hạng kỹ năng (Skill Rank): Chia làm 4 hạng (VD: D - Tập sự, C - Phong trào, B - Bán chuyên, A - Chuyên nghiệp). Hạng này không tăng qua việc thuê sân, mà chỉ được cập nhật qua 2 cách:
- Admin đánh giá và thiết lập thủ công (Khi khách đến test trình độ).
- Hệ thống tự động cộng/trừ điểm elo khi tham gia Giải đấu nội bộ.
# Module 6: Tổ chức Giải đấu (Tournament Management)
→ Tạo giải đấu (Admin): Tạo trang thông tin giải đấu, điều kiện tham gia (VD: Chỉ dành cho Rank C), lệ phí, số lượng tối đa.
→ Đăng ký tham gia (Customer): Hệ thống validate thứ hạng (chỉ cho phép user có Rank bằng hoặc chênh lệch tối đa 1 bậc so với yêu cầu). Có tính năng đóng phí đăng ký.
→ Cập nhật kết quả: Cập nhật kết quả trận đấu, hệ thống tự động tính toán để thăng hạng/cộng điểm kỹ năng cho người chiến thắng.
# 3. Yêu cầu Phi chức năng (Non-Functional Requirements)
→ Giao diện (UI/UX): Responsive (hiển thị tốt trên cả PC cho Lễ tân và Mobile cho Khách hàng đặt sân).
→ Hiệu năng: Tốc độ tải trang dưới 3s. Lịch đặt sân cần cập nhật theo thời gian thực (Real-time bằng Socket.io).
→ Bảo mật: Mã hóa mật khẩu người dùng (Bcrypt). Bảo mật API bằng JWT. Không lưu trực tiếp thông tin thẻ tín dụng của khách.