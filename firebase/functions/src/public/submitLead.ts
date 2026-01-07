import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {normalizeVNPhone} from "../helpers/phone";
import {verifyTurnstile} from "../helpers/captcha";

type SubmitLeadRequest = {
  fullName: string;
  phone: string;
  email?: string;
  note?: string;
  tourSlug?: string;
  captchaToken: string;
};

export const publicSubmitLead = onCall(async (req) => {
  const data = req.data as SubmitLeadRequest;

  if (!data?.fullName || !data?.phone) {
    throw new HttpsError("invalid-argument", "fullName and phone are required");
  }
  if (!(await verifyTurnstile(data.captchaToken))) {
    throw new HttpsError("permission-denied", "captcha_failed");
  }

  const db = getFirestore();

  const dedupeKey = normalizeVNPhone(data.phone);
  if (dedupeKey.length < 10) {
    throw new HttpsError("invalid-argument", "invalid_phone");
  }

  // Dedupe window: 7 days
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now - sevenDaysMs);

  const leadsRef = db.collection("leads");
  const qSnap = await leadsRef
    .where("dedupeKey", "==", dedupeKey)
    .where("createdAt", ">=", cutoff)
    .limit(1)
    .get();

  const payloadBase = {
    fullName: data.fullName,
    phone: data.phone,
    email: data.email || null,
    note: data.note || null,
    tourSlugSnapshot: data.tourSlug || null,

    source: "web_form",
    status: "new",
    dedupeKey,

    updatedAt: FieldValue.serverTimestamp(),
    lastSubmittedAt: FieldValue.serverTimestamp(),
  };

  // CASE 1: Is exist -> Update
  if (!qSnap.empty) {
    const leadDoc = qSnap.docs[0];
    await leadDoc.ref.set(payloadBase, {merge: true});

    await leadDoc.ref.collection("activities").add({
      type: "note",
      content: "Customer resubmitted lead form (deduped)",
      createdAt: FieldValue.serverTimestamp(),
      createdBy: "system",
    });

    return {result: "deduped_updated", leadId: leadDoc.id};
  }
  // CASE 2: New -> Set SLA
  // Logic: SLA deadline = Now + 24 hours
  const slaHours = 24;
  const slaDate = new Date(now + slaHours * 60 * 60 * 1000);

  const newLeadRef = await leadsRef.add({
    ...payloadBase,
    assignedTo: null, // Quan trọng để query unassigned
    slaFirstResponseDueAt: slaDate, // Timestamp
    createdAt: FieldValue.serverTimestamp(),
  });

  await newLeadRef.collection("activities").add({
    type: "status_change",
    fromStatus: null,
    toStatus: "new",
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "system",
  });

  return {result: "created", leadId: newLeadRef.id};
});
