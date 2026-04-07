import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { eventService } from '../services/services';
import { useToast } from '../utils/helpers';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    event_type: 'birthday',
    description: '',
    event_date: '',
    venue: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadEvent();
    } else {
      const qTitle = searchParams.get('title');
      if (qTitle) {
        setForm(prev => ({ ...prev, title: decodeURIComponent(qTitle) }));
      }
    }
  }, [id, searchParams]);

  const loadEvent = async () => {
    try {
      const res = await eventService.getOne(id);
      const e = res.data.event;
      setForm({
        title: e.title,
        event_type: e.event_type,
        description: e.description || '',
        event_date: e.event_date ? new Date(e.event_date).toISOString().slice(0, 16) : '',
        venue: e.venue || '',
      });
    } catch {
      showToast('Failed to load event', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await eventService.update(id, form);
        showToast('Event updated!');
      } else {
        const res = await eventService.create(form);
        showToast('Event created! 🎉');
        navigate(`/event-detail/${res.data.event.id}`);
        return;
      }
      navigate(-1);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save event', 'error');
    }
    setLoading(false);
  };

  const eventTypes = [
    { value: 'birthday', label: '🎂 Birthday' },
    { value: 'wedding', label: '💒 Wedding' },
    { value: 'engagement', label: '💍 Engagement' },
    { value: 'baby_shower', label: '👶 Baby Shower' },
    { value: 'anniversary', label: '❤️ Anniversary' },
    { value: 'housewarming', label: '🏠 Housewarming' },
    { value: 'corporate', label: '💼 Corporate' },
    { value: 'other', label: '🎉 Other' },
  ];

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>{isEdit ? 'Edit Event' : 'Create Event'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Event Name *</label>
          <input
            id="event-title"
            type="text"
            className="form-input"
            placeholder="e.g., Rahul's Birthday Party"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Event Type *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            {eventTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                id={`event-type-${type.value}`}
                onClick={() => setForm({ ...form, event_type: type.value })}
                style={{
                  padding: '10px 12px',
                  background: form.event_type === type.value ? 'var(--primary)' : 'var(--bg-input)',
                  border: `1px solid ${form.event_type === type.value ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: form.event_type === type.value ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-body)',
                  transition: 'all var(--transition-fast)',
                  textAlign: 'left',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date & Time *</label>
          <input
            id="event-date"
            type="datetime-local"
            className="form-input"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Venue</label>
          <input
            id="event-venue"
            type="text"
            className="form-input"
            placeholder="e.g., Grand Hall, Chennai"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            id="event-description"
            className="form-input"
            placeholder="Add details about the event..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <button
          id="save-event"
          type="submit"
          className="btn btn-primary btn-block btn-lg"
          disabled={loading}
          style={{ marginTop: 'var(--space-md)' }}
        >
          {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span> : isEdit ? 'Update Event' : '✨ Create Event'}
        </button>
      </form>
    </div>
  );
}
