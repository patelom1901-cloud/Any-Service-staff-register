import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import {
  fetchWorkers, addWorkerDB, updateWorkerDB, deleteWorkerDB,
  fetchAttendance, markAttendanceDB,
  fetchAdvances, addAdvanceDB, deleteAdvanceDB,
  computeMonthlyStats, computeWorkerBalance,
  canMarkAttendance, incrementModification,
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
    await addWorkerDB(worker);
    // Real-time will trigger load()
  }, []);

  const updateWorker = useCallback(async (id, updates) => {
    await updateWorkerDB(id, updates);
  }, []);

  const deleteWorker = useCallback(async (id) => {
    await deleteWorkerDB(id);
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
    await addAdvanceDB(advance);
  }, []);

  const deleteAdvance = useCallback(async (id) => {
    await deleteAdvanceDB(id);
  }, []);

  return { advances, loading, addAdvance, deleteAdvance };
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
