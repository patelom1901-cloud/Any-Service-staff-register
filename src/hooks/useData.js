import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import {
  fetchWorkers, addWorkerDB, updateWorkerDB, deleteWorkerDB,
  fetchAttendance, markAttendanceDB,
  fetchAdvances, addAdvanceDB, deleteAdvanceDB, addRepaymentDB,
  computeMonthlyStats, computeWorkerBalance,
  canMarkAttendance,
} from '../utils/db';

// ─── Workers ──────────────────────────────────────────────────────────────────
export function useWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await fetchWorkers();
    setWorkers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('workers-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const addWorker = useCallback(async (worker) => {
    try {
      await addWorkerDB(worker);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateWorker = useCallback(async (id, updates) => {
    try {
      await updateWorkerDB(id, updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteWorker = useCallback(async (id) => {
    try {
      await deleteWorkerDB(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return { workers, loading, addWorker, updateWorker, deleteWorker };
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export function useAttendance(workerId = null) {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const workerIdRef = useRef(workerId);
  workerIdRef.current = workerId;

  const load = useCallback(async () => {
    const data = await fetchAttendance(workerIdRef.current);
    setAttendance(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('attendance-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const markAttendance = useCallback(async (wId, date, status, isAdmin = false) => {
    if (!isAdmin) {
      const check = canMarkAttendance(wId, attendance);
      if (!check.allowed && status !== null) {
        return { success: false, reason: check.reason };
      }
    }
    try {
      await markAttendanceDB(wId, date, status, !isAdmin);
      return { success: true, reason: null };
    } catch (err) {
      console.error('markAttendance error:', err);
      return { success: false, reason: err.message };
    }
  }, [attendance]);

  return { attendance, loading, markAttendance };
}

// ─── Advances ─────────────────────────────────────────────────────────────────
export function useAdvances(workerId = null) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const workerIdRef = useRef(workerId);
  workerIdRef.current = workerId;

  const load = useCallback(async () => {
    const data = await fetchAdvances(workerIdRef.current);
    setAdvances(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('advances-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advances' }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  const addAdvance = useCallback(async (advance) => {
    try {
      await addAdvanceDB(advance);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteAdvance = useCallback(async (id) => {
    try {
      await deleteAdvanceDB(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const addRepayment = useCallback(async (repayment) => {
    try {
      await addRepaymentDB(repayment);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return { advances, loading, addAdvance, deleteAdvance, addRepayment };
}

// ─── Stats (computed from in-memory data) ─────────────────────────────────────
export function useStats(workers, attendance, advances) {
  const getStats = useCallback((wId, year, month) => {
    return computeMonthlyStats(wId, year, month, attendance, advances);
  }, [attendance, advances]);

  const getBalance = useCallback((wId, year, month) => {
    return computeWorkerBalance(wId, year, month, workers, attendance, advances);
  }, [workers, attendance, advances]);

  return { getStats, getBalance };
}
