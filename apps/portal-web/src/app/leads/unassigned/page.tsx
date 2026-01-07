"use client";

import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirebase } from "@/lib/firebaseClient"; // Đảm bảo import đúng

type Lead = {
    id: string;
    fullName?: string; // Sửa name -> fullName cho khớp với DB
    phone?: string;
    createdAt?: Timestamp;
    slaFirstResponseDueAt?: Timestamp;
    status?: string;
};

export default function UnassignedLeadsPage() {
    const { db } = getFirebase(); // Lấy db từ hook/lib chuẩn
    const [items, setItems] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query: Unassigned + Sort by SLA ASC (gấp nhất lên đầu)
        const q = query(
            collection(db, "leads"),
            where("assignedTo", "==", null),
            orderBy("slaFirstResponseDueAt", "asc"),
            // orderBy("createdAt", "asc"), // Có thể bỏ nếu muốn index đơn giản hơn, hoặc cần composite index
            limit(50)
        );

        const unsub = onSnapshot(q, (snap) => {
            setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
            setLoading(false);
        });

        return () => unsub();
    }, [db]);

    const checkSlaStatus = (dueAt?: Timestamp) => {
        if (!dueAt) return { color: "gray", label: "No SLA" };
        const now = Date.now();
        const due = dueAt.toDate().getTime();
        const diffHours = (due - now) / (1000 * 60 * 60);

        if (diffHours < 0) return { color: "#ef4444", label: `OVERDUE ${Math.abs(Math.round(diffHours))}h`, bg: "#fee2e2" }; // Red
        if (diffHours < 4) return { color: "#f59e0b", label: `Due in ${Math.round(diffHours)}h`, bg: "#fef3c7" }; // Orange
        return { color: "#10b981", label: `Due in ${Math.round(diffHours)}h`, bg: "#d1fae5" }; // Green
    };

    if (loading) return <div style={{ padding: 24 }}>Loading queue...</div>;

    return (
        <div style={{ padding: 24, maxWidth: 800 }}>
            <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
                Unassigned Queue <span style={{ fontSize: 16, fontWeight: "normal", color: "#666" }}>({items.length})</span>
            </h1>

            <div style={{ display: "grid", gap: 12 }}>
                {items.length === 0 && <div style={{ fontStyle: "italic", color: "#888" }}>Great job! Queue is empty.</div>}

                {items.map(x => {
                    const sla = checkSlaStatus(x.slaFirstResponseDueAt);
                    return (
                        <div key={x.id} style={{
                            border: "1px solid #ddd",
                            padding: 16,
                            borderRadius: 8,
                            backgroundColor: "white",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <b style={{ fontSize: 18 }}>{x.fullName ?? "(No name)"}</b>
                                    <span style={{
                                        fontSize: 12,
                                        padding: "2px 8px",
                                        borderRadius: 12,
                                        backgroundColor: sla.bg,
                                        color: sla.color,
                                        fontWeight: 600
                                    }}>
                                        {sla.label}
                                    </span>
                                </div>
                                <div style={{ color: "#555" }}>{x.phone}</div>
                                <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                                    Created: {x.createdAt?.toDate?.()?.toLocaleString() ?? "N/A"}
                                </div>
                            </div>

                            <Link
                                href={`/leads/${x.id}`}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#2563eb",
                                    color: "white",
                                    borderRadius: 6,
                                    textDecoration: "none",
                                    fontSize: 14
                                }}
                            >
                                Review & Assign
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}