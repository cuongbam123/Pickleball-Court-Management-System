import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  getOrders,
  getOrder,
  ensureOrderByBooking,
  checkoutOrder,
  payDeposit,
} from "../api/orderApi";
import { addPosItems, updatePosItem } from "../../pos/api/posApi";
import { usePosProducts } from "./usePosProducts";
import { getPaymentResultReturnUrl } from "../../payment/utils/paymentReturnUrl";
import { toast } from "react-hot-toast";

const getEntityId = (value) => value?._id || value?.id || value || "";

const normalizeOrder = (raw) => {
  if (!raw) return null;
  return {
    ...raw,
    order_items: (raw.order_items || []).map((item) => ({
      ...item,
      product_id: getEntityId(item.product_id),
      name: item.name || item.name_snapshot,
      price: item.price ?? item.unit_price_snapshot,
      total_amount:
        item.total_amount ??
        Number(item.unit_price_snapshot || item.price || 0) *
          Number(item.quantity || 0),
    })),
  };
};

export const useOrderCheckout = (bookingId) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPosMutating, setIsPosMutating] = useState(false);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);

  const branchId = useMemo(
    () => getEntityId(order?.branch_id),
    [order?.branch_id],
  );

  const isOrderLocked = order?.payment_status === "fully_paid";

  const {
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    search: productSearch,
    setSearch: setProductSearch,
    type: productType,
    setType: setProductType,
    refreshProducts,
  } = usePosProducts(branchId, { enabled: !!branchId && !isOrderLocked });

  const fetchOrderData = useCallback(async () => {
    if (!bookingId) return;

    try {
      setIsLoading(true);
      setError(null);

      const listResponse = await getOrders({ booking_id: bookingId });
      const orders = listResponse?.data?.data || [];

      let orderId = orders[0]?._id;

      if (!orderId) {
        const ensureResponse = await ensureOrderByBooking(bookingId);
        const ensuredOrder =
          ensureResponse?.data?.data || ensureResponse?.data || null;
        orderId = ensuredOrder?._id;
      }

      if (!orderId) {
        throw new Error("Chưa tìm thấy hóa đơn cho lịch đặt sân này.");
      }

      const detailResponse = await getOrder(orderId);
      const detailData = detailResponse?.data?.data || detailResponse?.data;

      setOrder(normalizeOrder(detailData));
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Không thể tải thông tin hóa đơn.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  const stats = useMemo(() => {
    const courtFee = Number(order?.total_court_fee || 0);
    const posFee = Number(order?.total_pos_fee || order?.total_pos_amount || 0);
    const deposit = Number(order?.deposit_paid || 0);

    const totalBill = courtFee + posFee;
    const remainingBalance = Math.max(
      Number(order?.final_amount_due ?? totalBill - deposit),
      0,
    );

    return {
      courtFee,
      posFee,
      deposit,
      totalBill,
      remainingBalance,
      posItems: order?.order_items || [],
    };
  }, [order]);

  const applyOrderUpdate = useCallback((response) => {
    const updated = normalizeOrder(
      response?.data?.data || response?.data || null,
    );
    if (updated) setOrder(updated);
    return updated;
  }, []);

  const handleAddPosProduct = useCallback(
    async (productId, quantity = 1) => {
      if (!order?._id || isOrderLocked || isPosMutating) return false;

      try {
        setIsPosMutating(true);
        const response = await addPosItems(order._id, [
          { product_id: productId, quantity: Number(quantity) || 1 },
        ]);
        applyOrderUpdate(response);
        await refreshProducts();
        toast.success("Đã thêm sản phẩm vào hóa đơn");
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Không thể thêm sản phẩm.";
        toast.error(msg);
        return false;
      } finally {
        setIsPosMutating(false);
      }
    },
    [order?._id, isOrderLocked, isPosMutating, applyOrderUpdate, refreshProducts],
  );

  const handleUpdatePosQuantity = useCallback(
    async (productId, quantity) => {
      if (!order?._id || isOrderLocked || isPosMutating) return false;

      const nextQty = Math.max(0, Number(quantity));
      const currentItem = (order.order_items || []).find(
        (item) => getEntityId(item.product_id) === productId,
      );
      if (currentItem && currentItem.quantity === nextQty) return true;

      try {
        setIsPosMutating(true);
        const response = await updatePosItem(order._id, {
          product_id: productId,
          quantity: nextQty,
        });
        applyOrderUpdate(response);
        await refreshProducts();
        toast.success(
          nextQty === 0 ? "Đã xóa sản phẩm khỏi hóa đơn" : "Đã cập nhật số lượng",
        );
        return true;
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Không thể cập nhật sản phẩm.";
        toast.error(msg);
        return false;
      } finally {
        setIsPosMutating(false);
      }
    },
    [
      order?._id,
      order?.order_items,
      isOrderLocked,
      isPosMutating,
      applyOrderUpdate,
      refreshProducts,
    ],
  );

  const handleCheckout = async (paymentMethod = "cash", amountReceived = 0) => {
    if (!order?._id || processingRef.current) return;

    try {
      processingRef.current = true;
      setIsProcessing(true);
      setError(null);

      if (paymentMethod === "cash" || paymentMethod === "transfer") {
        const payload = {
          payment_method: paymentMethod,
          amount_received:
            paymentMethod === "cash"
              ? Number(amountReceived)
              : Number(stats.remainingBalance),
        };

        const response = await checkoutOrder(order._id, payload);
        const updatedOrder = applyOrderUpdate(response);
        toast.success("Thanh toán hóa đơn thành công!");
        return updatedOrder;
      }

      const payload = {
        payment_method: paymentMethod === "paypal" ? "paypal" : "vnpay",
        redirect_url: getPaymentResultReturnUrl(),
      };

      const response = await payDeposit(order._id, payload);
      const paymentUrl =
        response?.data?.data?.payment_url || response?.data?.payment_url;

      if (paymentUrl) {
        window.location.replace(paymentUrl);
      } else {
        throw new Error("Không lấy được link thanh toán.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Lỗi xử lý thanh toán.";
      toast.error(msg);
      setError(msg);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  return {
    order,
    branchId,
    isOrderLocked,
    ...stats,
    products,
    isLoadingProducts,
    productsError,
    productSearch,
    setProductSearch,
    productType,
    setProductType,
    isPosMutating,
    handleAddPosProduct,
    handleUpdatePosQuantity,
    isLoading,
    isProcessing,
    error,
    refreshOrder: fetchOrderData,
    handleCheckout,
  };
};
