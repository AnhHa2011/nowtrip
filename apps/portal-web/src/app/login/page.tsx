"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebase } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("anhhn201197@gmail.com");
    const [password, setPassword] = useState("12345678");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const login = async () => {
        setLoading(true);
        try {
            const { auth } = getFirebase();
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/leads");
        } catch (e: any) {
            alert(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: 24, maxWidth: 420 }}>
            <h1>Portal Login</h1>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
                <button onClick={login} disabled={loading}>{loading ? "..." : "Login"}</button>
            </div>
        </main>
    );
}
