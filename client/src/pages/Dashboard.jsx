import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/services';
import { useToast, EVENT_ICONS, EVENT_LABELS, formatDate, daysUntil } from '../utils/helpers';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await eventService.getAll();
      setEvents(res.data.events);
    } catch (err) {
      showToast('Failed to load events', 'error');
    }
    setLoading(false);
  };

  const upcomingEvents = (events || []).filter((e) => daysUntil(e.event_date) >= 0 && e.status !== 'cancelled');
  const pastEvents = (events || []).filter((e) => daysUntil(e.event_date) < 0 || e.status === 'cancelled');

  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p style={{ color: 'var(--text-muted)' }}>Loading events...</p></div>;
  }

  return (
    <div className="page">
      <ToastContainer />
      
      {/* Quick Create Modal */}
      {showQuickCreate && (
        <div className="modal-overlay" onClick={() => setShowQuickCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ New Event</h3>
              <button className="modal-close" onClick={() => setShowQuickCreate(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
              What is the name of your event?
            </p>
            <div className="form-group">
              <input 
                autoFocus
                className="form-input" 
                placeholder="e.g., Rahul's Birthday Party" 
                value={quickTitle} 
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && quickTitle && navigate(`/create-event?title=${encodeURIComponent(quickTitle)}`)}
              />
            </div>
            <button 
              className="btn btn-primary btn-block btn-lg" 
              disabled={!quickTitle}
              onClick={() => navigate(`/create-event?title=${encodeURIComponent(quickTitle)}`)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      <ToastContainer />
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome back,</p>
          <h1 style={{ fontSize: '1.5rem' }}>{user?.name?.split(' ')[0]} 👋</h1>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
      </div>

      {/* Stats */}
      {events.length > 0 && (
        <div className="flex gap-sm mb-lg" style={{ overflowX: 'auto' }}>
          <div className="card" style={{ flex: '1', minWidth: '100px', padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>{upcomingEvents.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming</div>
          </div>
          <div className="card" style={{ flex: '1', minWidth: '100px', padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {events.reduce((sum, e) => sum + (e.rsvpStats?.yes || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmed</div>
          </div>
          <div className="card" style={{ flex: '1', minWidth: '100px', padding: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
              {events.reduce((sum, e) => sum + (e.rsvpStats?.totalMembers || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Guests</div>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="flex items-center justify-between mb-md">
        <h2 style={{ fontSize: '1.15rem' }}>Upcoming Events</h2>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📅</div>
          <h3>No upcoming events</h3>
          <p>Create your first event and start managing wishlists & RSVPs!</p>
          <button onClick={() => setShowQuickCreate(true)} className="btn btn-primary" id="create-first-event">
            ✨ Create Event
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-md mb-lg">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="card"
              onClick={() => navigate(`/event-detail/${event.id}`)}
              style={{ cursor: 'pointer', padding: 'var(--space-md)' }}
              id={`event-card-${event.id}`}
            >
              <div className="flex gap-md items-center">
                <div className={`event-icon event-icon-${event.event_type}`}>
                  {EVENT_ICONS[event.event_type] || '🎉'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {event.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(event.event_date)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {daysUntil(event.event_date) === 0 ? (
                    <span className="badge badge-danger">Today!</span>
                  ) : daysUntil(event.event_date) <= 7 ? (
                    <span className="badge badge-warning">{daysUntil(event.event_date)}d left</span>
                  ) : (
                    <span className="badge badge-primary">{daysUntil(event.event_date)}d left</span>
                  )}
                </div>
              </div>

              {/* Mini RSVP bar */}
              {(event.rsvpStats?.yes > 0 || event.rsvpStats?.no > 0 || event.rsvpStats?.maybe > 0) && (
                <div style={{ marginTop: 'var(--space-sm)' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>✓ {event.rsvpStats.yes} Yes</span>
                    <span>? {event.rsvpStats.maybe} Maybe</span>
                    <span>✕ {event.rsvpStats.no} No</span>
                  </div>
                  <div className="progress-bar" style={{ height: '4px' }}>
                    <div style={{
                      display: 'flex',
                      height: '100%',
                      borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden',
                    }}>
                      {event.rsvpStats.yes > 0 && (
                        <div style={{ width: `${(event.rsvpStats.yes / (event.rsvpStats.yes + event.rsvpStats.no + event.rsvpStats.maybe)) * 100}%`, background: 'var(--rsvp-yes)' }}></div>
                      )}
                      {event.rsvpStats.maybe > 0 && (
                        <div style={{ width: `${(event.rsvpStats.maybe / (event.rsvpStats.yes + event.rsvpStats.no + event.rsvpStats.maybe)) * 100}%`, background: 'var(--rsvp-maybe)' }}></div>
                      )}
                      {event.rsvpStats.no > 0 && (
                        <div style={{ width: `${(event.rsvpStats.no / (event.rsvpStats.yes + event.rsvpStats.no + event.rsvpStats.maybe)) * 100}%`, background: 'var(--rsvp-no)' }}></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Invite stats */}
              <div className="flex gap-md mt-sm" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>📨 {event.inviteStats?.sent || 0}/{event.inviteStats?.total || 0} sent</span>
                <span>👥 {event.rsvpStats?.totalMembers || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>Past Events</h2>
          <div className="flex flex-col gap-md">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="card"
                onClick={() => navigate(`/event-detail/${event.id}`)}
                style={{ cursor: 'pointer', padding: 'var(--space-md)', opacity: 0.6 }}
              >
                <div className="flex gap-md items-center">
                  <div className={`event-icon event-icon-${event.event_type}`}>
                    {EVENT_ICONS[event.event_type] || '🎉'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem' }}>{event.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(event.event_date)}</div>
                  </div>
                  <span className="badge badge-info">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
