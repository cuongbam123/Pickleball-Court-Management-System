// features/facility/components/CourtModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import clsx from "clsx";

const CourtModal = ({ open, onClose, onSubmit, initialData, branches }) => {
  const isEditing = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    branch_id: "",
    name: "",
    type: "2-player"
  });

  useEffect(() => {
    if (initialData && open) {
      // API Get Detail trả về branch_id là Object, ta lấy _id
      const branchId = typeof initialData.branch_id === 'object' 
        ? initialData.branch_id._id 
        : initialData.branch_id;

      setFormData({
        branch_id: branchId || "",
        name: initialData.name || "",
        type: initialData.type || "2-player"
      });
      setErrors({});
    } else if (!initialData && open) {
      setFormData({ 
        branch_id: branches.length > 0 ? branches[0]._id : "", 
        name: "", 
        type: "2-player" 
      });
      setErrors({});
    }
  }, [initialData, open, branches]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.branch_id) nextErrors.branch_id = "Vui lòng chọn chi nhánh.";
    if (!formData.name.trim()) nextErrors.name = "Vui lòng nhập tên sân.";
    if (!formData.type) nextErrors.type = "Vui lòng chọn loại sân.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    // Nếu tạo mới, API cần branchId trên URL, nếu update thì không.
    // Tôi đẩy cả branch_id ra để hàm cha xử lý.
    const success = await onSubmit(formData.branch_id, formData);
    setIsLoading(false);
    
    if (success) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Cập nhật sân" : "Thêm sân mới"}
      hideFooter={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Thuộc chi nhánh</label>
          <select
            name="branch_id"
            value={formData.branch_id}
            onChange={handleChange}
            disabled={isEditing} // Đang sửa thì ko cho đổi chi nhánh
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition disabled:bg-slate-100",
              errors.branch_id
                ? "border-red-300 bg-red-50/30"
                : "border-slate-300 focus:border-lime-400 focus:ring-2 focus:ring-lime-100",
            )}
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          {errors.branch_id ? <p className="mt-1 text-xs text-red-600">{errors.branch_id}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tên sân</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition",
              errors.name
                ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-lime-400 focus:ring-2 focus:ring-lime-100",
            )}
            placeholder="VD: Sân 01 - VIP"
          />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Loại sân</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={clsx(
              "w-full rounded-xl border px-3 py-2.5 outline-none transition",
              errors.type
                ? "border-red-300 bg-red-50/30"
                : "border-slate-300 focus:border-lime-400 focus:ring-2 focus:ring-lime-100",
            )}
          >
            <option value="2-player">Sân Đôi (2 Người)</option>
            <option value="4-player">Sân Bốn (4 Người)</option>
          </select>
          {errors.type ? <p className="mt-1 text-xs text-red-600">{errors.type}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {isEditing ? "Lưu thay đổi" : "Thêm sân"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CourtModal;