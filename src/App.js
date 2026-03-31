import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  submitGrant,
  reviewGrant,
  disburseGrant,
  viewGrant,
  viewAdminRecord,
  viewAllGrantStatus,
} from './components/Soroban';
import { checkConnection, retrievePublicKey } from './components/Freighter';
import LandingView from './views/LandingView';
import ApplicantView from './views/ApplicantView';
import AdminView from './views/AdminView';

const CONTRACT_ADDRESS = 'CASGDQQ7B5ZMVWRGZ5CYQMULRSJ3VNHZIP7U7CQYQRVGDJWDGRSQNKXP';

const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  disbursed: 'Disbursed',
  rejected: 'Rejected',
};

const STATUS_PILL_CLASS = {
  pending: 'pill-pending',
  approved: 'pill-approved',
  disbursed: 'pill-disbursed',
  rejected: 'pill-rejected',
};

const STATUS_PROGRESS_CLASS = {
  pending: 'progress-pending',
  approved: 'progress-approved',
  disbursed: 'progress-disbursed',
  rejected: 'progress-rejected',
};

const ADMIN_PILL_CLASS = {
  pending: 'apill-pending',
  approved: 'apill-approved',
  disbursed: 'apill-disbursed',
  rejected: 'apill-rejected',
};

const EMPTY_STATS = { total: 0, approved: 0, disbursed: 0, rejected: 0 };

function getGrantStatus(grant) {
  if (!grant) return 'pending';
  if (grant.disbursed) return 'disbursed';
  if (grant.rejected) return 'rejected';
  if (grant.approved) return 'approved';
  return 'pending';
}

function shortAddress(address) {
  if (!address) return 'Connect wallet';
  return `${address.slice(0, 6)}.....${address.slice(-4)}`;
}

function toXlmUnits(rawAmount) {
  const amount = Number(rawAmount || 0);
  return (amount / 10_000_000).toFixed(4);
}

function App() {
  const [view, setView] = useState('landing');
  const [walletAddress, setWalletAddress] = useState('');
  const [connecting, setConnecting] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIcon = { s: '[OK]', e: '[X]', i: '[i]', w: '[!]' };

  const [form, setForm] = useState({ title: '', descrip: '', applicant: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const [stats, setStats] = useState(EMPTY_STATS);
  const [grants, setGrants] = useState([]);
  const [knownGrantIds, setKnownGrantIds] = useState([]);
  const knownGrantIdsRef = useRef([]);
  const queueRequestRef = useRef(0);

  const [adminFilter, setAdminFilter] = useState('all');
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [adminLookupId, setAdminLookupId] = useState('');

  const [statusLookupId, setStatusLookupId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUpGrant, setLookedUpGrant] = useState(null);

  const addToast = useCallback((message, type = 'i') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const mergeGrant = useCallback((nextGrant) => {
    if (!nextGrant) return;
    setGrants((prev) => {
      const map = new Map(prev.map((g) => [g.grant_id, g]));
      map.set(nextGrant.grant_id, nextGrant);
      return [...map.values()].sort((a, b) => b.grant_id - a.grant_id);
    });
    setKnownGrantIds((prev) => {
      if (prev.includes(nextGrant.grant_id)) return prev;
      return [...prev, nextGrant.grant_id].sort((a, b) => a - b);
    });
  }, []);

  useEffect(() => {
    knownGrantIdsRef.current = knownGrantIds;
  }, [knownGrantIds]);

  const fetchGrantDetails = useCallback(
    async (id) => {
      try {
        const grant = await viewGrant(walletAddress, id);
        if (!grant || Number(grant.grant_id) <= 0) {
          return null;
        }
        const admin = await viewAdminRecord(walletAddress, id);
        return { ...grant, ...admin, _status: getGrantStatus({ ...grant, ...admin }) };
      } catch (error) {
        return null;
      }
    },
    [walletAddress]
  );

  const fetchGrantDetailsWithTimeout = useCallback(
    async (id, timeoutMs = 8000) => {
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), timeoutMs);
      });
      return Promise.race([fetchGrantDetails(id), timeoutPromise]);
    },
    [fetchGrantDetails]
  );

  const refreshStats = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const next = await viewAllGrantStatus(walletAddress);
      setStats({
        total: Number(next.total || 0),
        approved: Number(next.approved || 0),
        disbursed: Number(next.disbursed || 0),
        rejected: Number(next.rejected || 0),
      });
    } catch (error) {
      addToast(`Stats refresh failed: ${error.message}`, 'e');
    }
  }, [walletAddress, addToast]);

  const refreshAdminQueue = useCallback(async () => {
    if (!walletAddress) return;

    const requestId = ++queueRequestRef.current;
    setQueueLoading(true);
    try {
      const status = await viewAllGrantStatus(walletAddress);
      const nextStats = {
        total: Number(status.total || 0),
        approved: Number(status.approved || 0),
        disbursed: Number(status.disbursed || 0),
        rejected: Number(status.rejected || 0),
      };
      setStats(nextStats);

      const total = nextStats.total;
      if (!total) {
        setGrants([]);
        return;
      }

      // Probe a bounded window so UI doesn't get stuck on long RPC fetches.
      const maxProbe = Math.min(Math.max(total * 2, 30), 250);
      const baseIds = Array.from({ length: maxProbe }, (_, i) => i + 1);
      const ids = [...new Set([...knownGrantIdsRef.current, ...baseIds])].filter((id) => id >= 1);

      const batchSize = 12;
      const loaded = [];
      const start = Date.now();
      const hardStopMs = 25000;

      for (let i = 0; i < ids.length; i += batchSize) {
        if (Date.now() - start > hardStopMs) break;
        const batch = ids.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((id) => fetchGrantDetailsWithTimeout(id))
        );
        loaded.push(...batchResults.filter(Boolean));

        if (loaded.length >= total) break;
      }

      const map = new Map(loaded.map((g) => [g.grant_id, g]));
      const normalized = [...map.values()].sort((a, b) => b.grant_id - a.grant_id);
      if (requestId === queueRequestRef.current) {
        setGrants(normalized);
        const nextKnownIds = normalized.map((g) => g.grant_id).sort((a, b) => a - b);
        setKnownGrantIds((prev) => {
          if (prev.length === nextKnownIds.length && prev.every((v, i) => v === nextKnownIds[i])) {
            return prev;
          }
          return nextKnownIds;
        });
      }

      if (!normalized.length) {
        addToast('Could not resolve grant records. Try checking a grant ID in Applicant portal once.', 'w');
      }
    } catch (error) {
      addToast(`Failed loading admin queue: ${error.message}`, 'e');
    } finally {
      if (requestId === queueRequestRef.current) {
        setQueueLoading(false);
      }
    }
  }, [walletAddress, fetchGrantDetailsWithTimeout, addToast]);

  useEffect(() => {
    if (!walletAddress) return;
    refreshStats();
  }, [walletAddress, refreshStats]);

  useEffect(() => {
    if (view === 'admin' && walletAddress) {
      refreshAdminQueue();
    }
  }, [view, walletAddress, refreshAdminQueue]);

  const connectWallet = async () => {
    if (walletAddress || connecting) return;
    setConnecting(true);
    try {
      const allowed = await checkConnection();
      if (!allowed) throw new Error('Freighter permission denied');

      const key = await retrievePublicKey();
      setWalletAddress(key);
      addToast('Wallet connected', 's');
    } catch (error) {
      addToast(`Wallet connect failed: ${error.message}`, 'e');
    } finally {
      setConnecting(false);
    }
  };

  const goTo = (nextView) => {
    setView(nextView);
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const title = form.title.trim();
    const descrip = form.descrip.trim();
    const applicant = form.applicant.trim();
    const amount = parseInt(form.amount, 10);

    if (!title || !descrip || !applicant || !amount) {
      addToast('All fields are required', 'w');
      return;
    }
    if (!walletAddress) {
      addToast('Connect your wallet first', 'w');
      return;
    }

    setSubmitting(true);
    try {
      const newId = await submitGrant(walletAddress, title, descrip, applicant, amount);
      addToast(`Grant submitted: GRT-${newId}`, 's');
      setKnownGrantIds((prev) => [...new Set([newId, ...prev])].sort((a, b) => a - b));
      setForm({ title: '', descrip: '', applicant: '', amount: '' });

      const details = await fetchGrantDetails(newId);
      if (details) mergeGrant(details);

      await refreshStats();
    } catch (error) {
      addToast(`Submit failed: ${error.message}`, 'e');
    } finally {
      setSubmitting(false);
    }
  };

  const lookupGrantStatus = async () => {
    const id = parseInt(statusLookupId, 10);
    if (!id && id !== 0) {
      addToast('Enter a valid grant ID', 'w');
      return;
    }
    if (!walletAddress) {
      addToast('Connect wallet first', 'w');
      return;
    }

    setLookupLoading(true);
    try {
      const details = await fetchGrantDetails(id);
      if (!details) {
        setLookedUpGrant(null);
        addToast(`Grant ${id} not found`, 'e');
      } else {
        setLookedUpGrant(details);
        mergeGrant(details);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const lookupAdminGrant = async () => {
    const id = parseInt(adminLookupId, 10);
    if (!Number.isInteger(id) || id < 1) {
      addToast('Enter a valid grant ID', 'w');
      return;
    }
    if (!walletAddress) {
      addToast('Connect wallet first', 'w');
      return;
    }

    setQueueLoading(true);
    try {
      const details = await fetchGrantDetailsWithTimeout(id, 10000);
      if (!details) {
        addToast(`Grant ${id} not found`, 'e');
        return;
      }
      mergeGrant(details);
      setSelectedGrant(details);
      setAdminFilter('all');
      addToast(`Loaded GRT-${details.grant_id}`, 's');
    } finally {
      setQueueLoading(false);
    }
  };

  const filteredGrants = useMemo(() => {
    if (adminFilter === 'all') return grants;
    return grants.filter((g) => getGrantStatus(g) === adminFilter);
  }, [adminFilter, grants]);

  const myGrants = useMemo(() => {
    if (!knownGrantIds.length) return [];
    const map = new Map(grants.map((g) => [g.grant_id, g]));
    return knownGrantIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .sort((a, b) => b.grant_id - a.grant_id);
  }, [knownGrantIds, grants]);

  const runAdminReview = async (decision, grantIdOverride = null) => {
    const targetGrantId = Number(grantIdOverride ?? selectedGrant?.grant_id);
    if (!walletAddress) {
      addToast('Connect wallet first', 'w');
      return;
    }
    if (!targetGrantId || Number.isNaN(targetGrantId) || targetGrantId < 1) {
      addToast('Select a grant first', 'w');
      return;
    }

    setActionLoading(decision ? 'approve' : 'reject');
    try {
      await reviewGrant(walletAddress, targetGrantId, decision);
      addToast(`GRT-${targetGrantId} ${decision ? 'approved' : 'rejected'}`, decision ? 's' : 'e');
      const updated = await fetchGrantDetails(targetGrantId);
      mergeGrant(updated);
      await refreshStats();
    } catch (error) {
      addToast(error.message, 'e');
    } finally {
      setActionLoading('');
    }
  };

  const runAdminDisburse = async (grantIdOverride = null) => {
    const targetGrantId = Number(grantIdOverride ?? selectedGrant?.grant_id);
    if (!walletAddress) {
      addToast('Connect wallet first', 'w');
      return;
    }
    if (!targetGrantId || Number.isNaN(targetGrantId) || targetGrantId < 1) {
      addToast('Select a grant first', 'w');
      return;
    }

    setActionLoading('disburse');
    try {
      await disburseGrant(walletAddress, targetGrantId);
      addToast(`Funds disbursed for GRT-${targetGrantId}`, 'i');
      const updated = await fetchGrantDetails(targetGrantId);
      mergeGrant(updated);
      await refreshStats();
    } catch (error) {
      addToast(error.message, 'e');
    } finally {
      setActionLoading('');
    }
  };

  const pendingCount = Math.max(0, stats.total - stats.approved - stats.rejected);

  const landingParticles = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => {
        const colors = [
          'rgba(79,195,247,0.7)',
          'rgba(167,139,250,0.6)',
          'rgba(0,229,160,0.55)',
          'rgba(255,255,255,0.4)',
          'rgba(79,195,247,0.3)',
        ];
        const size = Math.random() * 3.5 + 0.8;
        const drift = (Math.random() - 0.5) * 80;
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          width: `${size}px`,
          height: `${size}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          animationDuration: `${8 + Math.random() * 22}s`,
          animationDelay: `-${Math.random() * 25}s`,
          boxShadow: `0 0 ${size * 3}px rgba(255,255,255,0.2)`,
          '--drift': `${drift}px`,
        };
      }),
    []
  );

  const shootingStars = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const starColors = [
          'rgba(79,195,247,0.9)',
          'rgba(167,139,250,0.8)',
          'rgba(0,229,160,0.7)',
          'rgba(255,255,255,0.6)',
        ];
        const dur = 3.5 + Math.random() * 5;
        return {
          id: i,
          top: `${Math.random() * 70 + 5}%`,
          width: `${80 + Math.random() * 140}px`,
          animationDuration: `${dur}s`,
          animationDelay: `-${Math.random() * dur}s`,
          '--star-color': starColors[Math.floor(Math.random() * starColors.length)],
        };
      }),
    []
  );

  return (
    <div className="app-root">
      <LandingView
        active={view === 'landing'}
        goTo={goTo}
        contractAddress={CONTRACT_ADDRESS}
        shootingStars={shootingStars}
        landingParticles={landingParticles}
      />

      <ApplicantView
        active={view === 'applicant'}
        walletAddress={walletAddress}
        connecting={connecting}
        connectWallet={connectWallet}
        goTo={goTo}
        shortAddress={shortAddress}
        form={form}
        handleFormChange={handleFormChange}
        handleSubmit={handleSubmit}
        submitting={submitting}
        myGrants={myGrants}
        getGrantStatus={getGrantStatus}
        STATUS_PILL_CLASS={STATUS_PILL_CLASS}
        STATUS_LABEL={STATUS_LABEL}
        STATUS_PROGRESS_CLASS={STATUS_PROGRESS_CLASS}
        toXlmUnits={toXlmUnits}
        statusLookupId={statusLookupId}
        setStatusLookupId={setStatusLookupId}
        lookupGrantStatus={lookupGrantStatus}
        lookupLoading={lookupLoading}
        lookedUpGrant={lookedUpGrant}
      />

      <AdminView
        active={view === 'admin'}
        walletAddress={walletAddress}
        connecting={connecting}
        connectWallet={connectWallet}
        goTo={goTo}
        shortAddress={shortAddress}
        stats={stats}
        pendingCount={pendingCount}
        adminFilter={adminFilter}
        setAdminFilter={setAdminFilter}
        adminLookupId={adminLookupId}
        setAdminLookupId={setAdminLookupId}
        lookupAdminGrant={lookupAdminGrant}
        queueLoading={queueLoading}
        filteredGrants={filteredGrants}
        getGrantStatus={getGrantStatus}
        selectedGrant={selectedGrant}
        setSelectedGrant={setSelectedGrant}
        ADMIN_PILL_CLASS={ADMIN_PILL_CLASS}
        STATUS_LABEL={STATUS_LABEL}
        toXlmUnits={toXlmUnits}
        actionLoading={actionLoading}
        runAdminReview={runAdminReview}
        runAdminDisburse={runAdminDisburse}
      />

      <div id="toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toastIcon[toast.type] || '[.]'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
