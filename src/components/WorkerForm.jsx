import { useState } from 'react';

export default function WorkerForm({ worker, onSubmit, onCancel }) {
  const [name, setName] = useState(worker?.name || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [dailyWage, setDailyWage] = useState(worker?.dailyWage || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !dailyWage) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      dailyWage: Number(dailyWage)
    });
    setName('');
    setPhone('');
    setDailyWage('');
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h3>{worker ? 'Edit Worker' : 'Add New Worker'}</h3>
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Worker name"
          required
        />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone number"
        />
      </div>
      <div className="form-group">
        <label>Daily Wage (&#8377;) *</label>
        <input
          type="number"
          value={dailyWage}
          onChange={e => setDailyWage(e.target.value)}
          placeholder="e.g. 500"
          min="1"
          required
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {worker ? 'Update' : 'Add Worker'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
