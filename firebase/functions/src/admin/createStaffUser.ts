import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

type CreateStaffUserRequest = {
    email: string;
    password: string;
    displayName: string;
};

export const admin_createStaffUser = onCall(async (req) => {
    const role = (req.auth?.token as any)?.role;
    if (role !== "admin") throw new HttpsError("permission-denied", "admin_only");

    const data = req.data as CreateStaffUserRequest;
    if (!data?.email || !data?.password || !data?.displayName) {
        throw new HttpsError("invalid-argument", "email/password/displayName required");
    }

    const auth = getAuth();
    const user = await auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName
    });

    await auth.setCustomUserClaims(user.uid, { role: "staff" });

    const db = getFirestore();
    await db.collection("users").doc(user.uid).set({
        role: "staff",
        status: "active",
        email: data.email,
        displayName: data.displayName,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: req.auth?.uid || null
    });

    return { uid: user.uid, email: data.email };
});
