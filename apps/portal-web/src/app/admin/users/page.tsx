"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebase } from "@/lib/firebaseClient";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
    const { auth, functions } = useMemo(() => getFirebase(), []);
    const router = useRouter();

    const [email, setEmail] = useState("staff1@nowtrip.vn");
    const [password, setPassword] = useState("12345678");
    const [displayName, setDisplayName] = useState("Staff 1");
    const [msg, setMsg] = useState("");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                router.replace("/login");
                return;
            }
            await u.getIdToken(true); // lấy claim mới nhất
        });
        return () => unsub();
    }, [auth, router]);

    const createStaff = async () => {
        setMsg("Creating staff...");
        try {
            const fn = httpsCallable(functions, "admin_createStaffUser");
            const res = await fn({ email, password, displayName });
            setMsg(`OK: ${JSON.stringify(res.data)}`);
        } catch (e: any) {
            setMsg(e?.message || String(e));
        }
    };

    return (
        <main style={{ padding: 24, maxWidth: 520 }}>
            <h1>Admin - Create Staff</h1>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="displayName" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />

                <button onClick={createStaff}>Create Staff</button>
                <div style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>{msg}</div>
            </div>
        </main>
    );
}
