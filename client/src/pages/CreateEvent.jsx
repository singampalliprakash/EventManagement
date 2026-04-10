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
    image_url: '',
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast('Image is too large. Please select a photo under 20MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than 1000px
        const maxDim = 1000;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height *= maxDim / width;
            width = maxDim;
          } else {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed JPEG (lower quality for smaller payload)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setForm(prev => ({ ...prev, image_url: compressedBase64 }));
        showToast('Photo uploaded! ✨');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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
        image_url: e.image_url || '',
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
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🖼️</span> Event Banner / Photo
          </label>
          <div 
            style={{ 
              border: '2px dashed var(--primary-light)', 
              borderRadius: '20px', 
              padding: 'var(--space-lg)', 
              textAlign: 'center', 
              background: 'rgba(255,255,255,0.02)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease'
            }}
          >
            {form.image_url ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img 
                  src={form.image_url} 
                  alt="Preview" 
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setForm({ ...form, image_url: '' })}
                  style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'var(--rsvp-no)', border: 'none', color: 'white',
                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}
                >✕</button>
              </div>
            ) : (
              <div style={{ padding: '10px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px', filter: 'drop-shadow(0 0 8px var(--primary-light))' }}>📸</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '18px', fontWeight: 500 }}>Upload a beautiful photo for your invite</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                  id="event-image-upload"
                />
                <label 
                  htmlFor="event-image-upload" 
                  className="btn btn-primary"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px' }}
                >
                  <span>📤</span> Select Photo
                </label>
              </div>
            )}
          </div>
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
