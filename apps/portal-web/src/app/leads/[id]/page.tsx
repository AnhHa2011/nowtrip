"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebase } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot as onSnapshotCol,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

type Lead = {
    fullName: string;
    phone: string;
    email?: string | null;
    note?: string | null;
    status: string;
    assignedTo?: string | null;
};

const STATUS = ["new", "contacting", "scheduled", "won", "lost"] as const;

export default function LeadDetailPage() {
    const params = useParams<{ id: string }>();
    const leadId = params.id;
    const router = useRouter();

    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");

    const { auth, db } = useMemo(() => getFirebase(), []);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace("/login");
                return;
            }

            const leadRef = doc(db, "leads", leadId);
            const unsubLead = onSnapshot(leadRef, (snap) => {
                setLead((snap.data() as any) || null);
            });

            const actRef = collection(db, "leads", leadId, "activities");
            const q = query(actRef, orderBy("createdAt", "desc"));
            const unsubAct = onSnapshotCol(q, (snap) => {
                setActivities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
            });

            return () => {
                unsubLead();
                unsubAct();
            };
        });

        return () => unsubAuth();
    }, [auth, db, leadId, router]);

    const updateStatus = async (status: string) => {
        if (!lead) return;
        const leadRef = doc(db, "leads", leadId);

        await updateDoc(leadRef, {
            status,
            updatedAt: serverTimestamp(),
        });

        // ghi activity note cho dễ audit
        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "status_change",
            fromStatus: lead.status,
            toStatus: status,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || "unknown",
        });
    };

    const addNote = async () => {
        const content = newNote.trim();
        if (!content) return;

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "note",
            content,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid || "unknown",
        });

        setNewNote("");
    };
    import { updateDoc, serverTimestamp } from "firebase/firestore";

    const assignToMe = async () => {
        const u = auth.currentUser;
        if (!u) return;

        await updateDoc(doc(db, "leads", leadId), {
            assignedTo: u.uid,
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "assign",
            assignedTo: u.uid,
            createdAt: serverTimestamp(),
            createdBy: u.uid,
        });
    };

    const markContacted = async () => {
        const u = auth.currentUser;
        if (!u) return;

        await updateDoc(doc(db, "leads", leadId), {
            lastContactedAt: serverTimestamp(),
            status: lead.status === "new" ? "contacting" : lead.status,
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "contacted",
            createdAt: serverTimestamp(),
            createdBy: u.uid,
        });
    };

    if (!lead) return <main style={{ padding: 24 }}>Loading lead...</main>;

    return (
        <main style={{ padding: 24, maxWidth: 900 }}>
            <button onClick={() => router.push("/leads")}>← Back</button>

            <h1 style={{ marginTop: 12 }}>{lead.fullName}</h1>
            <div style={{ opacity: 0.8 }}>{lead.phone}</div>
            {lead.email ? <div style={{ opacity: 0.8 }}>{lead.email}</div> : null}

            <section style={{ marginTop: 16 }}>
                <h3>Status</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STATUS.map((s) => (
                        <button
                            key={s}
                            onClick={() => updateStatus(s)}
                            disabled={lead.status === s}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </section>

            <section style={{ marginTop: 16 }}>
                <h3>Add note</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        style={{ flex: 1 }}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Note..."
                    />
                    <button onClick={addNote}>Add</button>
                </div>
            </section>

            <section style={{ marginTop: 16 }}>
                <h3>Activities</h3>
                <div style={{ display: "grid", gap: 8 }}>
                    {activities.map((a) => (
                        <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>{a.type}</div>
                            {a.type === "note" ? <div>{a.content}</div> : null}
                            {a.type === "status_change" ? (
                                <div>
                                    {a.fromStatus ?? "∅"} → <b>{a.toStatus}</b>
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
