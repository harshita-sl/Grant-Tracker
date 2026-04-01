# Grant Tracker

---

## Table of Contents

1. [Project Title](#project-title)
2. [Project Description](#project-description)
3. [Project Vision](#project-vision)
4. [Tech Stack](#tech-stack)
5. [Architecture Overview](#architecture-overview)
6. [Smart Contract Details](#smart-contract-details)
7. [Frontend Web App Features](#frontend-web-app-features)
8. [How to Use the Web App](#how-to-use-the-web-app)
9. [Project Structure](#project-structure)
10. [Future Scope](#future-scope)
11. [Important Notes](#important-notes)

---

## Project Title

**Grant Tracker** � a blockchain-based grant management web application powered by **Soroban smart contracts** on the **Stellar Testnet**.
<img width="1894" height="971" alt="image" src="https://github.com/user-attachments/assets/e6342365-d95f-42ac-832a-6827a89cb05e" />

---

## Project Description

Grant Tracker is a decentralized web application designed to make grant submission, review, approval, and disbursement more transparent and auditable.

Instead of relying on a traditional centralized database where records can be modified, hidden, or delayed, Grant Tracker stores the grant lifecycle on-chain through a Soroban smart contract. Every important action is recorded against a grant record, creating a traceable workflow:

```text
Submit -> Review (Approve / Reject) -> Disburse
```

The repository contains two main parts:

- A **React frontend** that gives applicants and admins a user-friendly dashboard.
- A **Soroban smart contract** written in Rust that stores grant data and admin actions on Stellar.

This makes the app useful as a learning project, a hackathon-ready prototype, and a foundation for real-world transparent fund management systems.

---

## Project Vision

The vision behind Grant Tracker is to build a funding system where trust comes from **verifiable blockchain records** instead of institutional opacity.

Traditional grant systems often suffer from:

- unclear approval pipelines
- poor visibility into decision-making
- delayed disbursement tracking
- heavy administrative dependence on centralized operators
- limited auditability for donors, auditors, and applicants

Grant Tracker improves this by moving the lifecycle to a smart contract where:

- each submitted grant gets a unique on-chain ID
- approvals and rejections are permanently recorded
- disbursement status is traceable on-chain
- aggregate platform statistics are readable by anyone
- grant records cannot be silently altered after state changes are finalized

The long-term goal is to evolve this project into a transparent funding infrastructure layer for public grants, NGO support, community funds, and DAO-governed capital allocation.

---

## Tech Stack

- **Blockchain:** Stellar Testnet
- **Smart Contracts:** Soroban SDK, Rust
- **Frontend:** React
- **Wallet Integration:** Freighter Wallet
- **Blockchain SDK:** `@stellar/stellar-sdk`
- **Freighter Integration:** `@stellar/freighter-api`
- **Styling:** CSS with a custom UI theme

---

## Architecture Overview

### 1. Smart Contract Layer

The smart contract handles the core grant workflow logic:

- creating grant applications
- storing grant metadata
- approving or rejecting grants
- marking approved grants as disbursed
- exposing read functions for grant records, admin records, and global statistics

### 2. Frontend Layer

The React app provides three main views:

- **Landing View** for role selection
- **Applicant Portal** for grant submission and grant-status lookup
- **Admin Center** for reviewing, filtering, approving, rejecting, and disbursing grants

### 3. Wallet Layer

Freighter is used to:

- connect a Stellar wallet to the web app
- sign blockchain transactions for write operations
- identify the user account interacting with the contract

### 4. Network Layer

The app currently targets:

- **Soroban RPC:** `https://soroban-testnet.stellar.org:443`
- **Horizon Testnet:** `https://horizon-testnet.stellar.org`
- **Network Passphrase:** Stellar Testnet

---

## Smart Contract Details

### Contract Location

Smart contract source code:
[`GrantTracker/contracts/grant-tracker-smart-contract/src/lib.rs`](/c:/Users/Harshita/Stellar-Journey-to-Mastery/GrantTracker/contracts/grant-tracker-smart-contract/src/lib.rs)

Frontend integration file:
[`src/components/Soroban.js`](/c:/Users/Harshita/Stellar-Journey-to-Mastery/src/components/Soroban.js)

### Deployed Contract Address

```text
CASGDQQ7B5ZMVWRGZ5CYQMULRSJ3VNHZIP7U7CQYQRVGDJWDGRSQNKXP
```
<img width="1890" height="804" alt="image" src="https://github.com/user-attachments/assets/880494cb-6b38-4f88-838b-3c1e2afc370e" />

### Core Contract Data Models

#### `Grant`
Stores applicant-facing grant information:

- `grant_id`
- `title`
- `descrip`
- `applicant`
- `amount`
- `crt_time`
- `is_closed`

#### `AdminRecord`
Stores admin decisions for each grant:

- `grant_id`
- `approved`
- `disbursed`
- `rejected`
- `review_time`

#### `GrantStatus`
Stores platform-level counters:

- `total`
- `approved`
- `disbursed`
- `rejected`

### Smart Contract Functions

```rust
submit_grant(title, descrip, applicant, amount) -> u64
review_grant(grant_id, decision)
disburse_grant(grant_id)
view_grant(grant_id) -> Grant
view_admin_record(grant_id) -> AdminRecord
view_all_grant_status() -> GrantStatus
```

### Function Behavior

| Function | Description |
|---|---|
| `submit_grant` | Creates a new grant application, assigns a unique `grant_id`, stores it on-chain, and increments the total grant counter. |
| `review_grant` | Allows an admin flow to approve or reject a pending grant. Rejection also closes the grant lifecycle. |
| `disburse_grant` | Marks an approved grant as disbursed and closes it permanently. |
| `view_grant` | Returns the full grant record for a given `grant_id`. |
| `view_admin_record` | Returns the admin-side status of a grant. |
| `view_all_grant_status` | Returns the aggregate counters across the whole platform. |

### Lifecycle Guards Implemented

The contract includes protective checks to prevent invalid state transitions, such as:

- reviewing a non-existent grant
- reviewing an already reviewed grant
- disbursing a grant that is not approved
- disbursing a grant twice
- acting on a grant that is already closed

### Storage Behavior

The contract extends instance storage TTL after write operations so active grant data remains available through the lifecycle.

---

## Frontend Web App Features

### Landing Page

- role-based entry point for Applicant and Admin
- displays the active Soroban contract address
- presents the blockchain-first purpose of the platform

### Applicant Portal

- connect Freighter wallet
- submit a new grant application on-chain
- enter project title, description, applicant name, and requested amount
- track submitted applications inside the dashboard
- look up any grant by ID to check its current status

### Admin Center

- connect Freighter wallet
- fetch grant records from the contract
- view platform statistics such as total, pending, approved, and disbursed grants
- filter grants by status
- inspect complete grant details
- approve pending grants
- reject pending grants
- disburse approved grants

### Status Model Used in the UI

The frontend derives grant status using admin and grant state together:

- **Pending**: submitted but not yet approved or rejected
- **Approved**: approved but not yet disbursed
- **Rejected**: rejected and closed
- **Disbursed**: approved, disbursed, and closed

---

## How to Use the Web App

### Step 1. Install Freighter Wallet

Install the Freighter browser extension from its official store listing.

After installing:

- create a new wallet or import an existing one
- securely save the secret recovery phrase
- switch the wallet network to **Testnet**

### Step 2. Fund Your Wallet on Stellar Testnet

Since this app runs on Stellar Testnet, your wallet needs test XLM for transaction fees.

You can fund your testnet account using Stellar Friendbot.

Typical flow:

1. Open Freighter and copy your public address.
2. Visit Friendbot for Stellar Testnet.
3. Request test XLM to that address.
4. Confirm the balance appears in Freighter.

### Step 3. Start the Web App

https://grant-tracker-dnaa.vercel.app/

### Step 4. Connect Freighter to the App

When the web app opens:

1. Choose either **Applicant Portal** or **Admin Center**.
2. Click **Connect Freighter**.
3. Approve the connection request in the Freighter extension.
4. Once connected, your shortened public wallet address appears in the top bar.

### Step 5. Submit a Grant as an Applicant

In the Applicant Portal:

1. Connect your Freighter wallet.
2. Fill in:
   - project title
   - description
   - applicant or organization name
   - requested amount in stroops
3. Click **Submit Application On-Chain**.
4. Approve the transaction in Freighter.
5. After confirmation, the app returns a new `grant_id` and shows the record in the applicant dashboard.

### Step 6. Track Grant Status

Applicants can monitor grants in two ways:

- review items listed under **My Applications**
- enter a `grant_id` in the status lookup box to fetch the latest on-chain state

### Step 7. Review Grants as an Admin

In the Admin Center:

1. Connect Freighter.
2. Open the grant queue.
3. Select a grant record.
4. Approve or reject pending grants.
5. If a grant is approved, use the **Disburse** action to finalize the lifecycle.

Every write action requires Freighter signature approval.

### Smart Contract Workspace

The Soroban workspace is inside the `GrantTracker` directory.

Main contract package:
[`GrantTracker/contracts/grant-tracker-smart-contract/Cargo.toml`](/c:/Users/Harshita/Stellar-Journey-to-Mastery/GrantTracker/contracts/grant-tracker-smart-contract/Cargo.toml)

Top-level workspace file:
[`GrantTracker/Cargo.toml`](/c:/Users/Harshita/Stellar-Journey-to-Mastery/GrantTracker/Cargo.toml)

---

## Project Structure

```text
.
|-- GrantTracker/
|   |-- Cargo.toml
|   `-- contracts/
|       `-- grant-tracker-smart-contract/
|           `-- src/
|               |-- lib.rs
|               `-- test.rs
|-- public/
|-- src/
|   |-- components/
|   |   |-- Freighter.js
|   |   `-- Soroban.js
|   |-- views/
|   |   |-- LandingView.js
|   |   |-- ApplicantView.js
|   |   `-- AdminView.js
|   |-- App.js
|   `-- App.css
|-- package.json
`-- README.md
```

---

## Future Scope

The current version establishes a strong grant lifecycle prototype. Future enhancements can turn it into a more production-ready decentralized funding platform.

- **Native Token Transfer Execution**: upgrade `disburse_grant` from a state update into a real token transfer using Stellar token interfaces.
- **Wallet-Bound Applicants**: bind grant submissions directly to Stellar wallet addresses so recipient identity is cryptographically linked.
- **Role-Based Access Control**: restrict review and disbursement actions to authorized admin wallets instead of allowing any signer to call admin functions.
- **DAO-Style Approval Flow**: replace single-review logic with multi-signer governance or quorum-based voting.
- **Milestone-Based Funding**: release grants in phases as milestones are completed and verified.
- **Document Attachments and Metadata**: attach proposal documents, category tags, organization metadata, and off-chain evidence links.
- **Search and Analytics Dashboard**: add filters, trend charts, and richer reporting for auditors, donors, and public stakeholders.
- **Mainnet Readiness**: introduce secure environment-based contract configuration, hardened validation, and deployment workflows.
- **Notification System**: inform applicants when grants are approved, rejected, or disbursed.
- **Identity and Compliance Integrations**: connect to KYC, credential, or reputation contracts for regulated grant programs.

---

## Important Notes

- The app is currently configured for **Stellar Testnet**, not mainnet.
- The contract address is hardcoded in the frontend integration layer.
- Requested grant amounts are entered in **stroops**, and the UI also displays them in XLM-style units for readability.
- The current contract records disbursement status on-chain, but it does **not yet perform a live token transfer**.
- Some contract workspace metadata and tests still appear to contain older Soroban starter-template placeholders, so contract packaging may need cleanup before a production deployment workflow is documented.

---

> Built on [Stellar](https://stellar.org/) and powered by [Soroban Smart Contracts](https://soroban.stellar.org/)
