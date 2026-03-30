import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { eventService, wishlistService, rsvpService } from '../services/services';
import { useToast, EVENT_ICONS, EVENT_LABELS, formatDate } from '../utils/helpers';

export default function GuestView() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('guest');
  const { showToast, ToastContainer } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [rsvpStats, setRsvpStats] = useState(null);
  const [rsvpForm, setRsvpForm] = useState({ response: '', member_count: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [claimedItems, setClaimedItems] = useState([]);

  useEffect(() => { loadEvent(); }, [code]);

  const loadEvent = async () => {
    try {
      const res = await eventService.getByShareCode(code);
      setEvent(res.data.event);
      // Load RSVP stats
      try {
        const statsRes = await rsvpService.getStats(res.data.event.id);
        setRsvpStats(statsRes.data.stats);
      } catch { /* guest may not have access */ }
    } catch {
      showToast('Event not found', 'error');
    }
    setLoading(false);
  };

  const submitRsvp = async () => {
    if (!rsvpForm.response) { showToast('Please select your response', 'error'); return; }
    if (!guestToken) { showToast('Invalid invite link', 'error'); return; }
    try {
      await rsvpService.submit(event.id, {
        guest_token: guestToken,
        response: rsvpForm.response,
        member_count: parseInt(rsvpForm.member_count) || 1,
        message: rsvpForm.message,
      });
      showToast('RSVP submitted! 🎉');
      setRsvpSubmitted(true);
      loadEvent();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to submit RSVP', 'error'); }
  };

  const claimGift = async (itemId) => {
    if (!guestToken) { showToast('Invalid invite link', 'error'); return; }
    try {
      await wishlistService.claimItem(itemId, guestToken);
      showToast('Gift claimed! 🎁 No one else will pick this.');
      setClaimedItems((prev) => [...prev, itemId]);
      loadEvent();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to claim gift', 'error'); }
  };

  const unclaimGift = async (itemId) => {
    if (!guestToken) return;
    try {
      await wishlistService.unclaimItem(itemId, guestToken);
      showToast('Gift unclaimed');
      setClaimedItems((prev) => prev.filter((id) => id !== itemId));
      loadEvent();
    } catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div><p style={{ color: 'var(--text-muted)' }}>Loading event...</p></div>;
  if (!event) return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>😕</div>
      <h2>Event Not Found</h2>
      <p style={{ color: 'var(--text-muted)' }}>This event link may be invalid or expired.</p>
    </div>
  );

  const totalRsvp = (rsvpStats?.yes || 0) + (rsvpStats?.no || 0) + (rsvpStats?.maybe || 0);

  return (
    <div className="page" style={{ paddingBottom: 'var(--space-lg)' }}>
      <ToastContainer />

      {/* Event Header */}
      <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', marginBottom: 'var(--space-md)' }}>
        <div className={`event-icon event-icon-${event.event_type}`} style={{ width: '64px', height: '64px', fontSize: '2rem', margin: '0 auto var(--space-md)' }}>
          {EVENT_ICONS[event.event_type]}
        </div>
        <h1 className="text-gradient" style={{ fontSize: '1.6rem', marginBottom: 'var(--space-xs)' }}>{event.title}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{EVENT_LABELS[event.event_type]}</p>
      </div>

      {/* Info Card */}
      <div className="card card-glass mb-md" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
        <div className="flex justify-between" style={{ maxWidth: '280px', margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📅 Date</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(event.event_date)}</div>
          </div>
          {event.venue && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📍 Venue</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.venue}</div>
            </div>
          )}
        </div>
        {event.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 'var(--space-md)', lineHeight: 1.6 }}>{event.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>📋 RSVP</button>
        <button className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>🎁 Wishlist ({event.wishlistItems?.length || 0})</button>
      </div>

      {/* RSVP Tab */}
      {activeTab === 'details' && (
        <div>
          {!rsvpSubmitted && guestToken ? (
            <div className="card mb-md" style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-md)', textAlign: 'center' }}>Will you be attending?</h3>
              <div className="flex gap-sm mb-md">
                {[
                  { value: 'yes', label: '✓ Yes!', color: 'var(--rsvp-yes)' },
                  { value: 'maybe', label: '? Maybe', color: 'var(--rsvp-maybe)' },
                  { value: 'no', label: '✕ No', color: 'var(--rsvp-no)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRsvpForm({ ...rsvpForm, response: option.value })}
                    style={{
                      flex: 1, padding: '16px 8px', borderRadius: 'var(--radius-md)',
                      border: rsvpForm.response === option.value ? `2px solid ${option.color}` : '2px solid var(--border)',
                      background: rsvpForm.response === option.value ? `${option.color}20` : 'var(--bg-input)',
                      color: rsvpForm.response === option.value ? option.color : 'var(--text-secondary)',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 600,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {(rsvpForm.response === 'yes' || rsvpForm.response === 'maybe') && (
                <div className="form-group">
                  <label className="form-label">How many members (including you)?</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="50"
                    value={rsvpForm.member_count}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, member_count: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Any message for the host..."
                  rows={2}
                  value={rsvpForm.message}
                  onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                />
              </div>

              <button onClick={submitRsvp} className="btn btn-primary btn-block btn-lg" disabled={!rsvpForm.response}>
                Submit RSVP
              </button>
            </div>
          ) : rsvpSubmitted ? (
            <div className="card mb-md" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎉</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Thank you!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Your RSVP has been submitted.</p>
            </div>
          ) : (
            <div className="card mb-md" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>Open this link from your invitation to RSVP.</p>
            </div>
          )}

          {/* RSVP stats */}
          {rsvpStats && totalRsvp > 0 && (
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>Response Progress</h4>
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-label" style={{ color: 'var(--rsvp-yes)' }}>✓ Going</span>
                  <span className="progress-value">{rsvpStats.yes}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill progress-yes" style={{ width: `${(rsvpStats.yes / totalRsvp) * 100}%` }}></div></div>
              </div>
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-label" style={{ color: 'var(--rsvp-maybe)' }}>? Maybe</span>
                  <span className="progress-value">{rsvpStats.maybe}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill progress-maybe" style={{ width: `${(rsvpStats.maybe / totalRsvp) * 100}%` }}></div></div>
              </div>
              <div className="progress-container">
                <div className="progress-header">
                  <span className="progress-label" style={{ color: 'var(--rsvp-no)' }}>✕ Can't make it</span>
                  <span className="progress-value">{rsvpStats.no}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill progress-no" style={{ width: `${(rsvpStats.no / totalRsvp) * 100}%` }}></div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          {!event.wishlistItems || event.wishlistItems.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎁</div>
              <h3>No wishlist yet</h3>
              <p>The host hasn't added any gift preferences yet.</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                Pick a gift to let others know you're getting it!
              </p>
              <div className="flex flex-col gap-sm">
                {event.wishlistItems.map((item) => {
                  const isClaimed = item.status === 'claimed';
                  const isClaimedByMe = claimedItems.includes(item.id);
                  return (
                    <div key={item.id} className="card" style={{ padding: 'var(--space-md)', opacity: isClaimed && !isClaimedByMe ? 0.5 : 1 }}>
                      <div className="flex gap-md">
                        {item.image_url && (
                          <div style={{ width: '68px', height: '68px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-input)', flexShrink: 0 }}>
                            <img src={item.image_url} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.95rem', marginBottom: '2px' }}>{item.item_name}</h4>
                          {item.price && <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem' }}>₹{Number(item.price).toLocaleString()}</div>}
                          {item.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{item.description}</p>}

                          <div className="flex gap-sm mt-sm items-center" style={{ flexWrap: 'wrap' }}>
                            {item.platform && item.platform !== 'other' && (
                              <span className={`platform-badge platform-${item.platform}`}>{item.platform}</span>
                            )}
                            {item.product_url && (
                              <a href={item.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>View product →</a>
                            )}
                          </div>

                          <div style={{ marginTop: 'var(--space-sm)' }}>
                            {isClaimed && !isClaimedByMe ? (
                              <span className="badge badge-warning">Someone is getting this!</span>
                            ) : isClaimedByMe ? (
                              <button onClick={() => unclaimGift(item.id)} className="btn btn-secondary btn-sm">Unclaim this gift</button>
                            ) : (
                              <button onClick={() => claimGift(item.id)} className="btn btn-success btn-sm">🎁 I'll get this!</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
