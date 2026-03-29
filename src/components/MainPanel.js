import React, { useState, useEffect, useCallback } from 'react';
import { viewGrant, viewAdminRecord, viewAllGrantStatus } from './Soroban';

const MainPanel = ({ walletAddress, refreshTrigger, onSelectGrant, stats, setStats }) => {
  const [grants, setGrants] = useState([]);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [lookupId, setLookupId] = useState('');

  const loadStats = useCallback(async () => {
    try {
      if (!walletAddress) return;
      const status = await viewAllGrantStatus(walletAddress);
      setStats(status);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, [walletAddress, setStats]);

  const loadGrants = async () => {
    setLoading(true);
    try {
      // For now, we'll load grants on demand when IDs are known
      // In a full implementation, you might want to load all grants or implement pagination
      setGrants([]);
    } catch (e) {
      console.error('Failed to load grants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadStats();
      loadGrants();
    }
  }, [walletAddress, refreshTrigger, loadStats]);

  const selectGrant = async (id) => {
    try {
      const grant = await viewGrant(walletAddress, id);
      const adminRecord = await viewAdminRecord(walletAddress, id);
      const fullGrant = { ...grant, ...adminRecord };
      setSelectedGrant(fullGrant);
      onSelectGrant(fullGrant);
    } catch (e) {
      alert('Failed to load grant: ' + e.message);
    }
  };

  const handleLookup = () => {
    const id = parseInt(lookupId);
    if (id && id > 0) {
      selectGrant(id);
      setLookupId('');
    }
  };

  const getStatusColor = (grant) => {
    if (grant.disbursed) return '#22c55e'; // green
    if (grant.rejected) return '#ef4444'; // red
    if (grant.approved) return '#f59e0b'; // amber
    return '#6b7280'; // gray for pending
  };

  const getStatusText = (grant) => {
    if (grant.disbursed) return 'DISBURSED';
    if (grant.rejected) return 'REJECTED';
    if (grant.approved) return 'APPROVED';
    return 'PENDING';
  };

  const filteredGrants = grants.filter(grant => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return !grant.approved && !grant.rejected;
    if (selectedTab === 'approved') return grant.approved && !grant.disbursed;
    if (selectedTab === 'disbursed') return grant.disbursed;
    if (selectedTab === 'rejected') return grant.rejected;
    return true;
  });

  // Note: filteredGrants is prepared for future use when we implement grant listing

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '32px'
    }}>
      {/* Grant Lookup */}
      <div style={{
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto',
        marginBottom: '32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--ink)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            borderRadius: '4px',
            flexShrink: 0
          }}>◎</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)'
          }}>Lookup Grant</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            type="number"
            min="1"
            placeholder="Enter Grant ID"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              padding: '12px 16px',
              border: '1.5px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--cream)',
              color: 'var(--ink)',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              flex: 1
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleLookup();
              }
            }}
          />
          <button
            onClick={handleLookup}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '12px 24px',
              border: '2px solid var(--ink)',
              borderRadius: '4px',
              background: 'var(--ink)',
              color: 'var(--gold)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Fetch
          </button>
        </div>
      </div>

      {/* Grant Status Tabs */}
      <div style={{
        background: 'var(--paper)',
        border: '2px solid var(--ink)',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'var(--ink)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            borderRadius: '4px',
            flexShrink: 0
          }}>📊</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink)'
          }}>Grant Status</span>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All Grants', count: stats.total },
            { key: 'pending', label: 'Pending', count: stats.total - stats.approved - stats.rejected },
            { key: 'approved', label: 'Approved', count: stats.approved - stats.disbursed },
            { key: 'disbursed', label: 'Disbursed', count: stats.disbursed },
            { key: 'rejected', label: 'Rejected', count: stats.rejected }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              style={{
                padding: '8px 16px',
                background: selectedTab === tab.key ? 'var(--ink)' : 'var(--cream)',
                color: selectedTab === tab.key ? 'var(--gold)' : 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Grant Details */}
        {selectedGrant && (
          <div style={{
            background: 'var(--cream)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink)'
              }}>
                Grant #{selectedGrant.grant_id}
              </div>
              <div style={{
                padding: '4px 12px',
                background: getStatusColor(selectedGrant),
                color: 'white',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                {getStatusText(selectedGrant)}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                marginBottom: '4px'
              }}>
                {selectedGrant.title}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: 'var(--ink)',
                lineHeight: '1.5',
                marginBottom: '12px'
              }}>
                {selectedGrant.descrip}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              fontSize: '11px'
            }}>
              <div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(10,10,15,0.6)',
                  marginBottom: '4px'
                }}>
                  Applicant
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--ink)'
                }}>
                  {selectedGrant.applicant}
                </div>
              </div>
              <div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(10,10,15,0.6)',
                  marginBottom: '4px'
                }}>
                  Amount
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--ink)'
                }}>
                  {selectedGrant.amount.toLocaleString()} units
                </div>
              </div>
              <div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(10,10,15,0.6)',
                  marginBottom: '4px'
                }}>
                  Created
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--ink)'
                }}>
                  {new Date(selectedGrant.crt_time * 1000).toLocaleDateString()}
                </div>
              </div>
              {selectedGrant.review_time > 0 && (
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(10,10,15,0.6)',
                    marginBottom: '4px'
                  }}>
                    Reviewed
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: 'var(--ink)'
                  }}>
                    {new Date(selectedGrant.review_time * 1000).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--ink)',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            Loading...
          </div>
        )}

        {!selectedGrant && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(10,10,15,0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px'
          }}>
            Enter a grant ID above to view details
          </div>
        )}
      </div>
    </main>
  );
};

export default MainPanel;