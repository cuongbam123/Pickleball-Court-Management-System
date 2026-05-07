import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { getBranches } from "../../facility/api/branchApi";
import {
  createPricingRule,
  deletePricingRule,
  getPricingRules,
  updatePricingRule,
} from "../api/pricingRuleApi";

const DEFAULT_FILTERS = {
  branch_id: "",
  court_type: "",
  day_type: "",
  time_type: "",
};

const extractApiMessage = (error, fallback = "Đã xảy ra lỗi, vui lòng thử lại.") =>
  error?.response?.data?.message || fallback;

const resolveConflictMessage = (error) => {
  const errorCode =
    error?.response?.data?.error_code || error?.response?.data?.errorCode;
  if (errorCode === "ERR_TIME_OVERLAP") {
    return "Khung giờ bị trùng với cấu hình hiện có. Vui lòng chọn khoảng thời gian khác.";
  }
  return extractApiMessage(error);
};

const usePricingRules = () => {
  const [rules, setRules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 50,
    total_records: 0,
    total_pages: 1,
  });

  const fetchBranches = useCallback(async () => {
    try {
      const res = await getBranches();
      setBranches(res?.data?.data || res?.data || []);
    } catch (error) {
      toast.error(extractApiMessage(error, "Không thể tải danh sách chi nhánh."));
    }
  }, []);

  const fetchRules = useCallback(async (queryFilters = filters) => {
    setIsLoading(true);
    try {
      const params = {
        ...queryFilters,
        page: 1,
        limit: 50,
      };
      Object.keys(params).forEach((key) => {
        if (params[key] === "") delete params[key];
      });

      const res = await getPricingRules(params);
      setRules(res?.data?.data || []);
      setMeta(res?.data?.meta || {});
    } catch (error) {
      toast.error(extractApiMessage(error, "Không thể tải danh sách cấu hình giá."));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const applyFilters = useCallback(() => {
    setFilters(draftFilters);
  }, [draftFilters]);

  const createRule = useCallback(async (payload) => {
    setIsSubmitting(true);
    try {
      await createPricingRule(payload);
      toast.success("Tạo cấu hình giá thành công.");
      await fetchRules(filters);
      return { success: true };
    } catch (error) {
      const message = resolveConflictMessage(error);
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchRules, filters]);

  const editRule = useCallback(async (id, payload) => {
    setIsSubmitting(true);
    try {
      await updatePricingRule(id, payload);
      toast.success("Cập nhật cấu hình giá thành công.");
      await fetchRules(filters);
      return { success: true };
    } catch (error) {
      const message = resolveConflictMessage(error);
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchRules, filters]);

  const removeRule = useCallback(async (id) => {
    setIsSubmitting(true);
    try {
      await deletePricingRule(id);
      toast.success("Xóa cấu hình giá thành công.");
      await fetchRules(filters);
      return { success: true };
    } catch (error) {
      const message = extractApiMessage(error, "Không thể xóa cấu hình giá.");
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchRules, filters]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchRules(filters);
  }, [fetchRules, filters]);

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        value: branch._id,
        label: branch.name || "Không xác định",
      })),
    [branches],
  );

  return {
    rules,
    branches,
    branchOptions,
    isLoading,
    isSubmitting,
    filters,
    draftFilters,
    setDraftFilters,
    meta,
    fetchRules,
    applyFilters,
    createRule,
    editRule,
    removeRule,
  };
};

export default usePricingRules;
