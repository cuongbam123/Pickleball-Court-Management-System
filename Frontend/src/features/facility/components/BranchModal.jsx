// features/facility/components/BranchModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button"; // Tận dụng luôn Button của bạn

const BranchModal = ({ open, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    hotline: "",
    open_time: "06:00",
    close_time: "23:00",
  });

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        name: initialData.name || "",
        address: initialData.address || "",
        hotline: initialData.hotline || "",
        open_time: initialData.open_time || "06:00",
        close_time: initialData.close_time || "23:00",
      });
    } else if (!initialData && open) {
      setFormData({ name: "", address: "", hotline: "", open_time: "06:00", close_time: "23:00" });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await onSubmit(formData);
    
    setIsLoading(false);
    if (success) {
      onClose(); 
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}
      description={isEditing ? "Chỉnh sửa thông tin cơ sở hiện tại" : "Điền thông tin để tạo cơ sở mới trên hệ thống"}
      hideFooter={true} // 👉 Ẩn footer mặc định để dùng footer của Form
    >
      {/* Bao bọc bằng thẻ form để xài type="submit" và required */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tên chi nhánh</label>
          <input
            required
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="VD: Pickleball STC Quận 2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ</label>
          <input
            required
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="VD: 456 Thảo Điền..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Hotline</label>
          <input
            required
            type="text"
            name="hotline"
            value={formData.hotline}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="VD: 0907654321"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ mở cửa</label>
            <input
              required
              type="time"
              name="open_time"
              value={formData.open_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ đóng cửa</label>
            <input
              required
              type="time"
              name="close_time"
              value={formData.close_time}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer tự custom cho Form */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end border-t border-slate-100 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            loading={isLoading}
          >
            {isEditing ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BranchModal;