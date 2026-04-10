import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, wishlistService, rsvpService, inviteService, contactService } from '../services/services';
import HostDashboard from '../components/HostDashboard';
import { useToast, EVENT_ICONS, EVENT_LABELS, formatDate, formatDateTime, daysUntil } from '../utils/helpers';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [event, setEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [rsvpStats, setRsvpStats] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [itemForm, setItemForm] = useState({ item_name: '', description: '', product_url: '', price: '', image_url: '' });
  const [rsvpList, setRsvpList] = useState([]);
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      const [eventRes, statsRes, invRes, rsvpRes] = await Promise.all([
        eventService.getOne(id),
        rsvpService.getStats(id),
        inviteService.getAll(id),
        rsvpService.getList(id),
      ]);
      setEvent(eventRes.data.event);
      setRsvpStats(statsRes.data.stats);
      setInvitations(invRes.data.invitations || []);
      setRsvpList(rsvpRes.data.responses || []);
    } catch { showToast('Failed to load event data', 'error'); }
    setLoading(false);
  };

  const loadContacts = async () => {
    try {
      const res = await contactService.getAll();
      setContacts(res.data.contacts || []);
    } catch { /* ignore */ }
  };

  // Wishlist handlers
  const addWishlistItem = async () => {
    if (!itemForm.item_name) { showToast('Item name is required!', 'warning'); return; }
    
    setSavingItem(true);
    try {
      // 1. Clean the price (strip symbols like ₹ and commas)
      const rawPrice = itemForm.price.toString().replace(/[^0-9.]/g, '');
      const cleanPrice = rawPrice ? parseFloat(rawPrice) : null;

      await wishlistService.addItem(id, { 
        ...itemForm, 
        price: isNaN(cleanPrice) ? null : cleanPrice 
      });
      
      showToast('Item added to wishlist! 🎁');
      setItemForm({ item_name: '', description: '', product_url: '', price: '', image_url: '' });
      setShowAddItem(false);
      loadAll();
    } catch (err) { 
      console.error('Wishlist error:', err);
      showToast(err.response?.data?.error || 'Failed to add item. Check your internet.', 'error'); 
    } finally {
      setSavingItem(false);
    }
  };

  const deleteWishlistItem = async (itemId) => {
    try {
      await wishlistService.deleteItem(itemId);
      showToast('Item removed');
      loadAll();
    } catch { showToast('Failed to delete', 'error'); }
  };

  // Invite handlers
  const openInviteModal = () => {
    loadContacts();
    setShowInviteModal(true);
  };

  const sendInvitations = async () => {
    if (selectedContacts.length === 0) { showToast('Select at least one contact', 'error'); return; }
    try {
      const res = await inviteService.create(id, selectedContacts);
      const createdCount = res.data.results?.filter(r => r.status === 'created').length || 0;
      
      setShowInviteModal(false);
      setSelectedContacts([]);
      loadAll();

      if (createdCount > 0) {
        const newInvites = res.data.results?.filter(r => r.status === 'created').map(r => r.invitation.id) || [];
        for (const inviteId of newInvites) {
          await sendWhatsApp(inviteId);
          await new Promise(r => setTimeout(r, 800));
        }
      } else {
        showToast('Guest list updated!');
      }
    } catch (err) {
      console.error('Invite Error:', err);
      showToast(err.response?.data?.error || 'Failed to add guests', 'error');
    }
  };

  const sendAllWhatsApp = async () => {
    const pending = invitations.filter(inv => inv.status === 'pending');
    if (pending.length === 0) { showToast('No pending invitations', 'warning'); return; }
    for (const inv of pending) {
      await sendWhatsApp(inv.id);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  const sendWhatsApp = async (inviteId) => {
    try {
      const res = await inviteService.getWhatsAppLink(id, inviteId);
      window.open(res.data.whatsappUrl, '_blank');
      await inviteService.updateStatus(inviteId, 'sent');
      loadAll();
      showToast('Opening WhatsApp...');
    } catch { showToast('Failed to generate link', 'error'); }
  };

  const deleteEvent = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await eventService.delete(id);
      showToast('Event deleted');
      navigate('/dashboard');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/event/${event.share_code}`;
    navigator.clipboard.writeText(link);
    showToast('Share link copied! 🔗');
  };

  if (loading) return <div className="loading-page"><div className="spinner"></div></div>;
  if (!event) return <div className="page"><p>Event not found</p></div>;

  const totalRsvp = (rsvpStats?.yes || 0) + (rsvpStats?.no || 0) + (rsvpStats?.maybe || 0);

  return (
    <div className="page">
      <ToastContainer />

      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{EVENT_LABELS[event.event_type]}</p>
        </div>
        <div className="flex gap-xs">
          <button onClick={() => navigate(`/edit-event/${id}`)} className="btn btn-secondary btn-sm">✏️</button>
          <button onClick={deleteEvent} className="btn btn-danger btn-sm">🗑️</button>
        </div>
      </div>

      {/* Event Info Card */}
      <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
          {event.image_url && (
            <div style={{ width: '100%', marginBottom: 'var(--space-md)' }}>
              <img src={event.image_url} alt="Event" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '150px', objectFit: 'cover' }} />
            </div>
          )}
          <div className="flex gap-md items-center">
            <div className={`event-icon event-icon-${event.event_type}`} style={{ width: '52px', height: '52px', fontSize: '1.6rem' }}>
              {EVENT_ICONS[event.event_type]}
            </div>
            <div>
            <div className="flex items-center gap-sm mb-sm">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📅 {formatDate(event.event_date)}</span>
            </div>
            {event.venue && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {event.venue}</div>
            )}
          </div>
        </div>
        <div className="flex gap-sm mt-md">
          <button onClick={copyShareLink} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>🔗 Copy Link</button>
          <button onClick={openInviteModal} className="btn btn-primary btn-sm" style={{ flex: 1 }}>👥 Add Guests</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['dashboard', 'overview', 'wishlist', 'guests', 'invites'].map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'dashboard' && '📈 Dashboard'}
            {tab === 'overview' && '📊 Overview'}
            {tab === 'wishlist' && `🎁 Wishlist (${event.wishlistItems?.length || 0})`}
            {tab === 'guests' && `👥 Guests (${totalRsvp})`}
            {tab === 'invites' && `📨 Invites (${invitations.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <HostDashboard eventId={id} onDataUpdate={(data) => {}} />
      )}

      {activeTab === 'overview' && (
        <div>
          {event.description && (
            <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
              <h4 style={{ marginBottom: 'var(--space-sm)', fontSize: '0.9rem' }}>About</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{event.description}</p>
            </div>
          )}

          <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
            <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>RSVP Progress</h4>
            {totalRsvp === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 'var(--space-md)' }}>No responses yet. Send invitations!</p>
            ) : (
              <>
                <div className="progress-container">
                  <div className="progress-header">
                    <span className="progress-label" style={{ color: 'var(--rsvp-yes)' }}>✓ Yes</span>
                    <span className="progress-value">{rsvpStats?.yes || 0}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill progress-yes" style={{ width: `${totalRsvp ? ((rsvpStats?.yes || 0) / totalRsvp * 100) : 0}%` }}></div></div>
                </div>
                <div className="progress-container">
                  <div className="progress-header">
                    <span className="progress-label" style={{ color: 'var(--rsvp-maybe)' }}>? Maybe</span>
                    <span className="progress-value">{rsvpStats?.maybe || 0}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill progress-maybe" style={{ width: `${totalRsvp ? ((rsvpStats?.maybe || 0) / totalRsvp * 100) : 0}%` }}></div></div>
                </div>
                <div className="progress-container">
                  <div className="progress-header">
                    <span className="progress-label" style={{ color: 'var(--rsvp-no)' }}>✕ No</span>
                    <span className="progress-value">{rsvpStats?.no || 0}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill progress-no" style={{ width: `${totalRsvp ? ((rsvpStats?.no || 0) / totalRsvp * 100) : 0}%` }}></div></div>
                </div>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-sm">
            <div className="card" style={{ flex: 1, padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-green)' }}>{rsvpStats?.totalMembers || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confirmed<br/>Guests</div>
            </div>
            <div className="card" style={{ flex: 1, padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>{event.wishlistItems?.length || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Wishlist<br/>Items</div>
            </div>
            <div className="card" style={{ flex: 1, padding: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-orange)' }}>{invitations.length}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Invites<br/>Sent</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div>
          <button onClick={() => setShowAddItem(true)} className="btn btn-primary btn-block mb-md" id="add-wishlist-item">
            + Add Wishlist Item
          </button>

          {showAddItem && (
            <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
              <h4 style={{ marginBottom: 'var(--space-md)' }}>Add Gift Item</h4>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-input" placeholder="e.g., Kitchen Mixer" value={itemForm.item_name} onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Product URL (Amazon, Flipkart, Meesho...)</label>
                <input className="form-input" placeholder="https://www.amazon.in/..." value={itemForm.product_url} onChange={(e) => setItemForm({ ...itemForm, product_url: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input" type="number" placeholder="1999" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input className="form-input" placeholder="https://..." value={itemForm.image_url} onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="Color, size, model preference..." rows={2} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
              </div>
              <div className="flex gap-sm">
                <button 
                  onClick={() => !savingItem && setShowAddItem(false)} 
                  className="btn btn-secondary" style={{ flex: 1 }}
                  disabled={savingItem}
                >
                  Cancel
                </button>
                <button 
                  onClick={addWishlistItem} 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={savingItem}
                >
                  {savingItem ? <span className="spinner"></span> : 'Add Item'}
                </button>
              </div>
            </div>
          )}

          {(!event.wishlistItems || event.wishlistItems.length === 0) && !showAddItem ? (
            <div className="empty-state">
              <div className="icon">🎁</div>
              <h3>No wishlist items yet</h3>
              <p>Add gifts you'd love to receive from your guests!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {event.wishlistItems?.map((item) => (
                <div key={item.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="flex gap-md">
                    {item.image_url && (
                      <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-input)', flexShrink: 0 }}>
                        <img src={item.image_url} alt={item.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center justify-between">
                        <h4 style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item_name}</h4>
                        <span className={`badge ${item.status === 'claimed' ? 'badge-warning' : 'badge-success'}`}>
                          {item.status === 'claimed' ? 'Claimed' : 'Available'}
                        </span>
                      </div>
                      {item.price && <div style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>₹{Number(item.price).toLocaleString()}</div>}
                      {item.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{item.description}</p>}
                      {item.claimedBy && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Claimed by: {item.claimedBy.name}</p>}
                      <div className="flex gap-sm mt-sm items-center">
                        {item.platform && item.platform !== 'other' && (
                          <span className={`platform-badge platform-${item.platform}`}>{item.platform}</span>
                        )}
                        {item.product_url && (
                          <a href={item.product_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem' }}>View product →</a>
                        )}
                        <button onClick={() => deleteWishlistItem(item.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'guests' && (
        <div>
          {event.rsvpResponses?.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <h3>No RSVP responses yet</h3>
              <p>Guests will appear here once they respond to your invitation.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {event.rsvpResponses?.map((rsvp) => (
                <div key={rsvp.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 style={{ fontSize: '0.95rem' }}>{rsvp.guest?.name || 'Guest'}</h4>
                      {rsvp.guest?.phone && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{rsvp.guest.phone}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${rsvp.response === 'yes' ? 'badge-success' : rsvp.response === 'no' ? 'badge-danger' : 'badge-warning'}`}>
                        {rsvp.response === 'yes' ? '✓ Yes' : rsvp.response === 'no' ? '✕ No' : '? Maybe'}
                      </span>
                    </div>
                  </div>
                  {rsvp.message && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 'var(--space-sm)', fontStyle: 'italic' }}>"{rsvp.message}"</p>
                  )}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                    {formatDateTime(rsvp.responded_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'invites' && (
        <div>
          <div className="flex gap-sm mb-md">
            <button onClick={openInviteModal} className="btn btn-primary" style={{ flex: 1 }}>
              + Create Invitations
            </button>
            {invitations.some(inv => inv.status === 'pending') && (
              <button onClick={sendAllWhatsApp} className="btn btn-whatsapp" style={{ flex: 1 }}>
                📱 Send All
              </button>
            )}
          </div>

          {invitations.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📨</div>
              <h3>No invitations yet</h3>
              <p>Select contacts and send invitations via WhatsApp!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {/* Individual List */}
              {invitations.map((inv) => (
                <div key={inv.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.95rem' }}>{inv.contact?.name}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inv.contact?.phone}</p>
                      <div className="mt-xs">
                        <span className={`badge status-${inv.status}`} style={{ fontSize: '0.7rem' }}>{inv.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => sendWhatsApp(inv.id)}
                      className="btn btn-whatsapp btn-sm"
                      style={{ borderRadius: '12px', padding: '10px 16px' }}
                    >
                      📱 {inv.status === 'pending' ? 'Send' : 'Resend'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Guests to Event</h3>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Select from Contacts</h4>
            </div>

            {contacts.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No contacts yet.</p>
                <button onClick={() => { setShowInviteModal(false); navigate('/contacts'); }} className="btn btn-primary btn-sm mt-md">
                  + Add Contacts
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-sm" style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: 'var(--space-md)' }}>
                  {contacts.map((contact) => {
                    const alreadyInvited = invitations.some((inv) => inv.contact_id === contact.id);
                    const isSelected = selectedContacts.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => {
                          if (alreadyInvited) return;
                          setSelectedContacts((prev) =>
                            prev.includes(contact.id) ? prev.filter((c) => c !== contact.id) : [...prev, contact.id]
                          );
                        }}
                        className="card"
                        style={{
                          padding: 'var(--space-md)',
                          cursor: alreadyInvited ? 'default' : 'pointer',
                          opacity: alreadyInvited ? 0.5 : 1,
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'rgba(108, 92, 231, 0.1)' : 'var(--bg-card)',
                        }}
                      >
                        <div className="flex items-center gap-md">
                          <div style={{
                            width: '24px', height: '24px', borderRadius: 'var(--radius-sm)',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.7rem', flexShrink: 0,
                          }}>
                            {isSelected && '✓'}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.9rem' }}>{contact.name}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{contact.phone}</p>
                          </div>
                          {alreadyInvited && <span className="badge badge-info" style={{ marginLeft: 'auto' }}>Already invited</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={sendInvitations}
                  className="btn btn-primary btn-block"
                  disabled={selectedContacts.length === 0}
                >
                  Add {selectedContacts.length} Guest{selectedContacts.length !== 1 ? 's' : ''} to Event
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
