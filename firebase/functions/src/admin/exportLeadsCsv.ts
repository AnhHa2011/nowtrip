import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";

export const adminExportLeadsCsv = onCall(async (req) => {
  // 1. Security Check: Chỉ Admin mới được export
  if (req.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admin can export data");
  }

  const db = getFirestore();

  // 2. Fetch all leads
  const snap = await db.collection("leads").get();

  // 3. Define CSV Headers
  const headers = [
    "ID",
    "Created At",
    "Full Name",
    "Phone",
    "Status",
    "Source",
    "Assigned To",
    "Note",
    "Last Contacted",
  ];

  // 4. Build CSV Rows
  const rows = snap.docs.map((doc) => {
    const d = doc.data();

    // Helper to format date
    const fmtDate = (ts: any) => ts?.toDate ? ts.toDate().toISOString() : "";
    // Helper to escape CSV special chars (commas, quotes, newlines)
    const escape = (str: string) => {
      if (!str) return "";
      const s = String(str).replace(/"/g, ""); // double quote escape
      return `"${s}"`;
    };

    return [
      doc.id,
      fmtDate(d.createdAt),
      escape(d.fullName),
      escape(d.phone),
      d.status,
      d.source || "unknown",
      d.assignedTo || "unassigned",
      escape(d.note),
      fmtDate(d.lastContactedAt),
    ].join(",");
  });

  // 5. Combine Header & Rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  return {csvContent, count: rows.length};
});
