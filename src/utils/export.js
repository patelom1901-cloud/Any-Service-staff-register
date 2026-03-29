import * as XLSX from 'xlsx';
import { computeMonthlyStats } from './db';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function exportMonthlyReport(year, month, fmt = 'xlsx', workers = [], attendance = [], advances = []) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const summaryData = workers.map(w => {
    const stats = computeMonthlyStats(w.id, year, month, attendance, advances);
    const earned = stats.attendanceDays * w.dailyWage;
    return {
      'Worker Name': w.name,
      'Phone': w.phone || '-',
      'Daily Wage': w.dailyWage,
      'Days Present': stats.present,
      'Half Days': stats.halfDay,
      'Days Absent': stats.absent,
      'Total Earned': earned,
      'Advance Taken': stats.totalAdvance,
      'Balance (Payable)': earned - stats.totalAdvance,
    };
  });

  const monthAttendance = attendance.filter(a => a.date.startsWith(prefix));
  const attendanceData = monthAttendance.map(a => {
    const worker = workers.find(w => w.id === a.workerId);
    return {
      'Date': a.date,
      'Worker': worker?.name || 'Unknown',
      'Status': a.status === 'present' ? 'Present' : a.status === 'half' ? 'Half Day' : 'Absent',
    };
  });

  const monthAdvances = advances.filter(a => a.date.startsWith(prefix));
  const advanceData = monthAdvances.map(a => {
    const worker = workers.find(w => w.id === a.workerId);
    return {
      'Date': a.date,
      'Worker': worker?.name || 'Unknown',
      'Amount': a.amount,
      'Reason': a.reason || '-',
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Monthly Summary');
  if (attendanceData.length > 0)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceData), 'Attendance Detail');
  if (advanceData.length > 0)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(advanceData), 'Advance Detail');

  XLSX.writeFile(wb, `ASAR_${MONTH_NAMES[month]}_${year}.${fmt}`, { bookType: fmt === 'csv' ? 'csv' : 'xlsx' });
}

export function exportYearlyReport(year, fmt = 'xlsx', workers = [], attendance = [], advances = []) {
  const yearlyData = workers.map(w => {
    const row = { 'Worker Name': w.name, 'Daily Wage': w.dailyWage };
    let totalEarned = 0, totalAdvance = 0;

    for (let m = 0; m < 12; m++) {
      const stats = computeMonthlyStats(w.id, year, m, attendance, advances);
      const earned = stats.attendanceDays * w.dailyWage;
      row[`${MONTH_SHORT[m]} Days`] = stats.present + stats.halfDay * 0.5;
      row[`${MONTH_SHORT[m]} Earned`] = earned;
      row[`${MONTH_SHORT[m]} Advance`] = stats.totalAdvance;
      totalEarned += earned;
      totalAdvance += stats.totalAdvance;
    }

    row['Total Earned'] = totalEarned;
    row['Total Advance'] = totalAdvance;
    row['Yearly Balance'] = totalEarned - totalAdvance;
    return row;
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(yearlyData), `${year} Report`);
  XLSX.writeFile(wb, `ASAR_Yearly_${year}.${fmt}`, { bookType: fmt === 'csv' ? 'csv' : 'xlsx' });
}
