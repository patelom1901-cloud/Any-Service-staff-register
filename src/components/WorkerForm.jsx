import { useState } from 'react';

export default function WorkerForm({ worker, onSubmit, onCancel }) {
  const [name, setName] = useState(worker?.name || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [pin, setPin] = useState(worker?.pin || '');
  const [dailyWage, setDailyWage] = useState(worker?.dailyWage || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !dailyWage) return;
    
    // Ensure PIN is always 4 digits, defaulting to 0000
    let finalPin = pin.trim();
    if (!/^\d{4}$/.test(finalPin)) {
      finalPin = '0000';
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      dailyWage: Number(dailyWage),
      pin: finalPin
    });
    setName('');
    setPhone('');
    setDailyWage('');
    setPin('0000');
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
          maxLength="50"
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
          maxLength="15"
        />
      </div>
      <div className="form-group">
        <label>Login PIN (4 digits)</label>
        <input
          type="text"
          pattern="\d{4}"
          maxLength="4"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="0000"
          title="4-digit PIN for worker login"
        />
        <small style={{display: 'block', color: 'var(--gray-500)', marginTop: '4px'}}>Default is 0000 if left blank.</small>
      </div>
      <div className="form-group">
        <label>Daily Wage (&#8377;) *</label>
        <input
          type="number"
          value={dailyWage}
          onChange={e => setDailyWage(e.target.value)}
          placeholder="e.g. 500"
          min="1"
          max="10000"
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
