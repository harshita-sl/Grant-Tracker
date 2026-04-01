import React from 'react';

const AdminView = ({
  active,
  walletAddress,
  connecting,
  connectWallet,
  goTo,
  shortAddress,
  stats,
  pendingCount,
  adminFilter,
  setAdminFilter,
  adminLookupId,
  setAdminLookupId,
  lookupAdminGrant,
  queueLoading,
  filteredGrants,
  getGrantStatus,
  selectedGrant,
  setSelectedGrant,
  ADMIN_PILL_CLASS,
  STATUS_LABEL,
  toXlmUnits,
  actionLoading,
  runAdminReview,
  runAdminDisburse,
}) => {
  return (
    <section id="view-admin" className={`view ${active ? 'active' : ''}`}>
      <nav className="topbar admin-nav">
        <div className="topbar-brand">
          <div className="topbar-logo">AD</div>
          <span className="topbar-name">GrantTracker</span>
          <span className="topbar-role">Admin Center</span>
        </div>
        <div className="topbar-right">
          <div className={`wallet-chip ${walletAddress ? 'live' : ''}`}>
            <div className={`w-dot ${walletAddress ? 'on' : ''}`} />
            <span className="wallet-addr">{shortAddress(walletAddress)}</span>
          </div>
          <button className="btn-connect" onClick={connectWallet} disabled={connecting || !!walletAddress}>
            {walletAddress ? 'Connected' : connecting ? 'Connecting...' : 'Connect Freighter'}
          </button>
          <button className="btn-switch" onClick={() => goTo('landing')}>Switch Role</button>
        </div>
      </nav>

      <div className="stat-bar">
        <div className="stat-cell"><div className="stat-num purple">{stats.total}</div><div className="stat-lbl">Total Grants</div></div>
        <div className="stat-cell"><div className="stat-num amber">{pendingCount}</div><div className="stat-lbl">Pending</div></div>
        <div className="stat-cell"><div className="stat-num green">{stats.approved}</div><div className="stat-lbl">Approved</div></div>
        <div className="stat-cell"><div className="stat-num sky">{stats.disbursed}</div><div className="stat-lbl">Disbursed</div></div>
      </div>

      <div className="admin-body">
        <div className="queue-panel">
          <div className="queue-toolbar">
            <h3 className="queue-title">Grant Queue</h3>
            <div className="admin-lookup">
              <input
                type="number"
                min="1"
                placeholder="Grant ID"
                value={adminLookupId}
                onChange={(e) => setAdminLookupId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') lookupAdminGrant();
                }}
              />
              <button onClick={lookupAdminGrant}>Fetch ID</button>
            </div>
            <div className="filter-tabs">
              {['all', 'pending', 'approved', 'disbursed', 'rejected'].map((filter) => (
                <button key={filter} className={`ftab ${adminFilter === filter ? 'active' : ''}`} onClick={() => setAdminFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {queueLoading && <div className="queue-empty">Loading grants...</div>}
          {!queueLoading && !filteredGrants.length && <div className="queue-empty">No grants match this filter.</div>}

          {!queueLoading && filteredGrants.map((grant) => {
            const status = getGrantStatus(grant);
            return (
              <div
                key={grant.grant_id}
                className={`admin-grant-row status-${status} ${selectedGrant?.grant_id === grant.grant_id ? 'selected' : ''}`}
                onClick={() => setSelectedGrant(grant)}
              >
                <div className="agr-header">
                  <div>
                    <div className="agr-id">GRT-{grant.grant_id}</div>
                    <div className="agr-title">{grant.title}</div>
                  </div>
                  <span className={`status-pill ${ADMIN_PILL_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </div>
                <div className="agr-meta">
                  <div className="agr-meta-item">{toXlmUnits(grant.amount)} XLM</div>
                  <div className="agr-meta-item">{grant.applicant}</div>
                  <div className="agr-meta-item">{new Date(Number(grant.crt_time) * 1000).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="action-panel">
          {!selectedGrant && (
            <div className="action-placeholder">
              <div className="action-ph-icon">*</div>
              <div className="action-ph-text">Select a grant from the queue to review, approve, reject, or disburse funds.</div>
            </div>
          )}

          {selectedGrant && (
            <>
              <div className="detail-card">
                <div className="detail-id">GRT-{selectedGrant.grant_id}</div>
                <div className="detail-title">{selectedGrant.title}</div>
                <div className="detail-fields">
                  <div className="detail-field"><div className="df-label">Applicant</div><div className="df-value">{selectedGrant.applicant}</div></div>
                  <div className="detail-field"><div className="df-label">Amount</div><div className="df-value">{toXlmUnits(selectedGrant.amount)} XLM</div></div>
                  <div className="detail-field"><div className="df-label">Status</div><div className="df-value">{STATUS_LABEL[getGrantStatus(selectedGrant)]}</div></div>
                  <div className="detail-field"><div className="df-label">Submitted</div><div className="df-value">{new Date(Number(selectedGrant.crt_time) * 1000).toLocaleString()}</div></div>
                </div>
                <div className="detail-descrip">{selectedGrant.descrip}</div>
              </div>

              {getGrantStatus(selectedGrant) === 'pending' && (
                <div className="admin-actions">
                  <div className="admin-action-label">Review Decision</div>
                  <div className="action-btn-row">
                    <button className="abtn abtn-approve" onClick={() => runAdminReview(true, selectedGrant.grant_id)} disabled={Boolean(actionLoading)}>
                      {actionLoading === 'approve' && <span className="spin" />} Approve
                    </button>
                    <button className="abtn abtn-reject" onClick={() => runAdminReview(false, selectedGrant.grant_id)} disabled={Boolean(actionLoading)}>
                      {actionLoading === 'reject' && <span className="spin" />} Reject
                    </button>
                  </div>
                </div>
              )}

              {getGrantStatus(selectedGrant) === 'approved' && (
                <div className="admin-actions">
                  <div className="admin-action-label">Disburse Funds</div>
                  <button className="abtn abtn-disburse" onClick={() => runAdminDisburse(selectedGrant.grant_id)} disabled={Boolean(actionLoading)}>
                    {actionLoading === 'disburse' && <span className="spin" />} Disburse
                  </button>
                </div>
              )}

              {['rejected', 'disbursed'].includes(getGrantStatus(selectedGrant)) && (
                <div className="lifecycle-done-note">Grant lifecycle complete. This record is finalized on-chain.</div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminView;
