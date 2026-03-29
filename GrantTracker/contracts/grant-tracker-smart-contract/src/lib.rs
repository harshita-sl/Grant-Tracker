#![allow(non_snake_case)]
#![no_std]
use soroban_sdk::{contract, contracttype, contractimpl, log, Env, Symbol, String, symbol_short};


// GrantStatus tracks overall platform-level grant statistics
#[contracttype]
#[derive(Clone)]
pub struct GrantStatus {
    pub total: u64,     // Total grants submitted
    pub approved: u64,  // Total grants approved
    pub disbursed: u64, // Total grants whose funds have been disbursed
    pub rejected: u64,  // Total grants rejected
}


// Symbol key to retrieve the global GrantStatus from storage
const ALL_GRANTS: Symbol = symbol_short!("ALL_GRANT");


// Unique counter for generating Grant IDs
const COUNT_GRANT: Symbol = symbol_short!("C_GRANT");


// Enum to map each grant's unique ID to its Grant struct in storage
#[contracttype]
pub enum Grantbook {
    Grant(u64),
}


// Enum to map each grant's unique ID to its AdminRecord struct in storage
#[contracttype]
pub enum AdminGrantbook {
    AdminRecord(u64),
}


// Grant struct: stores all user-facing details of a grant application
#[contracttype]
#[derive(Clone)]
pub struct Grant {
    pub grant_id: u64,       // Unique identifier for this grant
    pub title: String,       // Title of the grant
    pub descrip: String,     // Description / purpose of the grant
    pub applicant: String,   // Name or identifier of the applicant
    pub amount: u64,         // Requested grant amount (in smallest token unit)
    pub crt_time: u64,       // Timestamp when the grant was created
    pub is_closed: bool,     // Whether this grant lifecycle has ended
}


// AdminRecord struct: stores admin-controlled state for each grant
#[contracttype]
#[derive(Clone)]
pub struct AdminRecord {
    pub grant_id: u64,       // Mirrors the Grant's unique ID
    pub approved: bool,      // Whether the grant has been approved
    pub disbursed: bool,     // Whether the funds have been disbursed
    pub rejected: bool,      // Whether the grant has been rejected
    pub review_time: u64,    // Timestamp of the last admin action
}


#[contract]
pub struct GrantTrackerContract;

#[contractimpl]
impl GrantTrackerContract {

    // -----------------------------------------------------------------
    // FUNCTION 1 — submit_grant
    // Called by a grant applicant to register a new grant application.
    // Returns the unique grant_id assigned to this application.
    // -----------------------------------------------------------------
    pub fn submit_grant(
        env: Env,
        title: String,
        descrip: String,
        applicant: String,
        amount: u64,
    ) -> u64 {
        // Fetch and increment the global grant counter
        let mut count_grant: u64 = env
            .storage()
            .instance()
            .get(&COUNT_GRANT)
            .unwrap_or(0);
        count_grant += 1;

        // Retrieve the existing Grant slot; if new, defaults apply
        let existing = Self::view_grant(env.clone(), count_grant);

        // Only proceed if this slot is truly empty (is_closed == true by default)
        if existing.is_closed == true && existing.grant_id == 0 {
            let time = env.ledger().timestamp();

            // Build the Grant record
            let grant = Grant {
                grant_id: count_grant,
                title,
                descrip,
                applicant,
                amount,
                crt_time: time,
                is_closed: false,
            };

            // Update global statistics
            let mut all_grants = Self::view_all_grant_status(env.clone());
            all_grants.total += 1;

            // Persist grant record and updated stats
            env.storage()
                .instance()
                .set(&Grantbook::Grant(count_grant), &grant);
            env.storage().instance().set(&ALL_GRANTS, &all_grants);
            env.storage().instance().set(&COUNT_GRANT, &count_grant);
            env.storage().instance().extend_ttl(5000, 5000);

            log!(&env, "Grant submitted with ID: {}", count_grant);
            return count_grant;
        } else {
            // Slot conflict — roll back counter
            count_grant -= 1;
            env.storage().instance().set(&COUNT_GRANT, &count_grant);
            log!(&env, "Grant submission failed: slot conflict");
            panic!("Grant submission failed: slot conflict");
        }
    }


    // -----------------------------------------------------------------
    // FUNCTION 2 — review_grant
    // Called by the admin to approve OR reject a pending grant.
    // `decision` = true  → approve the grant
    // `decision` = false → reject the grant
    // -----------------------------------------------------------------
    pub fn review_grant(env: Env, grant_id: u64, decision: bool) {
        let grant = Self::view_grant(env.clone(), grant_id);
        let mut admin_rec = Self::view_admin_record(env.clone(), grant_id);

        // Guard: grant must exist, be open, and not yet reviewed
        if grant.grant_id == 0 || grant.is_closed {
            log!(&env, "Review failed: grant does not exist or is already closed");
            panic!("Review failed: grant does not exist or is already closed");
        }
        if admin_rec.approved || admin_rec.rejected {
            log!(&env, "Review failed: grant has already been reviewed");
            panic!("Review failed: grant has already been reviewed");
        }

        let time = env.ledger().timestamp();
        let mut all_grants = Self::view_all_grant_status(env.clone());

        if decision {
            // Approve path
            admin_rec.approved = true;
            all_grants.approved += 1;
            log!(&env, "Grant ID: {} has been APPROVED", grant_id);
        } else {
            // Reject path — also close the grant immediately
            admin_rec.rejected = true;
            all_grants.rejected += 1;

            // Mark the grant itself as closed
            let mut closed_grant = grant.clone();
            closed_grant.is_closed = true;
            env.storage()
                .instance()
                .set(&Grantbook::Grant(grant_id), &closed_grant);
            log!(&env, "Grant ID: {} has been REJECTED", grant_id);
        }

        admin_rec.grant_id = grant_id;
        admin_rec.review_time = time;

        env.storage()
            .instance()
            .set(&AdminGrantbook::AdminRecord(grant_id), &admin_rec);
        env.storage().instance().set(&ALL_GRANTS, &all_grants);
        env.storage().instance().extend_ttl(5000, 5000);
    }


    // -----------------------------------------------------------------
    // FUNCTION 3 — disburse_grant
    // Called by the admin to mark an approved grant's funds as disbursed.
    // In a production system this would trigger an actual token transfer;
    // here we record the disbursement event on-chain for full auditability.
    // -----------------------------------------------------------------
    pub fn disburse_grant(env: Env, grant_id: u64) {
        let mut grant = Self::view_grant(env.clone(), grant_id);
        let mut admin_rec = Self::view_admin_record(env.clone(), grant_id);

        // Guard: must be approved, not yet disbursed, and not closed
        if !admin_rec.approved {
            log!(&env, "Disbursement failed: grant is not approved");
            panic!("Disbursement failed: grant is not approved");
        }
        if admin_rec.disbursed {
            log!(&env, "Disbursement failed: funds already disbursed");
            panic!("Disbursement failed: funds already disbursed");
        }
        if grant.is_closed {
            log!(&env, "Disbursement failed: grant is already closed");
            panic!("Disbursement failed: grant is already closed");
        }

        let time = env.ledger().timestamp();

        // Record disbursement and close the grant lifecycle
        admin_rec.disbursed = true;
        admin_rec.review_time = time;
        grant.is_closed = true;

        let mut all_grants = Self::view_all_grant_status(env.clone());
        all_grants.disbursed += 1;

        env.storage()
            .instance()
            .set(&Grantbook::Grant(grant_id), &grant);
        env.storage()
            .instance()
            .set(&AdminGrantbook::AdminRecord(grant_id), &admin_rec);
        env.storage().instance().set(&ALL_GRANTS, &all_grants);
        env.storage().instance().extend_ttl(5000, 5000);

        log!(&env, "Grant ID: {} funds have been DISBURSED", grant_id);
    }


    // -----------------------------------------------------------------
    // FUNCTION 4 — view_grant
    // Returns the Grant struct for the given grant_id.
    // Returns a default (empty) Grant if the ID does not exist.
    // -----------------------------------------------------------------
    pub fn view_grant(env: Env, grant_id: u64) -> Grant {
        env.storage()
            .instance()
            .get(&Grantbook::Grant(grant_id))
            .unwrap_or(Grant {
                grant_id: 0,
                title: String::from_str(&env, "Not_Found"),
                descrip: String::from_str(&env, "Not_Found"),
                applicant: String::from_str(&env, "Not_Found"),
                amount: 0,
                crt_time: 0,
                is_closed: true,
            })
    }


    // Helper — returns the AdminRecord for a given grant_id
    pub fn view_admin_record(env: Env, grant_id: u64) -> AdminRecord {
        env.storage()
            .instance()
            .get(&AdminGrantbook::AdminRecord(grant_id))
            .unwrap_or(AdminRecord {
                grant_id: 0,
                approved: false,
                disbursed: false,
                rejected: false,
                review_time: 0,
            })
    }


    // Helper — returns the global GrantStatus counters
    pub fn view_all_grant_status(env: Env) -> GrantStatus {
        env.storage()
            .instance()
            .get(&ALL_GRANTS)
            .unwrap_or(GrantStatus {
                total: 0,
                approved: 0,
                disbursed: 0,
                rejected: 0,
            })
    }
}