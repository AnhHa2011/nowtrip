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
    Timestamp,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Lead = {
    id: string;
    fullName: string;
    phone: string;
    email?: string | null;
    note?: string | null;
    status: string;
    assignedTo?: string | null;
    createdAt?: Timestamp;
    lastContactedAt?: Timestamp;
};

const STATUS = ["new", "contacting", "scheduled", "won", "lost"] as const;

export default function LeadDetailPage() {
    const params = useParams<{ id: string }>();
    const leadId = params.id;
    const router = useRouter();

    const [lead, setLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);

    const { auth, db } = useMemo(() => getFirebase(), []);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace("/login");
                return;
            }
            setCurrentUser(user);

            const leadRef = doc(db, "leads", leadId);
            const unsubLead = onSnapshot(leadRef, (snap) => {
                if (snap.exists()) {
                    setLead({ id: snap.id, ...(snap.data() as any) });
                }
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
        if (!lead || !currentUser) return;
        const leadRef = doc(db, "leads", leadId);

        await updateDoc(leadRef, {
            status,
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "status_change",
            fromStatus: lead.status,
            toStatus: status,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
        });
    };

    const addNote = async () => {
        const content = newNote.trim();
        if (!content || !currentUser) return;

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "note",
            content,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
        });

        setNewNote("");
    };

    const assignToMe = async () => {
        if (!currentUser) return;
        const leadRef = doc(db, "leads", leadId);

        await updateDoc(leadRef, {
            assignedTo: currentUser.uid,
            updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "assign",
            assignedTo: currentUser.uid,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
        });
    };

    const handleAction = async (action: "call" | "zalo") => {
        if (!lead || !currentUser) return;

        // 1. Mark contacted logic
        const shouldUpdateStatus = lead.status === "new";
        const updateData: any = {
            lastContactedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        if (shouldUpdateStatus) updateData.status = "contacting";

        await updateDoc(doc(db, "leads", leadId), updateData);

        await addDoc(collection(db, "leads", leadId, "activities"), {
            type: "contacted",
            method: action,
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid,
        });

        // 2. Open link
        if (action === "call") {
            window.open(`tel:${lead.phone}`);
        } else if (action === "zalo") {
            // Giả định phone VN, Zalo link
            window.open(`https://zalo.me/${lead.phone}`);
        }
    };

    if (!lead) return <main style={{ padding: 24 }}>Loading lead...</main>;

    const isAssignedToMe = currentUser && lead.assignedTo === currentUser.uid;
    const isUnassigned = !lead.assignedTo;

    return (
        <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
            <div style={{ marginBottom: 16 }}>
                <Link href="/leads" style={{ textDecoration: "none", color: "#666" }}>← Back to list</Link>
            </div>

            <div style={{
                border: "1px solid #e5e7eb",
                padding: 24,
                borderRadius: 12,
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: "bold", margin: 0 }}>{lead.fullName}</h1>
                        <div style={{ fontSize: 16, color: "#4b5563", marginTop: 4 }}>{lead.phone}</div>
                        {lead.email && <div style={{ fontSize: 14, color: "#6b7280" }}>{lead.email}</div>}
                    </div>

                    <div style={{ textAlign: "right" }}>
                        <div style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: 99,
                            backgroundColor: lead.status === "new" ? "#dbeafe" : "#f3f4f6",
                            color: lead.status === "new" ? "#1e40af" : "#374151",
                            fontWeight: 600,
                            fontSize: 14,
                            textTransform: "capitalize"
                        }}>
                            {lead.status}
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
                            Created: {lead.createdAt?.toDate().toLocaleDateString("vi-VN")}
                        </div>
                    </div>
                </div>

                {/* --- ACTION BAR --- */}
                <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 12 }}>
                    {isUnassigned && (
                        <button
                            onClick={assignToMe}
                            style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: 6, fontWeight: 500, border: "none", cursor: "pointer" }}
                        >
                            ✋ Assign to Me
                        </button>
                    )}

                    {/* Chỉ hiện nút gọi nếu đã assign cho mình hoặc mình là admin (logic đơn giản là cứ hiện) */}
                    <button
                        onClick={() => handleAction("call")}
                        style={{ backgroundColor: "#10b981", color: "white", padding: "8px 16px", borderRadius: 6, fontWeight: 500, border: "none", cursor: "pointer" }}
                    >
                        📞 Call
                    </button>

                    <button
                        onClick={() => handleAction("zalo")}
                        style={{ backgroundColor: "#0068ff", color: "white", padding: "8px 16px", borderRadius: 6, fontWeight: 500, border: "none", cursor: "pointer" }}
                    >
                        💬 Zalo
                    </button>
                </div>

                {/* --- UPDATE STATUS --- */}
                <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase" }}>Update Status</h3>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {STATUS.map((s) => (
                            <button
                                key={s}
                                onClick={() => updateStatus(s)}
                                disabled={lead.status === s}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: lead.status === s ? "2px solid #2563eb" : "1px solid #d1d5db",
                                    backgroundColor: lead.status === s ? "#eff6ff" : "white",
                                    color: lead.status === s ? "#1d4ed8" : "#374151",
                                    cursor: lead.status === s ? "default" : "pointer",
                                    fontWeight: lead.status === s ? 600 : 400,
                                    textTransform: "capitalize"
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- ADD NOTE --- */}
                <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 8, textTransform: "uppercase" }}>Quick Note</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Type a note..."
                            onKeyDown={(e) => e.key === "Enter" && addNote()}
                        />
                        <button
                            onClick={addNote}
                            style={{ padding: "8px 16px", backgroundColor: "#4b5563", color: "white", borderRadius: 6, border: "none", cursor: "pointer" }}
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TIMELINE --- */}
            <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Activity Timeline</h3>
                <div style={{ display: "grid", gap: 12 }}>
                    {activities.map((a) => (
                        <div key={a.id} style={{ display: "flex", gap: 12, fontSize: 14 }}>
                            <div style={{ minWidth: 120, color: "#9ca3af", textAlign: "right", fontSize: 12 }}>
                                {a.createdAt?.toDate().toLocaleString("vi-VN") || "Just now"}
                            </div>
                            <div style={{ flex: 1, paddingBottom: 12, borderLeft: "2px solid #e5e7eb", paddingLeft: 16, position: "relative" }}>
                                <div style={{ position: "absolute", left: -5, top: 0, width: 8, height: 8, borderRadius: "50%", backgroundColor: "#d1d5db" }} />

                                {a.type === "note" && (
                                    <div>
                                        <span style={{ fontWeight: 600 }}>Note:</span> {a.content}
                                    </div>
                                )}
                                {a.type === "status_change" && (
                                    <div>
                                        Changed status from <span style={{ color: "#6b7280" }}>{a.fromStatus ?? "New"}</span> to <b style={{ color: "#2563eb" }}>{a.toStatus}</b>
                                    </div>
                                )}
                                {a.type === "assign" && (
                                    <div style={{ color: "#059669" }}>
                                        ✋ Picked up this lead
                                    </div>
                                )}
                                {a.type === "contacted" && (
                                    <div style={{ color: "#d97706" }}>
                                        📞 Contacted via <b>{a.method}</b>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}