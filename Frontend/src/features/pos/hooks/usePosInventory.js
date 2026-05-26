import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useBranches } from "../../../features/facility/hooks/useBranches";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from "../api/posApi";
import toast from "react-hot-toast";

export const usePosInventory = () => {
  const { user, isAdmin } = useAuth();
  const { branches, isLoading: isLoadingBranches } = useBranches();

  // State xác định chi nhánh đang chọn
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // State quản lý sản phẩm
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productCountMeta, setProductCountMeta] = useState({ total_records: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const limit = 50;

  // State quản lý bộ lọc
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  // Trạng thái Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form states cho Product CRUD
  const [productFormData, setProductFormData] = useState({
    name: "",
    type: "drink",
    price: "",
    stock: 0,
  });
  const [productFormErrors, setProductFormErrors] = useState({});
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);

  // Form states cho Stock Adjustment
  const [adjustFormData, setAdjustFormData] = useState({
    type: "in", // 'in' (nhập) | 'out' (xuất)
    amount: "",
    reason: "restock", // 'restock' | 'adjustment' | 'refund'
    note: "",
  });
  const [adjustFormErrors, setAdjustFormErrors] = useState({});
  const [isAdjustSubmitting, setIsAdjustSubmitting] = useState(false);

  // Thiết lập mặc định chi nhánh khi tải trang hoặc khi danh sách chi nhánh đổi
  useEffect(() => {
    if (!isAdmin && user?.branch_id) {
      const bId = typeof user.branch_id === "object" ? user.branch_id._id : user.branch_id;
      setSelectedBranchId(bId || "");
    } else if (isAdmin && branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0]._id);
    }
  }, [user, isAdmin, branches, selectedBranchId]);

  // Lấy chi nhánh hiện tại để hiển thị tên
  const activeBranch = useMemo(() => {
    return branches.find((b) => b._id === selectedBranchId);
  }, [branches, selectedBranchId]);

  // Gọi API tải sản phẩm
  const fetchProductsList = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingProducts(true);
      const res = await getProducts({
        branch_id: selectedBranchId,
        page,
        limit,
        ...(type ? { type } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      setProducts(res?.data?.data || []);
      setProductCountMeta(
        res?.data?.meta || {
          total_records: res?.data?.data?.length || 0,
          total_pages: 1,
        }
      );
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedBranchId, page, type, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductsList();
    }, 300); // Debounce tìm kiếm
    return () => clearTimeout(timer);
  }, [fetchProductsList]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = products.length;
    const drinks = products.filter((p) => p.type === "drink").length;
    const rentals = products.filter((p) => p.type === "equipment_rental").length;
    const retails = products.filter((p) => p.type === "retail").length;
    const outOfStock = products.filter((p) => Number(p.stock) === 0).length;
    const lowStock = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length;

    return { total, drinks, rentals, retails, outOfStock, lowStock };
  }, [products]);

  // ================= THAO TÁC CRUD SẢN PHẨM ================= //

  const openCreateModal = () => {
    setProductModalMode("create");
    setSelectedProduct(null);
    setProductFormData({
      name: "",
      type: "drink",
      price: "",
      stock: 0,
    });
    setProductFormErrors({});
    setIsProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setProductModalMode("edit");
    setSelectedProduct(product);
    setProductFormData({
      name: product.name,
      type: product.type,
      price: product.price,
      stock: product.stock,
    });
    setProductFormErrors({});
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async () => {
    try {
      setIsProductSubmitting(true);
      setProductFormErrors({});

      const payload = {
        branch_id: selectedBranchId,
        name: productFormData.name ? productFormData.name.trim() : "",
        type: productFormData.type,
        price: productFormData.price === "" ? undefined : Number(productFormData.price),
        ...(productModalMode === "create" ? { stock: productFormData.stock === "" ? undefined : Number(productFormData.stock) } : {}),
      };

      if (productModalMode === "create") {
        await createProduct(payload);
        toast.success("Tạo sản phẩm mới thành công!");
      } else {
        await updateProduct(selectedProduct._id, {
          name: payload.name,
          type: payload.type,
          price: payload.price,
        });
        toast.success("Cập nhật sản phẩm thành công!");
      }

      setIsProductModalOpen(false);
      fetchProductsList();
    } catch (error) {
      console.error("Lỗi lưu sản phẩm:", error);
      const msg = error?.response?.data?.message || "Lỗi xử lý yêu cầu.";
      toast.error(msg);
      setProductFormErrors({ general: msg });
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const openDeleteConfirm = (product) => {
    setSelectedProduct(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await deleteProduct(selectedProduct._id);
      toast.success("Xóa sản phẩm thành công!");
      setIsDeleteConfirmOpen(false);
      fetchProductsList();
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa sản phẩm này.");
    }
  };

  // ================= ĐIỀU CHỈNH TỒN KHO (NHẬP/XUẤT) ================= //

  const openAdjustStockModal = (product) => {
    setSelectedProduct(product);
    setAdjustFormData({
      type: "in",
      amount: "",
      reason: "restock",
      note: "",
    });
    setAdjustFormErrors({});
    setIsAdjustStockModalOpen(true);
  };

  const handleAdjustTypeChange = (newType) => {
    setAdjustFormData((prev) => ({
      ...prev,
      type: newType,
      reason: newType === "in" ? "restock" : "adjustment",
    }));
    setAdjustFormErrors({});
  };

  const handleAdjustSubmit = async () => {
    try {
      setIsAdjustSubmitting(true);
      setAdjustFormErrors({});

      const amount = Number(adjustFormData.amount);
      const changeAmount = adjustFormData.type === "in" ? amount : -amount;

      await adjustStock(selectedProduct._id, {
        change_amount: isNaN(changeAmount) ? undefined : changeAmount,
        reason: adjustFormData.reason,
        note: adjustFormData.note ? adjustFormData.note.trim() : undefined,
      });

      toast.success(
        adjustFormData.type === "in" ? "Nhập kho sản phẩm thành công!" : "Xuất kho sản phẩm thành công!"
      );
      setIsAdjustStockModalOpen(false);
      fetchProductsList();
    } catch (error) {
      console.error("Lỗi điều chỉnh tồn kho:", error);
      const msg = error?.response?.data?.message || "Không thể thực hiện điều chỉnh tồn kho.";
      toast.error(msg);
      setAdjustFormErrors({ general: msg });
    } finally {
      setIsAdjustSubmitting(false);
    }
  };

  const isManagerOrAdmin = useMemo(() => {
    return user?.role === "admin" || user?.role === "manager";
  }, [user]);

  return {
    isAdmin,
    isManagerOrAdmin,
    branches,
    isLoadingBranches,
    selectedBranchId,
    setSelectedBranchId,
    activeBranch,
    products,
    isLoadingProducts,
    productCountMeta,
    page,
    setPage,
    search,
    setSearch,
    type,
    setType,
    refreshProducts: fetchProductsList,
    stats,

    // Product Modals & CRUD
    isProductModalOpen,
    setIsProductModalOpen,
    productModalMode,
    selectedProduct,
    openCreateModal,
    openEditModal,
    productFormData,
    setProductFormData,
    productFormErrors,
    isProductSubmitting,
    handleProductSubmit,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    openDeleteConfirm,
    handleDeleteProduct,

    // Stock In/Out Adjustment
    isAdjustStockModalOpen,
    setIsAdjustStockModalOpen,
    openAdjustStockModal,
    adjustFormData,
    setAdjustFormData,
    adjustFormErrors,
    isAdjustSubmitting,
    handleAdjustTypeChange,
    handleAdjustSubmit,
  };
};
