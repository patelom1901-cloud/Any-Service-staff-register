import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  getWorkers, addWorker as addWorkerToStorage, updateWorker as updateWorkerInStorage,
  deleteWorker as deleteWorkerFromStorage,
  getAttendance, markAttendance as markAttendanceInStorage,
  getAdvances, addAdvance as addAdvanceToStorage, deleteAdvance as deleteAdvanceFromStorage,
  getMonthlyStats, getWorkerBalance
} from '../utils/storage';

export function useWorkers() {
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    setWorkers(getWorkers());
  }, []);

  const add = useCallback((worker) => {
    const newWorker = { ...worker, id: uuidv4(), createdAt: new Date().toISOString() };
    setWorkers(addWorkerToStorage(newWorker));
  }, []);

  const update = useCallback((id, updates) => {
    setWorkers(updateWorkerInStorage(id, updates));
  }, []);

  const remove = useCallback((id) => {
    setWorkers(deleteWorkerFromStorage(id));
  }, []);

  return { workers, addWorker: add, updateWorker: update, deleteWorker: remove };
}

export function useAttendance() {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    setAttendance(getAttendance());
  }, []);

  const mark = useCallback((workerId, date, status, isAdmin = false) => {
    const result = markAttendanceInStorage(workerId, date, status, isAdmin);
    if (result.success !== undefined) {
      setAttendance(result.attendance);
      return result;
    }
    setAttendance(result);
    return { success: true, reason: null };
  }, []);

  const getByDate = useCallback((date) => {
    return attendance.filter(a => a.date === date);
  }, [attendance]);

  return { attendance, markAttendance: mark, getByDate };
}

export function useAdvances() {
  const [advances, setAdvances] = useState([]);

  useEffect(() => {
    setAdvances(getAdvances());
  }, []);

  const add = useCallback((advance) => {
    const newAdvance = { ...advance, id: uuidv4(), createdAt: new Date().toISOString() };
    setAdvances(addAdvanceToStorage(newAdvance));
  }, []);

  const remove = useCallback((id) => {
    setAdvances(deleteAdvanceFromStorage(id));
  }, []);

  return { advances, addAdvance: add, deleteAdvance: remove };
}

export function useStats() {
  const getStats = useCallback((workerId, year, month) => {
    return getMonthlyStats(workerId, year, month);
  }, []);

  const getBalance = useCallback((workerId, year, month) => {
    return getWorkerBalance(workerId, year, month);
  }, []);

  return { getStats, getBalance };
}
