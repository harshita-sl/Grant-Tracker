import React from 'react';

const ApplicantView = ({
  active,
  walletAddress,
  connecting,
  connectWallet,
  goTo,
  shortAddress,
  form,
  handleFormChange,
  handleSubmit,
  submitting,
  myGrants,
  getGrantStatus,
  STATUS_PILL_CLASS,
  STATUS_LABEL,
  STATUS_PROGRESS_CLASS,
  toXlmUnits,
  statusLookupId,
  setStatusLookupId,
  lookupGrantStatus,
  lookupLoading,
  lookedUpGrant,
}) => {
  return (
    <section id="view-applicant" className={`view ${active ? 'active' : ''}`}>
      <nav className="topbar applicant-nav">
        <div className="topbar-brand">
          <div className="topbar-logo">AP</div>
          <span className="topbar-name">GrantTracker</span>
          <span className="topbar-role">Applicant Portal</span>
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

      <div className="app-layout">
        <div className="form-panel">
          <div className="form-hero">
            <div className="form-hero-eyebrow">New Application</div>
            <h2 className="form-hero-title">
              Submit your
              <br />
              <em>grant request</em>
            </h2>
            <p className="form-hero-desc">
              Fill in details below. Your application is recorded on Stellar and becomes visible
              for review.
            </p>
          </div>

          <div className="field-group">
            <div className="field">
              <label className="field-label">Project Title</label>
              <input type="text" value={form.title} onChange={handleFormChange('title')} placeholder="Clean Water Initiative" />
            </div>

            <div className="field">
              <label className="field-label">Description</label>
              <textarea value={form.descrip} onChange={handleFormChange('descrip')} placeholder="Describe purpose, outcomes, and impact" />
            </div>

            <div className="field">
              <label className="field-label">Applicant / Organization</label>
              <input type="text" value={form.applicant} onChange={handleFormChange('applicant')} placeholder="Organization or applicant name" />
            </div>

            <div className="field">
              <label className="field-label">Requested Amount (stroops)</label>
              <input type="number" min="1" value={form.amount} onChange={handleFormChange('amount')} placeholder="50000000" />
            </div>
          </div>

          <button className="btn-submit-grant" onClick={handleSubmit} disabled={submitting}>
            {submitting && <span className="spin" />} Submit Application On-Chain
          </button>
        </div>

        <div className="my-grants-panel">
          <div className="status-lookup-card">
            <div className="status-lookup-title">Track Current Grant Status</div>
            <div className="status-lookup-row">
              <input
                type="number"
                min="1"
                placeholder="Enter grant ID"
                value={statusLookupId}
                onChange={(e) => setStatusLookupId(e.target.value)}
              />
              <button onClick={lookupGrantStatus} disabled={lookupLoading}>
                {lookupLoading ? 'Checking...' : 'Check'}
              </button>
            </div>

            {lookedUpGrant && (
              <div className={`lookup-result status-${lookedUpGrant._status}`}>
                <div className="lookup-top">
                  <span>GRT-{lookedUpGrant.grant_id}</span>
                  <span className={`status-pill ${STATUS_PILL_CLASS[lookedUpGrant._status]}`}>
                    {STATUS_LABEL[lookedUpGrant._status]}
                  </span>
                </div>
                <div className="lookup-meta">
                  <span>{lookedUpGrant.title}</span>
                  <span>{toXlmUnits(lookedUpGrant.amount)} XLM</span>
                </div>
              </div>
            )}
          </div>

          <div className="panel-header">
            <h3 className="panel-title">My Applications</h3>
            <span className="panel-count">{myGrants.length} grant{myGrants.length === 1 ? '' : 's'}</span>
          </div>

          <div className="lifecycle-strip">
            <div className="lc-step"><div className="lc-dot done" /><div className="lc-label done">Submit</div></div>
            <div className="lc-connector" />
            <div className="lc-step"><div className="lc-dot active" /><div className="lc-label active">Under Review</div></div>
            <div className="lc-connector" />
            <div className="lc-step"><div className="lc-dot" /><div className="lc-label">Decision</div></div>
            <div className="lc-connector" />
            <div className="lc-step"><div className="lc-dot" /><div className="lc-label">Disbursement</div></div>
          </div>

          {!myGrants.length && (
            <div className="empty-app">
              <div className="empty-app-title">No applications yet</div>
              <div className="empty-app-sub">Submit your first grant application using the form on the left.</div>
            </div>
          )}

          {myGrants.map((grant) => {
            const status = getGrantStatus(grant);
            return (
              <div key={grant.grant_id} className={`app-grant-card status-${status}`}>
                <div className="agc-top">
                  <div>
                    <div className="agc-id">GRT-{grant.grant_id}</div>
                    <div className="agc-title">{grant.title}</div>
                  </div>
                  <span className={`status-pill ${STATUS_PILL_CLASS[status]}`}>{STATUS_LABEL[status]}</span>
                </div>
                <div className="agc-meta">
                  <div className="agc-meta-item">{toXlmUnits(grant.amount)} XLM</div>
                  <div className="agc-meta-item">{new Date(Number(grant.crt_time) * 1000).toLocaleDateString()}</div>
                  <div className="agc-meta-item">{grant.is_closed ? 'Closed' : 'Open'}</div>
                </div>
                <div className="progress-track"><div className={`progress-fill ${STATUS_PROGRESS_CLASS[status]}`} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ApplicantView;
