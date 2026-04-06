// features/facility/components/CourtModal.jsx
import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

const CourtModal = ({ open, onClose, onSubmit, initialData, branches }) => {
  const isEditing = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  
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
    } else if (!initialData && open) {
      setFormData({ 
        branch_id: branches.length > 0 ? branches[0]._id : "", 
        name: "", 
        type: "2-player" 
      });
    }
  }, [initialData, open, branches]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.branch_id) return alert("Vui lòng chọn chi nhánh!");

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
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none disabled:bg-slate-100"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tên sân</label>
          <input
            required
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            placeholder="VD: Sân 01 - VIP"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Loại sân</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
          >
            <option value="2-player">Sân Đôi (2 Người)</option>
            <option value="4-player">Sân Bốn (4 Người)</option>
          </select>
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