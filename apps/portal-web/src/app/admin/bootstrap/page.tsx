"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebase } from "@/lib/firebaseClient";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AdminBootstrapPage() {
    const { auth, functions } = useMemo(() => getFirebase(), []);
    const [status, setStatus] = useState<string>("Checking auth...");
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (!u) router.replace("/login");
            else setStatus(`Signed in as ${u.email}`);
        });
        return () => unsub();
    }, [auth, router]);

    const makeMeAdmin = async () => {
        setStatus("Calling dev_setMyRoleAdmin...");
        const fn = httpsCallable(functions, "dev_setMyRoleAdmin");
        const res = await fn({});
        setStatus(`Done: ${JSON.stringify(res.data)}`);
        // Refresh token để nhận claim mới
        await auth.currentUser?.getIdToken(true);
        setStatus("Admin claim applied. You can now create staff.");
    };

    return (
        <main style={{ padding: 24, maxWidth: 720 }}>
            <h1>Bootstrap Admin (Emulator only)</h1>
            <p style={{ opacity: 0.8 }}>{status}</p>
            <button onClick={makeMeAdmin}>Make my account Admin</button>
        </main>
    );
}
