// features/facility/components/BranchModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button"; // Tận dụng luôn Button của bạn
import clsx from "clsx";

const BranchModal = ({ open, onClose, onSubmit, initialData }) => {
  const isEditing = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
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
      setErrors({});
    } else if (!initialData && open) {
      setFormData({ name: "", address: "", hotline: "", open_time: "06:00", close_time: "23:00" });
      setErrors({});
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên chi nhánh.";
    if (!formData.address.trim()) nextErrors.address = "Vui lòng nhập địa chỉ.";
    if (!/^\d{9,11}$/.test(formData.hotline.trim())) {
      nextErrors.hotline = "Hotline cần 9-11 chữ số.";
    }
    if (!formData.open_time) nextErrors.open_time = "Vui lòng chọn giờ mở cửa.";
    if (!formData.close_time) nextErrors.close_time = "Vui lòng chọn giờ đóng cửa.";
    if (formData.open_time && formData.close_time && formData.open_time >= formData.close_time) {
      nextErrors.close_time = "Giờ đóng cửa phải sau giờ mở cửa.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
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
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2",
              errors.name
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200"
                : "border-slate-300 focus:border-lime-400 focus:ring-lime-100",
            )}
            placeholder="VD: Pickleball STC Quận 2"
          />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2",
              errors.address
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200"
                : "border-slate-300 focus:border-lime-400 focus:ring-lime-100",
            )}
            placeholder="VD: 456 Thảo Điền..."
          />
          {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Hotline</label>
          <input
            type="text"
            name="hotline"
            value={formData.hotline}
            onChange={handleChange}
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2",
              errors.hotline
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200"
                : "border-slate-300 focus:border-lime-400 focus:ring-lime-100",
            )}
            placeholder="VD: 0907654321"
          />
          {errors.hotline ? (
            <p className="mt-1 text-xs text-red-600">{errors.hotline}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Chỉ nhập số, không có khoảng trắng hoặc ký tự đặc biệt.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ mở cửa</label>
            <input
              type="time"
              name="open_time"
              value={formData.open_time}
              onChange={handleChange}
              className={clsx(
                "w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2",
                errors.open_time
                  ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-lime-400 focus:ring-lime-100",
              )}
            />
            {errors.open_time ? <p className="mt-1 text-xs text-red-600">{errors.open_time}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ đóng cửa</label>
            <input
              type="time"
              name="close_time"
              value={formData.close_time}
              onChange={handleChange}
              className={clsx(
                "w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2",
                errors.close_time
                  ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-200"
                  : "border-slate-300 focus:border-lime-400 focus:ring-lime-100",
              )}
            />
            {errors.close_time ? <p className="mt-1 text-xs text-red-600">{errors.close_time}</p> : null}
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