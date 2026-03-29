import * as XLSX from 'xlsx';
import { getWorkers, getAttendanceByMonth, getAdvancesByMonth, getMonthlyStats } from './storage';

export function exportMonthlyReport(year, month, format = 'xlsx') {
  const workers = getWorkers();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Summary sheet
  const summaryData = workers.map(w => {
    const stats = getMonthlyStats(w.id, year, month);
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
      'Balance (Payable)': earned - stats.totalAdvance
    };
  });

  // Attendance detail sheet
  const attendance = getAttendanceByMonth(year, month);
  const attendanceData = attendance.map(a => {
    const worker = workers.find(w => w.id === a.workerId);
    return {
      'Date': a.date,
      'Worker': worker?.name || 'Unknown',
      'Status': a.status === 'present' ? 'Present' : a.status === 'half' ? 'Half Day' : 'Absent'
    };
  });

  // Advances detail sheet
  const advances = getAdvancesByMonth(year, month);
  const advanceData = advances.map(a => {
    const worker = workers.find(w => w.id === a.workerId);
    return {
      'Date': a.date,
      'Worker': worker?.name || 'Unknown',
      'Amount': a.amount,
      'Reason': a.reason || '-'
    };
  });

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Monthly Summary');

  if (attendanceData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Attendance Detail');
  }

  if (advanceData.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(advanceData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Advance Detail');
  }

  const fileName = `ASAR_${monthNames[month]}_${year}.${format}`;
  XLSX.writeFile(wb, fileName, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
}

export function exportYearlyReport(year, format = 'xlsx') {
  const workers = getWorkers();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const yearlyData = workers.map(w => {
    const row = { 'Worker Name': w.name, 'Daily Wage': w.dailyWage };
    let totalEarned = 0, totalAdvance = 0;

    for (let m = 0; m < 12; m++) {
      const stats = getMonthlyStats(w.id, year, m);
      const earned = stats.attendanceDays * w.dailyWage;
      row[`${monthNames[m]} Days`] = stats.present + stats.halfDay * 0.5;
      row[`${monthNames[m]} Earned`] = earned;
      row[`${monthNames[m]} Advance`] = stats.totalAdvance;
      totalEarned += earned;
      totalAdvance += stats.totalAdvance;
    }

    row['Total Earned'] = totalEarned;
    row['Total Advance'] = totalAdvance;
    row['Yearly Balance'] = totalEarned - totalAdvance;
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(yearlyData);
  XLSX.utils.book_append_sheet(wb, ws, `${year} Report`);

  const fileName = `ASAR_Yearly_${year}.${format}`;
  XLSX.writeFile(wb, fileName, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
}
