import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";

import { userSignTransaction } from "./Freighter";

/* ================= Config ================= */

const RPC_URL = "https://soroban-testnet.stellar.org:443";
const NETWORK = Networks.TESTNET;

const CONTRACT_ADDRESS = "CASGDQQ7B5ZMVWRGZ5CYQMULRSJ3VNHZIP7U7CQYQRVGDJWDGRSQNKXP";

const server = new StellarRpc.Server(RPC_URL);

const TX_PARAMS = {
  fee: BASE_FEE,
  networkPassphrase: NETWORK,
};

/* ================= Helpers ================= */

const stringToScVal  = (value)  => nativeToScVal(value, { type: "string" });
const numberToU64    = (value)  => nativeToScVal(value, { type: "u64" });
const boolToScVal    = (value)  => nativeToScVal(value, { type: "bool" });

/* ================= Core Contract Interaction ================= */

async function contractInt(caller, fnName, values) {
  // 1. Load the caller account from the network
  const sourceAccount = await server.getAccount(caller);
  const contract = new Contract(CONTRACT_ADDRESS);

  // 2. Build the transaction
  const builder = new TransactionBuilder(sourceAccount, TX_PARAMS);

  if (Array.isArray(values)) {
    builder.addOperation(contract.call(fnName, ...values));
  } else if (values !== undefined && values !== null) {
    builder.addOperation(contract.call(fnName, values));
  } else {
    builder.addOperation(contract.call(fnName));
  }

  const tx = builder.setTimeout(30).build();

  // 3. Prepare the transaction (Soroban simulation + footprint)
  const preparedTx = await server.prepareTransaction(tx);

  // 4. Serialize to XDR for signing
  const xdr = preparedTx.toXDR();

  // 5. Sign with Freighter wallet
  const signed = await userSignTransaction(xdr, caller);
  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK);

  // 6. Broadcast the signed transaction
  const send = await server.sendTransaction(signedTx);

  // 7. Poll for confirmation (up to 10 seconds)
  for (let i = 0; i < 10; i++) {
    const res = await server.getTransaction(send.hash);

    if (res.status === "SUCCESS") {
      if (res.returnValue) {
        return scValToNative(res.returnValue);
      }
      return null;
    }

    if (res.status === "FAILED") {
      throw new Error("Transaction failed");
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error("Transaction timeout");
}

async function contractRead(caller, fnName, values) {
  const sourceAccount = await server.getAccount(caller);
  const contract = new Contract(CONTRACT_ADDRESS);
  const builder = new TransactionBuilder(sourceAccount, TX_PARAMS);

  if (Array.isArray(values)) {
    builder.addOperation(contract.call(fnName, ...values));
  } else if (values !== undefined && values !== null) {
    builder.addOperation(contract.call(fnName, values));
  } else {
    builder.addOperation(contract.call(fnName));
  }

  const tx = builder.setTimeout(30).build();
  const sim = await server.simulateTransaction(tx);

  if (sim.error) {
    throw new Error(sim.error);
  }

  const retval = sim?.result?.retval ?? sim?.retval ?? null;
  if (!retval) return null;

  if (typeof retval === "string") {
    return scValToNative(xdr.ScVal.fromXDR(retval, "base64"));
  }
  return scValToNative(retval);
}

/* ================= Contract Functions ================= */

/**
 * submitGrant — Register a new grant application on-chain.
 *
 * @param {string} caller      - The applicant's Stellar public key
 * @param {string} title       - Short title for the grant
 * @param {string} descrip     - Detailed description / purpose
 * @param {string} applicant   - Applicant name or identifier
 * @param {number} amount      - Requested grant amount (u64, smallest unit)
 * @returns {Promise<number>}  - The unique grant_id assigned on-chain
 */
async function submitGrant(caller, title, descrip, applicant, amount) {
  try {
    const values = [
      stringToScVal(title),
      stringToScVal(descrip),
      stringToScVal(applicant),
      numberToU64(amount),
    ];

    const result = await contractInt(caller, "submit_grant", values);

    console.log("Grant submitted. Grant ID:", Number(result));
    return Number(result);
  } catch (error) {
    console.error("submitGrant failed:", error);
    throw error;
  }
}

/**
 * reviewGrant — Admin approves or rejects a pending grant.
 *
 * @param {string}  caller    - The admin's Stellar public key
 * @param {number}  grantId   - The grant_id to review
 * @param {boolean} decision  - true = approve, false = reject
 * @returns {Promise<null>}
 */
async function reviewGrant(caller, grantId, decision) {
  try {
    const values = [
      numberToU64(grantId),
      boolToScVal(decision),
    ];

    await contractInt(caller, "review_grant", values);

    console.log(`Grant ID ${grantId} reviewed. Decision: ${decision ? "APPROVED" : "REJECTED"}`);
    return null;
  } catch (error) {
    console.error("reviewGrant failed:", error);
    throw error;
  }
}

/**
 * disburseGrant — Admin marks an approved grant's funds as disbursed.
 *
 * @param {string} caller   - The admin's Stellar public key
 * @param {number} grantId  - The grant_id to disburse
 * @returns {Promise<null>}
 */
async function disburseGrant(caller, grantId) {
  try {
    const value = numberToU64(grantId);

    await contractInt(caller, "disburse_grant", value);

    console.log(`Grant ID ${grantId} funds DISBURSED.`);
    return null;
  } catch (error) {
    console.error("disburseGrant failed:", error);
    throw error;
  }
}

/**
 * viewGrant — Read the full Grant struct for a given grant_id (read-only simulation).
 *
 * @param {string} caller   - Any Stellar public key (read-only, no signing needed)
 * @param {number} grantId  - The grant_id to look up
 * @returns {Promise<Object>} - { grant_id, title, descrip, applicant, amount, crt_time, is_closed }
 */
async function viewGrant(caller, grantId) {
  try {
    const value = numberToU64(grantId);
    const result = await contractRead(caller, "view_grant", value);

    const grant = {
      grant_id:  Number(result.grant_id),
      title:     result.title.toString(),
      descrip:   result.descrip.toString(),
      applicant: result.applicant.toString(),
      amount:    Number(result.amount),
      crt_time:  Number(result.crt_time),
      is_closed: Boolean(result.is_closed),
    };

    console.log("Grant details:", grant);
    return grant;
  } catch (error) {
    console.error("viewGrant failed:", error);
    throw error;
  }
}

/**
 * viewAdminRecord — Read the admin-controlled state for a given grant_id.
 *
 * @param {string} caller   - Any Stellar public key
 * @param {number} grantId  - The grant_id to look up
 * @returns {Promise<Object>} - { grant_id, approved, disbursed, rejected, review_time }
 */
async function viewAdminRecord(caller, grantId) {
  try {
    const value = numberToU64(grantId);
    const result = await contractRead(caller, "view_admin_record", value);

    const adminRecord = {
      grant_id:    Number(result.grant_id),
      approved:    Boolean(result.approved),
      disbursed:   Boolean(result.disbursed),
      rejected:    Boolean(result.rejected),
      review_time: Number(result.review_time),
    };

    console.log("Admin record:", adminRecord);
    return adminRecord;
  } catch (error) {
    console.error("viewAdminRecord failed:", error);
    throw error;
  }
}

/**
 * viewAllGrantStatus — Read the global grant statistics counters.
 *
 * @param {string} caller - Any Stellar public key
 * @returns {Promise<Object>} - { total, approved, disbursed, rejected }
 */
async function viewAllGrantStatus(caller) {
  try {
    const result = await contractRead(caller, "view_all_grant_status", null);

    const status = {
      total:     Number(result.total),
      approved:  Number(result.approved),
      disbursed: Number(result.disbursed),
      rejected:  Number(result.rejected),
    };

    console.log("All grant status:", status);
    return status;
  } catch (error) {
    console.error("viewAllGrantStatus failed:", error);
    throw error;
  }
}

/* ================= Exports ================= */

export {
  submitGrant,
  reviewGrant,
  disburseGrant,
  viewGrant,
  viewAdminRecord,
  viewAllGrantStatus,
};
