import React, { useEffect, useState } from "react";
import clsx from "clsx";

const AdminStaffForm = ({
  user,
  branches = [],
  currentActorRole = "admin",
  onCancel,
  onSubmit,
}) => {
  const isManagerActor = currentActorRole === "manager";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    branch: "",
    rank: "",
    elo_score: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || "customer",
        loyalty_tier: user.loyalty_tier || "standard",
        branch:
          typeof user.branch_id === "object"
            ? user.branch_id?._id || ""
            : user.branch_id || "",
        rank: user.skill_rank || "", // Đảm bảo rank được điền đúng cho customer
        elo_score: user.elo_score || "", // Đảm bảo elo_score được điền đúng cho customer
      });
    }
  }, [user]);

  useEffect(() => {
    if (branches && branches.length > 0 && !formData.branch) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        branch: branches[0]._id,
      }));
    }
  }, [branches, formData.branch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !onSubmit) return;

    setIsSubmitting(true);
    try {
      const updatedData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        loyalty_tier: formData.loyalty_tier,
        branch_id: formData.branch || null,
        rank: formData.rank,
        elo_score: formData.elo_score,
      };
      await onSubmit(user._id, updatedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="text-sm text-slate-500">Không tìm thấy staff.</div>;
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Họ và tên
        </label>
        <input
          type="text"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          placeholder="Full Name"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Email"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Số điện thoại
        </label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="Phone"
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Vai trò
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          disabled={isManagerActor && user.role !== "staff"}
          className={clsx(
            "w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500",
            isManagerActor && user.role !== "staff" && "cursor-not-allowed bg-slate-100",
          )}
        >
          {isManagerActor ? (
            <>
              {user.role === "staff" ? (
                <>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </>
              ) : (
                <option value={user.role}>{user.role}</option>
              )}
            </>
          ) : (
            <>
              <option value="customer">Customer</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </>
          )}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Hạng thẻ thành viên
        </label>
        <select
          name="loyalty_tier"
          value={formData.loyalty_tier}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
        >
          <option value="standard">Standard</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="diamond">Diamond</option>
        </select>
      </div>

      {user.role === "customer" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Rank
          </label>
          <input
            type="text"
            name="rank"
            value={formData.rank}
            onChange={handleInputChange}
            placeholder="Rank"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
          />
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Elo Score
          </label>
          <input
            type="text"
            name="elo_score"
            value={formData.elo_score}
            onChange={handleInputChange}
            placeholder="Elo Score"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
      )}

      {(formData.role === "staff" || formData.role === "manager") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Chi nhánh
          </label>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleInputChange}
            disabled={isManagerActor}
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
        </button>
      </div>
    </form>
  );
};

export default AdminStaffForm;
