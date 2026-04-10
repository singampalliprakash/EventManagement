import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { eventService, wishlistService, rsvpService } from '../services/services';
import { useToast, EVENT_ICONS, EVENT_LABELS, formatDate } from '../utils/helpers.jsx';

export default function GuestView() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('guest');
  const { showToast, ToastContainer } = useToast();

  const [event, setEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStats, setRsvpStats] = useState(null);
  const [rsvpForm, setRsvpForm] = useState({ response: '', member_count: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [claimingItem, setClaimingItem] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { loadEvent(); }, [code]);

  const loadEvent = async () => {
    try {
      const res = await eventService.getByShareCode(code);
      if (!res.data?.event) {
        setError('Celebration not found. The link may have expired.');
        setLoading(false);
        return;
      }
      setEvent(res.data.event);
      try {
        const statsRes = await rsvpService.getStats(res.data.event.id);
        setRsvpStats(statsRes.data.stats);
      } catch (err) { /* stats optional */ }
    } catch (err) {
      setError('Event not found or link expired.');
    } finally {
      setLoading(false);
    }
  };

  const submitRsvp = async () => {
    if (!rsvpForm.response) { showToast('Please select your response!', 'warning'); return; }
    if (!guestToken) { showToast('Invalid invite link. Please open from WhatsApp.', 'error'); return; }

    setSubmittingRsvp(true);
    try {
      await rsvpService.submit(event.id, {
        guest_token: guestToken,
        response: rsvpForm.response,
        member_count: parseInt(rsvpForm.member_count) || 1,
        message: rsvpForm.message,
      });
      showToast('Response sent! 🎉');
      setRsvpSubmitted(true);
      loadEvent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit. Please try again.', 'error');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const claimGift = async (itemId) => {
    if (!guestToken) { showToast('Invalid invite link', 'error'); return; }
    setClaimingItem(itemId);
    try {
      await wishlistService.claimItem(itemId, guestToken);
      showToast('Gift claimed! 🎁 No one else will pick this.');
      loadEvent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to claim gift', 'error');
    } finally {
      setClaimingItem(null);
    }
  };

  const unclaimGift = async (itemId) => {
    if (!guestToken) return;
    setClaimingItem(itemId);
    try {
      await wishlistService.unclaimItem(itemId, guestToken);
      showToast('Gift unclaimed');
      loadEvent();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed', 'error');
    } finally {
      setClaimingItem(null);
    }
  };

  // Check if an item was claimed by the current guest using server data
  const isClaimedByMe = (item) =>
    item.claimedBy && guestToken && item.claimedBy.access_token === guestToken;

  useEffect(() => {
    if (!event?.event_date) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(event.event_date).getTime() - now;
      
      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [event]);

  if (loading) return (
    <div style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: '44px', height: '44px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: 'var(--text-muted)', marginTop: '20px', fontSize: '0.9rem' }}>Loading celebration...</p>
    </div>
  );

  if (error || !event) return (
    <div className="auth-page" style={{ justifyContent: 'center', textAlign: 'center', padding: 'var(--space-xl)', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>😕</div>
      <h2 style={{ marginBottom: 'var(--space-sm)', color: 'white' }}>{error?.includes('Network') || error?.includes('link') ? 'Connection Issue' : 'Celebration Not Found'}</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto var(--space-lg)' }}>
        {error || 'This event link may be invalid or the server is temporarily unreachable.'}
      </p>
      <div className="flex flex-col gap-sm">
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ borderRadius: '12px' }}>
          🔄 Try Refreshing
        </button>
        <button onClick={() => window.location.href = '/'} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  const totalRsvp = Number(rsvpStats?.yes || 0) + Number(rsvpStats?.no || 0) + Number(rsvpStats?.maybe || 0);


  return (
    <div className="page">
      <ToastContainer />

      {/* Event Header & Banner */}
      {event.image_url && (
        <div style={{ padding: 'var(--space-md) var(--space-sm) 0' }}>
          <img 
            src={event.image_url} 
            alt="Event" 
            style={{ width: '100%', borderRadius: '24px', maxHeight: '300px', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }} 
          />
        </div>
      )}
      <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0 var(--space-md)' }}>
        <h1 className="text-gradient" style={{ fontSize: '1.7rem', marginBottom: '6px' }}>{event?.title || 'Event Celebration'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {event?.custom_type || EVENT_LABELS[event?.event_type || 'other']}
        </p>
      </div>

      <Countdown timeLeft={timeLeft} />

      {/* Info Card */}
      <div className="card card-glass mb-md" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2xl)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📅 Date & Time</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              {new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
          </div>
          {event.venue && (
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>📍 Venue</div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem', 
                  color: 'var(--primary-light)', 
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{event.venue}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  background: 'rgba(108, 92, 231, 0.1)', 
                  padding: '4px 10px', 
                  borderRadius: '10px',
                  border: '1px solid var(--primary-light)'
                }}>
                  🧭 Get Directions
                </span>
              </a>
            </div>
          )}
        </div>
        {event.description && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 'var(--space-md)', lineHeight: 1.6 }}>{event.description}</p>
        )}
      </div>

      {/* ── Section 1: RSVP ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--primary-light), transparent)' }}></div>
        <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px' }}>YOUR RESPONSE</div>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, var(--primary-light), transparent)' }}></div>
      </div>

      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        {!rsvpSubmitted ? (
          <div className="card mb-md" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', textAlign: 'center' }}>Will you be attending?</h3>

            {!guestToken && (
              <div style={{ background: 'rgba(255,234,0,0.1)', border: '1px solid var(--warning)', borderRadius: '12px', padding: '12px', marginBottom: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center' }}>
                ⚠️ Viewing as Guest. Open the link from WhatsApp to confirm your attendance.
              </div>
            )}

            {/* Yes / Maybe / No */}
            <div className="flex gap-sm mb-md">
              {[
                { value: 'yes',   label: '✓ Yes!',  color: 'var(--rsvp-yes)' },
                { value: 'maybe', label: '? Maybe', color: 'var(--rsvp-maybe)' },
                { value: 'no',    label: '✕ No',    color: 'var(--rsvp-no)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRsvpForm({ ...rsvpForm, response: opt.value })}
                  style={{
                    flex: 1, padding: '20px 8px', borderRadius: 'var(--radius-lg)',
                    border: rsvpForm.response === opt.value ? `2px solid ${opt.color}` : '1px solid var(--border-glass-light)',
                    background: rsvpForm.response === opt.value ? `${opt.color}25` : 'rgba(255,255,255,0.03)',
                    color: rsvpForm.response === opt.value ? '#FFF' : 'var(--text-secondary)',
                    boxShadow: rsvpForm.response === opt.value ? `0 0 15px ${opt.color}40` : 'none',
                    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700,
                    transition: 'all var(--transition-bounce)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>{opt.label.split(' ')[0]}</span>
                  <span>{opt.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            {/* Guest count */}
            <div className="form-group" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Number of Guests (including you)</label>
              <div className="flex items-center justify-center gap-md mt-sm">
                <button onClick={() => setRsvpForm({ ...rsvpForm, member_count: Math.max(1, rsvpForm.member_count - 1) })}
                  className="btn btn-secondary" style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, fontSize: '1.4rem' }}>−</button>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, minWidth: '40px' }}>{rsvpForm.member_count}</span>
                <button onClick={() => setRsvpForm({ ...rsvpForm, member_count: Math.min(20, rsvpForm.member_count + 1) })}
                  className="btn btn-secondary" style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, fontSize: '1.4rem' }}>+</button>
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Message (optional)</label>
              <textarea className="form-input" placeholder="Any message for the host..."
                rows={2} value={rsvpForm.message}
                onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })} />
            </div>

            <button onClick={submitRsvp} className="btn btn-primary btn-block btn-lg"
              disabled={!rsvpForm.response || submittingRsvp || !guestToken}
              style={{ marginTop: 'var(--space-md)', padding: '18px', borderRadius: '16px', fontSize: '1.1rem', boxShadow: '0 8px 24px rgba(65,105,225,0.3)' }}>
              {submittingRsvp ? <span className="spinner"></span>
               : !guestToken ? 'Invite Link Required'
               : 'Confirm My Attendance 🥳'}
            </button>
          </div>
        ) : (
          <div className="card mb-md" style={{
            padding: '40px 24px', textAlign: 'center',
            background: 'linear-gradient(135deg,rgba(0,230,118,0.1),rgba(65,105,225,0.1))',
            border: '2px solid var(--success)', borderRadius: '32px',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>✨🙌✨</div>
            <h2 style={{ marginBottom: 'var(--space-sm)', color: 'white' }}>
              {rsvpForm.response === 'yes' ? 'See you there!' : rsvpForm.response === 'maybe' ? 'Maybe see you!' : 'Thanks for letting us know!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Your response has been sent to the host. 🥳
            </p>
          </div>
        )}


      </div>

      {/* ── Section 2: Wishlist ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, var(--accent-pink), transparent)' }}></div>
        <div style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1px' }}>GIFT REGISTRY</div>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, var(--accent-pink), transparent)' }}></div>
      </div>

      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        {event.wishlistItems?.length > 0 ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
              Want to get something for the celebration? Pick a gift below!
            </p>
            <div className="flex flex-col gap-sm">
              {event.wishlistItems.map((item) => {
                const claimed = item.status === 'claimed';
                const myItem = isClaimedByMe(item);
                const isLoading = claimingItem === item.id;

                return (
                  <div key={item.id} className="card card-glass" style={{
                    padding: 'var(--space-md)',
                    opacity: claimed && !myItem ? 0.65 : 1,
                    border: myItem ? '1px solid var(--success)' : '1px solid var(--border-glass)',
                    transition: 'all 0.3s ease',
                  }}>
                    <div className="flex gap-md">
                      {item.image_url && (
                        <div style={{ width: '80px', height: '80px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                          <img src={item.image_url} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>{item.item_name}</h4>
                        {item.price && <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '1.05rem', marginBottom: '4px' }}>₹{Number(item.price).toLocaleString()}</div>}
                        {item.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>{item.description}</p>}
                        {item.product_url && (
                          <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.78rem', color: 'var(--primary-light)', display: 'inline-block', marginBottom: '10px' }}>
                            🔗 View product →
                          </a>
                        )}

                        <div style={{ marginTop: '4px' }}>
                          {claimed && !myItem ? (
                            <div style={{ color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1.1rem' }}>🤝</span> Someone is already getting this!
                            </div>
                          ) : myItem ? (
                            <div className="flex flex-col gap-sm">
                              <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700 }}>🎁 You've claimed this gift!</span>
                              <button
                                onClick={() => unclaimGift(item.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.75rem' }}
                                disabled={isLoading}
                              >
                                {isLoading ? <span className="spinner"></span> : 'Cancel Claim'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => claimGift(item.id)}
                              className="btn btn-primary btn-sm"
                              style={{ background: 'var(--primary-gradient)', border: 'none', padding: '10px 18px', borderRadius: '12px' }}
                              disabled={!guestToken || isLoading}
                            >
                              {isLoading ? <span className="spinner"></span> : '🎁 I Will Get This!'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center', opacity: 0.8 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎁</div>
            <p style={{ color: 'var(--text-muted)' }}>The host hasn't added any gift preferences yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 'var(--space-xl) 0 80px', textAlign: 'center', opacity: 0.4, fontSize: '0.75rem' }}>
        <p>Made with ❤️ by EventWise</p>
      </div>

      {/* Floating WhatsApp Contact */}
      {event.host?.phone && (
        <a
          href={`https://wa.me/${event.host.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${event.host.name}, I have a question about the ${event.title} celebration!`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: '#25D366', color: 'white',
            width: '60px', height: '60px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
            zIndex: 1000, transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          📱
        </a>
      )}
    </div>
  );
}
function Countdown({ timeLeft }) {
  if (!timeLeft) return null;
  return (
    <div style={{ 
      display: 'flex', justifyContent: 'center', gap: '8px', 
      padding: '12px', background: 'rgba(255,255,255,0.03)', 
      borderRadius: '16px', margin: '0 20px 20px',
      border: '1px solid var(--border-glass-light)'
    }}>
      {[
        { l: 'Days', v: timeLeft.days },
        { l: 'Hrs', v: timeLeft.hours },
        { l: 'Min', v: timeLeft.minutes },
        { l: 'Sec', v: timeLeft.seconds }
      ].map((t, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-light)' }}>{t.v}</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.l}</div>
        </div>
      ))}
    </div>
  );
}
