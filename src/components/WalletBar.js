import React, { useState } from 'react';
import { checkConnection, retrievePublicKey } from './Freighter';

const WalletBar = ({ walletAddress, setWalletAddress }) => {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (walletAddress) return;
    setConnecting(true);
    try {
      const allowed = await checkConnection();
      if (!allowed) throw new Error('Permission denied');
      const key = await retrievePublicKey();
      setWalletAddress(key);
    } catch (e) {
      console.error(e);
      alert('Failed to connect wallet: ' + e.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 32px',
      background: 'var(--ink)',
      borderBottom: '1px solid rgba(245,242,235,0.08)'
    }}>
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: walletAddress ? 'var(--jade-lt)' : '#555',
        flexShrink: 0,
        transition: 'background 0.3s',
        boxShadow: walletAddress ? '0 0 6px var(--jade-lt)' : 'none'
      }}></div>
      <span style={{
        fontSize: '10px',
        color: walletAddress ? 'var(--gold-lt)' : 'rgba(245,242,235,0.5)',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {walletAddress ? `${walletAddress.slice(0, 6)}···${walletAddress.slice(-6)}` : 'No wallet connected — connect Freighter to interact'}
      </span>
      <button
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '7px 16px',
          background: walletAddress ? 'var(--jade-lt)' : 'var(--gold)',
          color: 'var(--ink)',
          border: 'none',
          borderRadius: '2px',
          cursor: walletAddress ? 'default' : 'pointer',
          transition: 'all 0.15s'
        }}
        onClick={connectWallet}
        disabled={connecting || walletAddress}
      >
        {connecting ? 'Connecting...' : walletAddress ? 'Connected ✓' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default WalletBar;