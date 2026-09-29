import crypto from "node:crypto";
import { isMainThread, parentPort, workerData } from "node:worker_threads";

export function solveProof(salt, target) {
  for (let nonce = 0; ; nonce++) {
    const hash = crypto.createHash("sha256").update(`${salt}${nonce}`).digest("hex");
    if (hash.startsWith(target)) return nonce;
  }
}

if (!isMainThread && workerData?.proofs) {
  parentPort.postMessage(
    workerData.proofs.map(({ index, salt, target }) => ({
      index,
      nonce: solveProof(salt, target),
    })),
  );
  parentPort.close();
}
