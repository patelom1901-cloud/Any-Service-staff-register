import { useState, useMemo } from 'react';
import { useWorkers, useAttendance, useAdvances, useStats } from '../hooks/useData';
import { exportMonthlyReport, exportYearlyReport } from '../utils/export';
import { useTranslation } from '../utils/i18n';
import './Reports.css';

export default function Reports() {
  const { t } = useTranslation();
  const { workers } = useWorkers();
  const { attendance } = useAttendance();
  const { advances } = useAdvances();
  const { getStats, getBalance } = useStats(workers, attendance, advances);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [exportFormat, setExportFormat] = useState('xlsx');

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  const years = useMemo(() => {
    const y = [];
    for (let i = now.getFullYear() - 2; i <= now.getFullYear() + 1; i++) y.push(i);
    return y;
  }, []);

  const monthlyData = useMemo(() =>
    workers.map(w => ({
      worker: w,
      stats: getStats(w.id, selectedYear, selectedMonth),
      balance: getBalance(w.id, selectedYear, selectedMonth),
    })),
    [workers, selectedYear, selectedMonth, getStats, getBalance]
  );

  const handleExportMonthly = () => exportMonthlyReport(selectedYear, selectedMonth, exportFormat, workers, attendance, advances);
  const handleExportYearly = () => exportYearlyReport(selectedYear, exportFormat, workers, attendance, advances);

  if (workers.length === 0) {
    return (
      <div className="reports-page">
        <h2>{t('reports')}</h2>
        <div className="empty-state"><p>{t('addWorkersFirstReports')}</p></div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h2>{t('reports')}</h2>

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
          {t('monthlyReport')}
        </button>
        <button className="export-btn yearly" onClick={handleExportYearly}>
          {t('yearlyReport')} ({selectedYear})
        </button>
      </div>

      <h3>{monthNames[selectedMonth]} {selectedYear}</h3>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>{t('worker')}</th>
              <th>{t('wage')}</th>
              <th>{t('days')}</th>
              <th>{t('earned')}</th>
              <th>{t('advance')}</th>
              <th>{t('balance')}</th>
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
              <td colSpan="3"><strong>{t('total')}</strong></td>
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
