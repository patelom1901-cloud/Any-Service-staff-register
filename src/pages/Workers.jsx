import { useState } from 'react';
import { useWorkers } from '../hooks/useData';
import WorkerForm from '../components/WorkerForm';
import './Workers.css';

export default function Workers() {
  const { workers, addWorker, updateWorker, deleteWorker } = useWorkers();
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (data) => {
    addWorker(data);
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    updateWorker(editingId, data);
    setEditingId(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Remove ${name}? Their attendance records will be kept.`)) {
      deleteWorker(id);
    }
  };

  return (
    <div className="workers-page">
      <h2>Workers</h2>

      {!showForm && !editingId && (
        <button className="add-worker-btn" onClick={() => setShowForm(true)}>
          + Add New Worker
        </button>
      )}

      {showForm && (
        <WorkerForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      <div className="workers-list">
        {workers.length === 0 && !showForm ? (
          <div className="empty-state">
            <span>&#128101;</span>
            <p>No workers added yet.</p>
            <p>Tap "+ Add New Worker" to get started.</p>
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
                      <p className="wc-wage">&#8377;{w.dailyWage}/day</p>
                    </div>
                  </div>
                  <div className="wc-actions">
                    <button className="wc-btn edit" onClick={() => setEditingId(w.id)}>Edit</button>
                    <button className="wc-btn delete" onClick={() => handleDelete(w.id, w.name)}>Remove</button>
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
