import { useState, useEffect, useCallback, useRef } from "react";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { getBranches } from "../../facility/api/branchApi";
import { getAllCourts, getCourtsByBranch } from "../../facility/api/courtApi";
import { useAuthStore } from "../../../store/authStore";
import {
  readPendingBookingDraft,
} from "../constants/pendingBooking";

export const useBookingPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const restoredDraftRef = useRef(false);
  const skipResetOnBranchChangeRef = useRef(false);

  const [branches, setBranches] = useState([]);
  const [courtsList, setCourtsList] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(false);

  const buildDraftSlots = useCallback(
    (draft) => {
      if (!Array.isArray(draft?.selectedSlots) || draft.selectedSlots.length === 0) {
        return [];
      }
      return draft.selectedSlots.map((slot) => ({
        courtId: slot.courtId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        pricePerHour: slot.pricePerHour,
        userInfo: slot.userInfo || {
          name: user?.full_name || user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
        },
      }));
    },
    [user],
  );

  useEffect(() => {
    getBranches().then((res) => {
      setBranches(res?.data?.data || res?.data || []);
    });
  }, []);

  const fetchCourts = useCallback(async () => {
    setIsLoadingCourts(true);
    try {
      if (!selectedBranch) {
        const res = await getAllCourts({ limit: 100 });
        setCourtsList(res?.data?.data || res?.data || []);
      } else {
        const res = await getCourtsByBranch(selectedBranch);
        setCourtsList(res?.data?.data || res?.data || []);
      }
    } catch (error) {
      console.error("Loi fetch san:", error);
    } finally {
      setIsLoadingCourts(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchCourts();
    if (skipResetOnBranchChangeRef.current) {
      skipResetOnBranchChangeRef.current = false;
      return;
    }
    setSelectedCourt("");
    setSelectedSlots([]);
  }, [fetchCourts, selectedBranch]);

  useEffect(() => {
    if (restoredDraftRef.current) return;

    const draft =
      location.state?.restoreBookingDraft || readPendingBookingDraft();
    if (!draft) return;

    if (draft.selectedBranch) {
      skipResetOnBranchChangeRef.current = true;
      setSelectedBranch(draft.selectedBranch);
      setSelectedCourt(
        draft.selectedSlots?.[0]?.courtId ? String(draft.selectedSlots[0].courtId) : "",
      );
    }

    if (draft.selectedDate && dayjs(draft.selectedDate).isValid()) {
      setSelectedDate(dayjs(draft.selectedDate).toDate());
    }

    const restoredSlots = buildDraftSlots(draft);
    if (restoredSlots.length > 0) {
      setSelectedSlots(restoredSlots);
    }

    restoredDraftRef.current = true;
  }, [location.state, buildDraftSlots]);

  // Fail-safe: trong một số trường hợp effect khác có thể reset selectedSlots về []
  // sau khi restore; khi đó nạp lại từ draft nếu còn.
  useEffect(() => {
    if (selectedSlots.length > 0) return;

    const draft =
      location.state?.restoreBookingDraft || readPendingBookingDraft();
    if (!draft) return;

    const restoredSlots = buildDraftSlots(draft);
    if (restoredSlots.length > 0) {
      setSelectedSlots(restoredSlots);
    }
  }, [selectedSlots.length, location.state, buildDraftSlots]);

  const handleSelectSlot = (court, slot) => {
    setSelectedSlots((prev) => {
      const userInfo = {
        name: user?.full_name || user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      };

      if (prev.length > 0 && prev[0].courtId !== court._id) {
        return [{ ...slot, courtId: court._id, userInfo }];
      }

      const isExists = prev.find((s) => s.startTime === slot.startTime);
      if (isExists) {
        const removed = prev.filter((s) => s.startTime !== slot.startTime);
        const isValid = removed.every(
          (s, i) => i === 0 || removed[i - 1].endTime === s.startTime,
        );
        return isValid ? removed : [];
      }

      const added = [...prev, { ...slot, courtId: court._id, userInfo }].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      const isContiguous = added.every(
        (s, i) => i === 0 || added[i - 1].endTime === s.startTime,
      );

      if (!isContiguous) {
        return [{ ...slot, courtId: court._id, userInfo }];
      }

      return added;
    });
  };

  return {
    user,
    branches,
    courtsList,
    selectedBranch,
    setSelectedBranch,
    selectedCourt,
    setSelectedCourt,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
    isLoadingCourts,
    handleSelectSlot,
  };
};
