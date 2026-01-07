"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebase } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    limit,
    where,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

function isSlaBreached(createdAt?: Timestamp | null, hours = 24): boolean {
    if (!createdAt) return false;
    const createdMs = createdAt.toDate().getTime();
    const nowMs = Date.now();
    return nowMs - createdMs > hours * 60 * 60 * 1000;
}

type Lead = {
    id: string;
    fullName: string;
    phone: string;
    status: string;
    assignedTo?: string | null;
};

const STATUS = ["all", "new", "contacting", "scheduled", "won", "lost"] as const;
type StatusFilter = (typeof STATUS)[number];

type LeadsTab = "unassigned" | "mine" | "all";

function getTab(searchParams: any): LeadsTab {
    const t = String(searchParams?.tab || "unassigned");
    if (t === "mine" || t === "all" || t === "unassigned") return t;
    return "unassigned";
}

export default function LeadsPage() {
    const { auth, db, functions } = useMemo(() => getFirebase(), []);
    const router = useRouter();

    const [ready, setReady] = useState(false);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [status, setStatus] = useState<StatusFilter>("all");
    const [onlyMine, setOnlyMine] = useState(false);
    const [search, setSearch] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.replace("/login");
                return;
            }

            const constraints: any[] = [];
            if (status !== "all") constraints.push(where("status", "==", status));
            if (onlyMine) constraints.push(where("assignedTo", "==", user.uid));

            const q = query(
                collection(db, "leads"),
                ...constraints,
                orderBy("createdAt", "desc"),
                limit(100)
            );

            const unsub = onSnapshot(q, (snap) => {
                const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setLeads(rows);
                setReady(true);
            });

            return () => unsub();
        });

        return () => unsubAuth();
    }, [auth, db, router, status, onlyMine]);
    // Hàm xử lý Export
    const handleExport = async () => {
        if (!confirm("Download all leads as CSV?")) return;
        setExporting(true);
        try {
            const fn = httpsCallable(functions, "admin_exportLeadsCsv");
            const result = await fn();
            const { csvContent } = result.data as any;

            // Trigger download browser
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            alert("Export failed: " + (e as any).message);
        } finally {
            setExporting(false);
        }
    };
    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        if (!s) return leads;
        return leads.filter((l) =>
            (l.fullName || "").toLowerCase().includes(s) ||
            (l.phone || "").toLowerCase().includes(s)
        );
    }, [leads, search]);

    if (!ready) return <main style={{ padding: 24 }}>Loading...</main>;

    return (
        <main style={{ padding: 24 }}>
            <h1>Leads</h1>
            {isAdmin && (
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        backgroundColor: "#0f172a",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: 6,
                        cursor: exporting ? "wait" : "pointer",
                        opacity: exporting ? 0.7 : 1
                    }}
                >
                    {exporting ? "Exporting..." : "⬇ Export CSV"}
                </button>
            )}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    {STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                        type="checkbox"
                        checked={onlyMine}
                        onChange={(e) => setOnlyMine(e.target.checked)}
                    />
                    My leads
                </label>

                <input
                    style={{ minWidth: 260 }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or phone"
                />
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {filtered.map((l) => (
                    <div
                        key={l.id}
                        style={{
                            border: "1px solid #ddd",
                            padding: 12,
                            borderRadius: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600 }}>{l.fullName}</div>
                            <div style={{ opacity: 0.8 }}>{l.phone}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                                Status: {l.status} {l.assignedTo ? "• Assigned" : "• Unassigned"}
                            </div>
                        </div>

                        <Link href={`/leads/${l.id}`}>Open</Link>
                    </div>
                ))}
            </div>
        </main>
    );
}
