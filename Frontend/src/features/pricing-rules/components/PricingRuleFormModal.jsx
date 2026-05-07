import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import SelectFilter from "../../../components/ui/Filter";
import {
  COURT_TYPE_OPTIONS,
  DAY_TYPE_OPTIONS,
  TIME_TYPE_OPTIONS,
} from "../constants/pricingRuleOptions";
import { isValidHHmm, timeToMinutes } from "../utils/pricingRuleFormat";

const INITIAL_FORM = {
  branch_id: "",
  court_type: "",
  day_type: "",
  time_type: "",
  start_time: "",
  end_time: "",
  price_per_hour: "",
};

const PricingRuleFormModal = ({
  open,
  mode = "create",
  initialData = null,
  branchOptions = [],
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (!initialData) {
      setForm(INITIAL_FORM);
      setErrors({});
      return;
    }

    setForm({
      branch_id: initialData.branch_id?._id || initialData.branch_id || "",
      court_type: initialData.court_type || "",
      day_type: initialData.day_type || "",
      time_type: initialData.time_type || "",
      start_time: initialData.start_time || "",
      end_time: initialData.end_time || "",
      price_per_hour: initialData.price_per_hour || "",
    });
    setErrors({});
  }, [open, initialData]);

  const title = mode === "edit" ? "Cập nhật cấu hình giá" : "Thêm cấu hình mới";

  const validate = () => {
    const nextErrors = {};

    if (!form.branch_id) nextErrors.branch_id = "Vui lòng chọn chi nhánh.";
    if (!form.court_type) nextErrors.court_type = "Vui lòng chọn loại sân.";
    if (!form.day_type) nextErrors.day_type = "Vui lòng chọn ngày áp dụng.";
    if (!form.time_type) nextErrors.time_type = "Vui lòng chọn khung giờ.";

    if (!isValidHHmm(form.start_time)) {
      nextErrors.start_time = "Giờ bắt đầu phải đúng định dạng HH:mm.";
    }
    if (!isValidHHmm(form.end_time)) {
      nextErrors.end_time = "Giờ kết thúc phải đúng định dạng HH:mm.";
    }

    const startMinutes = timeToMinutes(form.start_time);
    const endMinutes = timeToMinutes(form.end_time);
    if (Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && startMinutes >= endMinutes) {
      nextErrors.end_time = "Giờ bắt đầu phải nhỏ hơn giờ kết thúc.";
    }

    const price = Number(form.price_per_hour);
    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.price_per_hour = "Giá/giờ phải là số dương.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitLabel = useMemo(
    () => (mode === "edit" ? "Lưu thay đổi" : "Tạo cấu hình"),
    [mode],
  );

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      branch_id: form.branch_id,
      court_type: form.court_type,
      day_type: form.day_type,
      time_type: form.time_type,
      start_time: form.start_time,
      end_time: form.end_time,
      price_per_hour: Number(form.price_per_hour),
    };

    const result = await onSubmit(payload);
    if (result?.success) onClose();
  };

  return (
    <Modal open={open} title={title} onClose={onClose} hideFooter>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectFilter
            label="Chi nhánh"
            options={branchOptions}
            value={form.branch_id}
            onChange={(value) => handleInputChange("branch_id", value)}
            placeholder="Chọn chi nhánh"
          />
          <SelectFilter
            label="Loại sân"
            options={COURT_TYPE_OPTIONS}
            value={form.court_type}
            onChange={(value) => handleInputChange("court_type", value)}
            placeholder="Chọn loại sân"
          />
        </div>
        {errors.branch_id ? <p className="text-xs text-rose-500">{errors.branch_id}</p> : null}
        {errors.court_type ? <p className="text-xs text-rose-500">{errors.court_type}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <SelectFilter
            label="Ngày áp dụng"
            options={DAY_TYPE_OPTIONS}
            value={form.day_type}
            onChange={(value) => handleInputChange("day_type", value)}
            placeholder="Chọn ngày áp dụng"
          />
          <SelectFilter
            label="Khung giờ"
            options={TIME_TYPE_OPTIONS}
            value={form.time_type}
            onChange={(value) => handleInputChange("time_type", value)}
            placeholder="Chọn khung giờ"
          />
        </div>
        {errors.day_type ? <p className="text-xs text-rose-500">{errors.day_type}</p> : null}
        {errors.time_type ? <p className="text-xs text-rose-500">{errors.time_type}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ bắt đầu (HH:mm)</label>
            <input
              type="text"
              value={form.start_time}
              onChange={(e) => handleInputChange("start_time", e.target.value)}
              placeholder="08:00"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {errors.start_time ? <p className="mt-1 text-xs text-rose-500">{errors.start_time}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Giờ kết thúc (HH:mm)</label>
            <input
              type="text"
              value={form.end_time}
              onChange={(e) => handleInputChange("end_time", e.target.value)}
              placeholder="10:00"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            {errors.end_time ? <p className="mt-1 text-xs text-rose-500">{errors.end_time}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Giá mỗi giờ (VND)</label>
          <input
            type="number"
            min="1"
            value={form.price_per_hour}
            onChange={(e) => handleInputChange("price_per_hour", e.target.value)}
            placeholder="100000"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          {errors.price_per_hour ? <p className="mt-1 text-xs text-rose-500">{errors.price_per_hour}</p> : null}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PricingRuleFormModal;
