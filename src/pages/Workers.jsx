import { useState } from 'react';
import { useWorkers } from '../hooks/useData';
import WorkerForm from '../components/WorkerForm';
import { useTranslation } from '../utils/i18n';
import './Workers.css';

export default function Workers() {
  const { t } = useTranslation();
  const { workers, addWorker, updateWorker, deleteWorker } = useWorkers();
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (data) => {
    try {
      const res = await addWorker(data);
      if (res && res.error) {
        alert(res.error);
      } else {
        setShowForm(false);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (data) => {
    try {
      const res = await updateWorker(editingId, data);
      if (res && res.error) {
        alert(res.error);
      } else {
        setEditingId(null);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(t('confirmRemove').replace('{name}', name))) {
      try {
        const res = await deleteWorker(id);
        if (res && res.error) {
          alert(res.error);
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="workers-page">
      <h2>{t('workers')}</h2>

      {!showForm && !editingId && (
        <button className="add-worker-btn" onClick={() => setShowForm(true)}>
          {t('addNewWorker')}
        </button>
      )}

      {showForm && (
        <WorkerForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      <div className="workers-list">
        {workers.length === 0 && !showForm ? (
          <div className="empty-state">
            <span>&#128101;</span>
            <p>{t('noWorkersYet')}</p>
            <p>{t('tapToAdd')}</p>
          </div>
        ) : (
          workers.map(w => (
            <div key={w.id} className="worker-card">
              {editingId === w.id ? (
                <WorkerForm worker={w} onSubmit={handleUpdate} onCancel={() => setEditingId(null)} />
              ) : (
                <>
                  <div className="wc-left">
                    <span className="wc-avatar">{w.name.charAt(0)}</span>
                    <div className="wc-info">
                      <h4>{w.name}</h4>
                      {w.phone && <p className="wc-phone">{w.phone}</p>}
                      <p className="wc-wage">&#8377;{w.dailyWage}{t('perDay')}</p>
                    </div>
                  </div>
                  <div className="wc-actions">
                    <button className="wc-btn edit" onClick={() => setEditingId(w.id)}>{t('edit')}</button>
                    <button className="wc-btn delete" onClick={() => handleDelete(w.id, w.name)}>{t('remove')}</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
