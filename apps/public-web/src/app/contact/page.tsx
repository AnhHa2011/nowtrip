"use client";

import { httpsCallable } from "firebase/functions";
import { getFirebase } from "@/lib/firebaseClient";

export default function ContactPage() {
    const submit = async () => {
        try {
            const { functions } = getFirebase();
            const fn = httpsCallable(functions, "public_submitLead");
            const res = await fn({
                fullName: "Test User",
                phone: "0979346227",
                email: "test@example.com",
                note: "Hello",
                tourSlug: "ta-nang-phan-dung",
                captchaToken: "testtoken_123456"
            });
            console.log("submitLead result:", res.data);
            alert(JSON.stringify(res.data));
        } catch (e: any) {
            console.error("submitLead error:", e);
            alert(e?.message || String(e));
        }
    };


    return (
        <main style={{ padding: 24 }}>
            <button onClick={submit}>Submit Lead (Emulator)</button>
        </main>
    );
}
