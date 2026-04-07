import { useState, useEffect, useRef } from 'react';
import { rsvpService, wishlistService } from '../services/services';

export default function HostDashboard({ eventId, onDataUpdate }) {
  const [rsvpData, setRsvpData] = useState(null);
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollingInterval = useRef(null);

  // Load data
  const loadData = async () => {
    try {
      setError(null);
      const [rsvpRes, wishlistRes] = await Promise.all([
        rsvpService.getPoll(eventId),
        wishlistService.getSummary(eventId),
      ]);
      setRsvpData(rsvpRes.data);
      setWishlistData(wishlistRes);
      onDataUpdate?.({ rsvp: rsvpRes.data, wishlist: wishlistRes });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load data');
    }
    setLoading(false);
  };

  // Set up polling
  useEffect(() => {
    loadData();

    if (autoRefresh) {
      pollingInterval.current = setInterval(loadData, 5000); // Poll every 5 seconds
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [eventId, autoRefresh]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;
  }

  const rsvp = rsvpData?.summary || {};
  const items = wishlistData?.items || [];

  return (
    <div className="host-dashboard">
      {/* Control Panel */}
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (every 5s)
        </label>
        <button
          onClick={loadData}
          style={{
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Refresh Now
        </button>
      </div>

      {/* RSVP Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>📊 RSVP Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={statBoxStyle('#4CAF50')}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rsvp.yes || 0}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Confirmed</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {rsvp.expectedPeople || 0} people
            </div>
          </div>

          <div style={statBoxStyle('#FF9800')}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rsvp.maybe || 0}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Maybe</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {rsvp.possiblePeople - rsvp.expectedPeople || 0} possible
            </div>
          </div>

          <div style={statBoxStyle('#f44336')}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rsvp.no || 0}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Declined</div>
          </div>

          <div style={statBoxStyle('#2196F3')}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{rsvp.total || 0}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Responses</div>
          </div>
        </div>

        {/* Planning Insights */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
          <h3>🍽️ Food & Seating Planning</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li><strong>Expected guests:</strong> {rsvp.expectedPeople || 0} people</li>
            <li><strong>If maybes attend:</strong> {rsvp.possiblePeople || 0} people</li>
            <li>
              <strong>Seat arrangement:</strong> Plan for at least {Math.ceil((rsvp.possiblePeople || 0) / 6)} tables (6 people per table)
            </li>
            <li>
              <strong>Food quantity:</strong> Minimum {rsvp.expectedPeople || 0} portions, maximum {rsvp.possiblePeople || 0} portions
            </li>
          </ul>
        </div>
      </div>

      {/* Responses by Category */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Yes Responses */}
        <div>
          <h3>✅ Confirmed ({(rsvpData?.yesResponses || []).length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {(rsvpData?.yesResponses || []).map((guest) => (
              <div key={guest.id} style={guestCardStyle}>
                <div style={{ fontWeight: 'bold' }}>{guest.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {guest.members} {guest.members === 1 ? 'person' : 'people'}
                </div>
                {guest.message && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', fontStyle: 'italic' }}>"{guest.message}"</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Maybe Responses */}
        <div>
          <h3>❓ Maybe ({(rsvpData?.maybeResponses || []).length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {(rsvpData?.maybeResponses || []).map((guest) => (
              <div key={guest.id} style={guestCardStyle}>
                <div style={{ fontWeight: 'bold' }}>{guest.name}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  {guest.members} {guest.members === 1 ? 'person' : 'people'}
                </div>
                {guest.message && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', fontStyle: 'italic' }}>"{guest.message}"</div>}
              </div>
            ))}
          </div>
        </div>

        {/* No Responses */}
        <div>
          <h3>❌ Declined ({(rsvpData?.noResponses || []).length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {(rsvpData?.noResponses || []).map((guest) => (
              <div key={guest.id} style={guestCardStyle}>
                <div style={{ fontWeight: 'bold' }}>{guest.name}</div>
                {guest.message && <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', fontStyle: 'italic' }}>"{guest.message}"</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wishlist Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>🎁 Wishlist ({wishlistData?.totalItems || 0} items)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Claimed Items */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px' }}>
            <h4>Claimed: {wishlistData?.claimedItems || 0}</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              ✓ {items.filter((i) => i.status === 'claimed').length} items claimed by guests
            </div>
          </div>

          {/* Available Items */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px' }}>
            <h4>Available: {wishlistData?.availableItems || 0}</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Need to be claimed: {items.filter((i) => i.status !== 'claimed').length} items
            </div>
          </div>

          {/* Total Value */}
          <div style={{ padding: '1rem', backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: '8px' }}>
            <h4>Est. Value</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              ₹{(wishlistData?.estimatedValue || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Wishlist Items List */}
        {items.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Items Detail</h4>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {items.map((item) => (
                <div key={item.id} style={wishlistItemStyle}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '1rem' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    {item.price && <div style={{ fontSize: '0.9rem', color: '#4CAF50' }}>₹{item.price}</div>}
                    {item.claimedBy && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: '#666' }}>
                        📦 Claimed by: <strong>{item.claimedBy.name}</strong>
                      </div>
                    )}
                    {item.status !== 'claimed' && (
                      <div style={{ fontSize: '0.85rem', marginTop: '0.3rem', color: '#FF9800' }}>
                        ⚠️ Not yet claimed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper styles
const statBoxStyle = (color) => ({
  padding: '1.5rem',
  backgroundColor: color,
  color: 'white',
  borderRadius: '8px',
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
});

const guestCardStyle = {
  padding: '0.75rem',
  marginBottom: '0.5rem',
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: '4px',
  borderLeft: '3px solid var(--primary-color)',
};

const wishlistItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '1rem',
  marginBottom: '0.5rem',
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: '4px',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
};
