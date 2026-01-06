import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";

export const dev_setMyRoleAdmin = onCall(async (req) => {
    // CHỈ cho emulator
    if (process.env.FUNCTIONS_EMULATOR !== "true") {
        throw new HttpsError("failed-precondition", "dev_only");
    }

    if (!req.auth?.uid) throw new HttpsError("unauthenticated", "login_required");

    await getAuth().setCustomUserClaims(req.auth.uid, { role: "admin" });
    return { ok: true, uid: req.auth.uid, role: "admin" };
});
