import React from 'react';

const Header = ({ stats }) => {
  return (
    <header style={{
      position: 'relative',
      borderBottom: '2px solid var(--ink)',
      padding: '0 48px',
      background: 'var(--ink)',
      color: 'var(--paper)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: 0,
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '28px 0',
        borderRight: '1px solid rgba(245,242,235,0.15)',
        paddingRight: '48px',
        gap: '4px'
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          opacity: 0.8
        }}>Stellar · Soroban Testnet</span>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px',
          lineHeight: 1,
          color: 'var(--paper)'
        }}>Grant<em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>Tracker</em></h1>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'stretch'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          borderLeft: '1px solid rgba(245,242,235,0.1)',
          gap: '2px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }} title="Total grants submitted">
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--gold)',
            transition: 'color 0.3s'
          }}>{stats.total || 0}</span>
          <span style={{
            fontSize: '8px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,242,235,0.45)'
          }}>Total</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          borderLeft: '1px solid rgba(245,242,235,0.1)',
          gap: '2px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }} title="Approved grants">
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--jade-lt)',
            transition: 'color 0.3s'
          }}>{stats.approved || 0}</span>
          <span style={{
            fontSize: '8px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,242,235,0.45)'
          }}>Approved</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          borderLeft: '1px solid rgba(245,242,235,0.1)',
          gap: '2px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }} title="Funds disbursed">
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--sky-lt)',
            transition: 'color 0.3s'
          }}>{stats.disbursed || 0}</span>
          <span style={{
            fontSize: '8px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,242,235,0.45)'
          }}>Disbursed</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
          borderLeft: '1px solid rgba(245,242,235,0.1)',
          gap: '2px',
          cursor: 'pointer',
          transition: 'background 0.2s'
        }} title="Rejected grants">
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--crimson-lt)',
            transition: 'color 0.3s'
          }}>{stats.rejected || 0}</span>
          <span style={{
            fontSize: '8px',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,242,235,0.45)'
          }}>Rejected</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
