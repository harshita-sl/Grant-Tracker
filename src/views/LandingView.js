import React from 'react';

const LandingView = ({ active, goTo, contractAddress, shootingStars, landingParticles }) => {
  return (
    <section id="view-landing" className={`view ${active ? 'active' : ''}`}>
      <div className="grid-layer" />
      <div className="grid-layer-2" />
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
      <div className="orbit-ring ring-1" />
      <div className="orbit-ring ring-2" />
      <div className="orbit-ring ring-3" />

      <div className="star-layer" aria-hidden>
        {shootingStars.map((star) => (
          <span key={star.id} className="shooting-star" style={star} />
        ))}
      </div>

      <div className="particle-field" aria-hidden>
        {landingParticles.map((particle) => (
          <span key={particle.id} className="particle" style={particle} />
        ))}
      </div>

      <div className="landing-inner">
        <div className="landing-eyebrow">Stellar · Soroban Testnet</div>
        <h1 className="landing-title">
          Transparent
          <br />
          <em>Grant Funding</em>
          <br />
          on Blockchain
        </h1>
        <p className="landing-sub">
          Every application, approval, and disbursement is recorded immutably on-chain.
          Choose your role to continue.
        </p>

        <div className="role-cards">
          <button className="role-card applicant" onClick={() => goTo('applicant')}>
            <div className="role-icon">AP</div>
            <div>
              <div className="role-label">Applicant Portal</div>
              <div className="role-title">Apply for<br />a Grant</div>
            </div>
            <div className="role-desc">
              Submit your funding application, track its status, and receive disbursements all
              transparently on-chain.
            </div>
            <div className="role-cta">Start application <span className="role-cta-arrow">-&gt;</span></div>
          </button>

          <button className="role-card admin" onClick={() => goTo('admin')}>
            <div className="role-icon">AD</div>
            <div>
              <div className="role-label">Admin Dashboard</div>
              <div className="role-title">Manage &amp;<br />Disburse</div>
            </div>
            <div className="role-desc">
              Review pending applications, approve or reject them, and disburse funds to verified
              recipients.
            </div>
            <div className="role-cta">Open dashboard <span className="role-cta-arrow">-&gt;</span></div>
          </button>
        </div>

        <p className="landing-footnote">CONTRACT · {contractAddress}</p>
      </div>
    </section>
  );
};

export default LandingView;
