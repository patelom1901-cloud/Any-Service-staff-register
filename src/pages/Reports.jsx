import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useWorkers, useStats } from '../hooks/useData';
import { exportMonthlyReport, exportYearlyReport } from '../utils/export';
import './Reports.css';

export default function Reports() {
  const { workers } = useWorkers();
  const { getStats, getBalance } = useStats();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [exportFormat, setExportFormat] = useState('xlsx');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear() - 2; i <= now.getFullYear() + 1; i++) y.push(i);
    return y;
  }, []);

  const monthlyData = useMemo(() => {
    return workers.map(w => {
      const stats = getStats(w.id, selectedYear, selectedMonth);
      const balance = getBalance(w.id, selectedYear, selectedMonth);
      return { worker: w, stats, balance };
    });
  }, [workers, selectedYear, selectedMonth, getStats, getBalance]);

  const handleExportMonthly = () => exportMonthlyReport(selectedYear, selectedMonth, exportFormat);
  const handleExportYearly = () => exportYearlyReport(selectedYear, exportFormat);

  if (workers.length === 0) {
    return (
      <div className="reports-page">
        <h2>Reports</h2>
        <div className="empty-state"><p>Add workers and mark attendance to generate reports.</p></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h2>Reports</h2>

      <div className="report-filters">
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
          <option value="xlsx">Excel</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <div className="export-btns">
        <button className="export-btn monthly" onClick={handleExportMonthly}>
          &#128190; Monthly Report
        </button>
        <button className="export-btn yearly" onClick={handleExportYearly}>
          &#128190; Yearly Report ({selectedYear})
        </button>
      </div>

      <h3>{monthNames[selectedMonth]} {selectedYear}</h3>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Wage</th>
              <th>Days</th>
              <th>Earned</th>
              <th>Advance</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map(({ worker, stats, balance }) => (
              <tr key={worker.id}>
                <td>{worker.name}</td>
                <td>&#8377;{worker.dailyWage}</td>
                <td>{stats.present + stats.halfDay * 0.5}</td>
                <td>&#8377;{balance.earned}</td>
                <td>&#8377;{balance.advance}</td>
                <td className={balance.balance >= 0 ? 'positive' : 'negative'}>&#8377;{balance.balance}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3"><strong>Total</strong></td>
              <td><strong>&#8377;{monthlyData.reduce((s, d) => s + d.balance.earned, 0)}</strong></td>
              <td><strong>&#8377;{monthlyData.reduce((s, d) => s + d.balance.advance, 0)}</strong></td>
              <td className={monthlyData.reduce((s, d) => s + d.balance.balance, 0) >= 0 ? 'positive' : 'negative'}>
                <strong>&#8377;{monthlyData.reduce((s, d) => s + d.balance.balance, 0)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
