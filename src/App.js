import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import WalletBar from './components/WalletBar';
import Sidebar from './components/Sidebar';
import MainPanel from './components/MainPanel';
import { viewAllGrantStatus } from './components/Soroban';
import { ToastContainer } from './components/Toast';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [stats, setStats] = useState({ total: 0, approved: 0, disbursed: 0, rejected: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadStats = useCallback(async () => {
    try {
      if (!walletAddress) return;
      const status = await viewAllGrantStatus(walletAddress);
      setStats(status);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, [walletAddress]);

  const handleGrantSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats();
    addToast('Grant submitted successfully', 'success');
  };

  const handleAction = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats();
  };

  const handleSelectGrant = (grant) => {
    // Optional: handle grant selection
  };

  useEffect(() => {
    if (walletAddress) {
      loadStats();
    }
  }, [walletAddress, loadStats]);

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      background: 'var(--paper)',
      color: 'var(--ink)',
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      {/* Noise texture overlay */}
      <div style={{
        content: '',
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
        backgroundSize: '200px',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <Header stats={stats} />
      <WalletBar walletAddress={walletAddress} setWalletAddress={setWalletAddress} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        minHeight: 'calc(100vh - 97px)'
      }}>
        <Sidebar
          walletAddress={walletAddress}
          onGrantSubmitted={handleGrantSubmitted}
          onAction={handleAction}
        />
        <MainPanel
          walletAddress={walletAddress}
          refreshTrigger={refreshTrigger}
          onSelectGrant={handleSelectGrant}
          stats={stats}
          setStats={setStats}
        />
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;