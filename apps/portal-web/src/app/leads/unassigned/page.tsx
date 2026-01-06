"use client";

import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // chỗ bạn init
import { useEffect, useState } from "react";

type Lead = {
    id: string;
    name?: string;
    phone?: string;
    createdAt?: any;
    slaFirstResponseDueAt?: any;
};

export default function UnassignedLeadsPage() {
    const [items, setItems] = useState<Lead[]>([]);

    useEffect(() => {
        (async () => {
            const q = query(
                collection(db, "leads"),
                where("assignedTo", "==", null),
                orderBy("slaFirstResponseDueAt", "asc"),
                orderBy("createdAt", "asc"),
                limit(50)
            );
            const snap = await getDocs(q);
            setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        })();
    }, []);

    return (
        <div>
            <h1>Unassigned queue</h1>
            <div style={{ display: "grid", gap: 12 }}>
                {items.map(x => (
                    <div key={x.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
                        <div><b>{x.name ?? "(no name)"}</b> — {x.phone ?? ""}</div>
                        <div>Due: {x.slaFirstResponseDueAt?.toDate?.()?.toLocaleString?.() ?? ""}</div>
                        <a href={`/leads/${x.id}`}>Open</a>
                    </div>
                ))}
            </div>
        </div>
    );
}
