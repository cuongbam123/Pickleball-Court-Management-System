import { useEffect, useState } from "react";
import {
  getSharedMatches,
  getSharedMatchById,
  getShareTicket,
  buySharedMatchTicket,
} from "../api/sharedMatchApi";
import { getBranches } from "../../facility/api/branchApi";
import { getAllCourts } from "../../facility/api/courtApi";
import { getPaymentResultReturnUrl } from "../../payment/utils/paymentReturnUrl";

const getResponseData = (response) => response.data?.data || response.data;

const getTicketList = (payload) => (Array.isArray(payload) ? payload : []);

const SHARED_MATCH_VNPAY_RETURN_URL =
  getPaymentResultReturnUrl();

export const useSharedMatch = () => {
  const [sharedMatches, setSharedMatches] = useState([]);
  const [branches, setBranches] = useState([]);
  const [courts, setCourts] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isBuyingTicket, setIsBuyingTicket] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [filters, setFilters] = useState({
    branch_id: "",
    court_id: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      const response = await getBranches();
      setBranches(getResponseData(response));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCourts = async () => {
    try {
      const response = await getAllCourts();
      setCourts(getResponseData(response));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSharedMatches = async () => {
    try {
      setIsLoading(true);

      const query = {};

      if (filters.branch_id) {
        query.branch_id = filters.branch_id;
      }

      if (filters.court_id) {
        query.court_id = filters.court_id;
      }

      const response = await getSharedMatches(query);
      setSharedMatches(getResponseData(response));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openMatchDetail = async (match) => {
    setSelectedMatch(match);
    setDetailError("");
    setIsDetailLoading(true);

    try {
      const [matchResponse, ticketResponse] = await Promise.all([
        getSharedMatchById(match._id),
        getShareTicket(match._id),
      ]);

      const matchDetail = getResponseData(matchResponse);
      const ticketPayload = getResponseData(ticketResponse);
      const tickets = getTicketList(ticketPayload);

      setSelectedMatch({
        ...match,
        ...matchDetail,
        participants: tickets,
      });
    } catch (error) {
      console.error(error);
      setDetailError("Không tải được chi tiết ca ghép.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeMatchDetail = () => {
    setSelectedMatch(null);
    setDetailError("");
    setIsDetailLoading(false);
  };

  const buyTicket = async (match) => {
    if (!match?._id) return;

    setDetailError("");
    setIsBuyingTicket(true);

    try {
      const response = await buySharedMatchTicket(match._id, {
        payment_method: "vnpay",
        redirect_url: SHARED_MATCH_VNPAY_RETURN_URL,
      });

      const ticketData = getResponseData(response);
      const paymentUrl = ticketData?.payment_url;

      if (!paymentUrl) {
        throw new Error("Không nhận được link thanh toán VNPay.");
      }

      window.location.replace(paymentUrl);
    } catch (error) {
      console.error(error);
      setDetailError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo link thanh toán.",
      );
    } finally {
      setIsBuyingTicket(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCourts();
  }, []);

  useEffect(() => {
    fetchSharedMatches();
  }, [filters]);

  return {
    sharedMatches,
    branches,
    courts,
    filters,
    setFilters,
    isLoading,
    selectedMatch,
    isDetailLoading,
    isBuyingTicket,
    detailError,
    openMatchDetail,
    closeMatchDetail,
    buyTicket,
  };
};
