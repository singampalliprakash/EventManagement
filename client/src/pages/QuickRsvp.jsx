import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { rsvpService } from '../services/services';

export default function QuickRsvp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    const submitQuickRsvp = async () => {
      const response = searchParams.get('status');
      const guest_token = searchParams.get('guest');
      const event_id = searchParams.get('event');
      const share_code = searchParams.get('code');

      if (!response || !guest_token || !event_id) {
        setStatus('error');
        setError('Invalid RSVP link.');
        return;
      }

      try {
        await rsvpService.submit(event_id, {
          guest_token,
          response,
          member_count: 1, // Default for quick RSVP
          message: 'RSVP via One-Click'
        });
        
        setStatus('success');
        
        // Redirect to full event page after a short delay
        setTimeout(() => {
          navigate(`/event/${share_code}?guest=${guest_token}`);
        }, 2000);
      } catch (err) {
        console.error(err);
        setStatus('error');
        setError(err.response?.data?.error || 'Failed to record response.');
      }
    };

    submitQuickRsvp();
  }, [searchParams, navigate]);

  return (
    <div className="page flex flex-col items-center justify-center text-center" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="card-glass p-xl animation-fade-in" style={{ maxWidth: '400px' }}>
        {status === 'processing' && (
          <>
            <div className="spinner mb-md" style={{ width: '50px', height: '50px', margin: '0 auto' }}></div>
            <h2 className="mb-sm">Processing...</h2>
            <p style={{ color: 'var(--text-muted)' }}>Recording your response for the event.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎉</div>
            <h2 className="mb-sm">Response Recorded!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Thank you for your response. We're redirecting you to the event details now...</p>
            <div className="progress-bar-container" style={{ height: '4px' }}>
              <div className="progress-bar-fill shimmer" style={{ width: '100%', animation: 'shimmer 2s linear' }}></div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>😕</div>
            <h2 className="mb-sm" style={{ color: 'var(--danger)' }}>Oops!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>{error}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary btn-block">Go Home</button>
          </>
        )}
      </div>
    </div>
  );
}
