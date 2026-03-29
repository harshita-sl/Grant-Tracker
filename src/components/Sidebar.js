import React, { useState } from 'react';
import { submitGrant, reviewGrant, disburseGrant } from './Soroban';

const Sidebar = ({ walletAddress, onGrantSubmitted, onAction }) => {
  const [grantForm, setGrantForm] = useState({
    title: '',
    description: '',
    applicant: '',
    amount: ''
  });
  const [adminAction, setAdminAction] = useState({
    grantId: '',
    action: '' // 'review' or 'disburse'
  });
  const [loading, setLoading] = useState({ submit: false, review: false, disburse: false });

  const handleGrantSubmit = async () => {
    if (!walletAddress) return alert('Connect wallet first');
    if (!grantForm.title.trim() || !grantForm.description.trim() || !grantForm.applicant.trim() || !grantForm.amount) {
      return alert('Please fill in all fields');
    }
    const amount = parseInt(grantForm.amount);
    if (isNaN(amount) || amount <= 0) return alert('Please enter a valid amount');

    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const id = await submitGrant(walletAddress, grantForm.title, grantForm.description, grantForm.applicant, amount);
      alert(`Grant submitted — ID #${id}`);
      setGrantForm({ title: '', description: '', applicant: '', amount: '' });
      onGrantSubmitted();
    } catch (e) {
      alert('Submit failed: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const handleReview = async (decision) => {
    if (!walletAddress) return alert('Connect wallet first');
    const grantId = parseInt(adminAction.grantId);
    if (isNaN(grantId) || grantId <= 0) return alert('Please enter a valid grant ID');

    setLoading(prev => ({ ...prev, review: true }));
    try {
      await reviewGrant(walletAddress, grantId, decision);
      alert(`Grant #${grantId} ${decision ? 'APPROVED' : 'REJECTED'}`);
      setAdminAction({ grantId: '', action: '' });
      onAction();
    } catch (e) {
      alert('Review failed: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, review: false }));
    }
  };

  const handleDisburse = async () => {
    if (!walletAddress) return alert('Connect wallet first');
    const grantId = parseInt(adminAction.grantId);
    if (isNaN(grantId) || grantId <= 0) return alert('Please enter a valid grant ID');

    setLoading(prev => ({ ...prev, disburse: true }));
    try {
      await disburseGrant(walletAddress, grantId);
      alert(`Grant #${grantId} funds DISBURSED`);
      setAdminAction({ grantId: '', action: '' });
      onAction();
    } catch (e) {
      alert('Disburse failed: ' + e.message);
    } finally {
      setLoading(prev => ({ ...prev, disburse: false }));
    }
  };

  return (
    <aside style={{
      borderRight: '2px solid var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--cream)'
    }}>
      {/* Submit Grant */}
      <div style={{
        padding: '32px 32px 28px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--ink)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            borderRadius: '2px',
            flexShrink: 0
          }}>✦</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)'
          }}>Submit Grant</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,15,0.5)',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px'
            }}>Title</label>
            <input
              type="text"
              placeholder="Grant title..."
              value={grantForm.title}
              onChange={e => setGrantForm(prev => ({ ...prev, title: e.target.value }))}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                padding: '9px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: '3px',
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                width: '100%'
              }}
            />
          </div>

          <div>
            <label style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,15,0.5)',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px'
            }}>Description</label>
            <textarea
              placeholder="Detailed description..."
              value={grantForm.description}
              onChange={e => setGrantForm(prev => ({ ...prev, description: e.target.value }))}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                padding: '9px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: '3px',
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                resize: 'none',
                height: '80px',
                width: '100%'
              }}
            />
          </div>

          <div>
            <label style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,15,0.5)',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px'
            }}>Applicant</label>
            <input
              type="text"
              placeholder="Your name/organization..."
              value={grantForm.applicant}
              onChange={e => setGrantForm(prev => ({ ...prev, applicant: e.target.value }))}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                padding: '9px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: '3px',
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                width: '100%'
              }}
            />
          </div>

          <div>
            <label style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,15,0.5)',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px'
            }}>Amount</label>
            <input
              type="number"
              placeholder="Requested amount..."
              value={grantForm.amount}
              onChange={e => setGrantForm(prev => ({ ...prev, amount: e.target.value }))}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                padding: '9px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: '3px',
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                width: '100%'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleGrantSubmit}
          disabled={loading.submit}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: loading.submit ? 'var(--border)' : 'var(--ink)',
            color: 'var(--gold)',
            border: 'none',
            borderRadius: '3px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: loading.submit ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {loading.submit ? 'Submitting...' : 'Submit Grant'}
        </button>
      </div>

      {/* Admin Actions */}
      <div style={{
        padding: '32px 32px 28px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--ink)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            borderRadius: '2px',
            flexShrink: 0
          }}>⚡</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)'
          }}>Admin Actions</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,15,0.5)',
              fontWeight: 500,
              display: 'block',
              marginBottom: '4px'
            }}>Grant ID</label>
            <input
              type="number"
              placeholder="Grant ID to act on..."
              value={adminAction.grantId}
              onChange={e => setAdminAction(prev => ({ ...prev, grantId: e.target.value }))}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                padding: '9px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: '3px',
                background: 'var(--paper)',
                color: 'var(--ink)',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleReview(true)}
            disabled={loading.review}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: loading.review ? 'var(--border)' : '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: loading.review ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {loading.review ? '...' : 'Approve'}
          </button>
          <button
            onClick={() => handleReview(false)}
            disabled={loading.review}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: loading.review ? 'var(--border)' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: loading.review ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {loading.review ? '...' : 'Reject'}
          </button>
        </div>

        <button
          onClick={handleDisburse}
          disabled={loading.disburse}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px 12px',
            background: loading.disburse ? 'var(--border)' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            cursor: loading.disburse ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}
        >
          {loading.disburse ? 'Disbursing...' : 'Disburse Funds'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;