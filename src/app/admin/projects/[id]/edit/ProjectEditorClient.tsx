"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  upsertAssignmentAction,
  addRoleAction,
  renameRoleAction,
  deleteRoleAction,
} from "./_actions";

export type Availability = "available" | "limited" | "unavailable";
export type Employee = { id: string; name: string; role?: string; availability?: Availability };
export type TimelineRole = {
  id: string;
  label: string;
  color?: string | null;
  sort_index?: number | null;
  assignedEmployeeId?: string | null;
};
export type Assignment = {
  id: string;
  role_id: string;
  employee_id: string;
  starts_on: string | null;
  ends_on: string | null;
  note: string | null;
};

export default function ProjectEditorClient({
  project,
  initialRoles,
  initialAssignments,
}: {
  project: any;
  initialRoles: TimelineRole[];
  initialAssignments: Assignment[];
}) {
  const [tab, setTab] = useState<"overview" | "timeline" | "calendar" | "staffing">("timeline");
  const [isPending, startTransition] = useTransition();

  // TODO: echte Mitarbeitendenliste aus Supabase/Store laden
  const [employees] = useState<Employee[]>([
    { id: "e1", name: "Mara Schulz", role: "Technik", availability: "available" },
    { id: "e2", name: "Jonas Weber", role: "Licht", availability: "limited" },
    { id: "e3", name: "Lea Brandt", role: "Stage", availability: "unavailable" },
    { id: "e4", name: "Uli Test", role: "FOH", availability: "available" },
  ]);

  const [roles, setRoles] = useState<TimelineRole[]>(
    initialRoles.length
      ? initialRoles
      : [
          { id: "tmp-r1", label: "FOH" },
          { id: "tmp-r2", label: "Licht" },
          { id: "tmp-r3", label: "Bühne" },
        ]
  );

  // apply assignments → assignedEmployeeId
  useEffect(() => {
    if (!initialAssignments?.length) return;
    setRoles((prev) =>
      prev.map((r) => {
        const a = initialAssignments.find((x) => x.role_id === r.id);
        return a ? { ...r, assignedEmployeeId: a.employee_id } : r;
      })
    );
  }, [initialAssignments]);

  const startISO = project.start_date || toISODate(new Date());
  const endISO = project.end_date || toISODate(addDays(new Date(), 14));
  const days = useMemo(() => enumerateDays(startISO, endISO), [startISO, endISO]);

  function onDropAssign(roleId: string, empId: string) {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, assignedEmployeeId: empId } : r)));
    startTransition(() => {
      void upsertAssignmentAction({ project_id: project.id, role_id: roleId, employee_id: empId });
    });
  }

  function onClear(roleId: string) {
    setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, assignedEmployeeId: null } : r)));
    startTransition(() => {
      void upsertAssignmentAction({ project_id: project.id, role_id: roleId, employee_id: null });
    });
  }

  // Role CRUD – ohne async/await im Callback, Promise wird „verworfen“
  function addRole() {
    const label = prompt("Neue Rolle (Label)?");
    if (!label) return;
    startTransition(() => {
      void addRoleAction(project.id, label);
    });
  }

  function renameRole(roleId: string, current: string) {
    const label = prompt("Neuer Rollenname:", current);
    if (!label || label === current) return;
    startTransition(() => {
      void renameRoleAction(project.id, roleId, label);
    });
  }

  function removeRole(roleId: string) {
    if (!confirm("Rolle wirklich löschen? (Zuweisung wird entfernt)")) return;
    startTransition(() => {
      void deleteRoleAction(project.id, roleId);
    });
  }

  return (
    <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Übersicht</TabsTrigger>
        <TabsTrigger value="timeline">Zeitleiste</TabsTrigger>
        <TabsTrigger value="calendar">Kalender</TabsTrigger>
        <TabsTrigger value="staffing">Personal</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Projektname">
            <Input defaultValue={project.name} readOnly />
          </Field>
          <Field label="Kunde">
            <Input defaultValue={project.client_name ?? ""} readOnly />
          </Field>
          <Field label="Ort">
            <Input defaultValue={project.location ?? ""} readOnly />
          </Field>
          <Field label="Zeitraum">
            <div className="flex items-center gap-2">
              <Input type="date" defaultValue={startISO} className="w-auto" readOnly />
              <span className="text-white/60">bis</span>
              <Input type="date" defaultValue={endISO} className="w-auto" readOnly />
            </div>
          </Field>
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rollen & Zuweisungen</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={addRole} disabled={isPending}>
              Rolle hinzufügen
            </Button>
          </div>
        </div>
        <EmployeeTray employees={employees} />
        <TimelineGantt
          days={days}
          roles={roles}
          employees={employees}
          onDropAssign={onDropAssign}
          onClear={onClear}
          onRenameRole={renameRole}
          onDeleteRole={removeRole}
        />
      </TabsContent>

      <TabsContent value="calendar">
        <WeekCalendar days={days} />
      </TabsContent>

      <TabsContent value="staffing">
        <StaffingTable employees={employees} days={days} />
      </TabsContent>
    </Tabs>
  );
}

/* ---------- kleine UI-Helfer ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm text-white/80">{label}</Label>
      {children}
    </div>
  );
}

function EmployeeTray({ employees }: { employees: Employee[] }) {
  return (
    <section className="bg-white/5 rounded-2xl border border-white/10">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-medium">Mitarbeitende</h3>
        <input
          placeholder="Suchen…"
          className="rounded-xl bg-black/30 border border-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
        {employees.map((e) => (
          <EmployeeCard key={e.id} e={e} />
        ))}
      </div>
    </section>
  );
}

function EmployeeCard({ e }: { e: Employee }) {
  const badge =
    e.availability === "available"
      ? { txt: "Verfügbar", cls: "bg-green-500/20 text-green-300" }
      : e.availability === "limited"
      ? { txt: "Begrenzt", cls: "bg-yellow-500/20 text-yellow-300" }
      : { txt: "Nicht verfügbar", cls: "bg-red-500/20 text-red-300" };
  return (
    <div
      className="group rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData("text/employeeId", e.id);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-sm">
          {e.name.split(" ")[0][0]}
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{e.name}</div>
          <div className="text-xs text-white/60 truncate">{e.role ?? "—"}</div>
        </div>
      </div>
      <div className={`mt-2 inline-flex text-[11px] px-2 py-0.5 rounded-md ${badge.cls}`}>{badge.txt}</div>
    </div>
  );
}

function TimelineGantt({
  days,
  roles,
  employees,
  onDropAssign,
  onClear,
  onRenameRole,
  onDeleteRole,
}: {
  days: Date[];
  roles: TimelineRole[];
  employees: Employee[];
  onDropAssign: (roleId: string, employeeId: string) => void;
  onClear: (roleId: string) => void;
  onRenameRole: (roleId: string, current: string) => void;
  onDeleteRole: (roleId: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(48px, 1fr))` }}>
        <div className="bg-white/5 border-b border-white/10 p-3 font-medium sticky left-0 z-10">Positionen</div>
        {days.map((d, i) => (
          <div
            key={i}
            className="bg-white/5 border-b border-l border-white/10 p-2 text-center text-xs text-white/70"
          >
            <div className="font-medium text-white/80">{formatDay(d)}</div>
            <div className="text-white/50">{formatWeekdayShort(d)}</div>
          </div>
        ))}
      </div>

      {roles.map((r) => {
        const emp = employees.find((e) => e.id === r.assignedEmployeeId);
        return (
          <div
            key={r.id}
            className="grid"
            style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(48px, 1fr))` }}
          >
            <div className="sticky left-0 z-10 bg-black/40 backdrop-blur border-b border-white/10 p-3 flex items-center gap-2">
              <div className="font-medium flex-1">{r.label}</div>
              <div className="text-xs text-white/50 mr-2">{emp ? emp.name : "—"}</div>
              <button
                className="text-xs rounded-md border border-white/15 px-2 py-0.5 hover:bg-white/10"
                onClick={() => onRenameRole(r.id, r.label)}
              >
                Umbenennen
              </button>
              <button
                className="text-xs rounded-md border border-red-400/40 text-red-200 px-2 py-0.5 hover:bg-red-500/20"
                onClick={() => onDeleteRole(r.id)}
              >
                Löschen
              </button>
            </div>
            {days.map((_, i) => (
              <DropCell key={i} onDrop={(employeeId) => onDropAssign(r.id, employeeId)} highlight={!!emp} />
            ))}
          </div>
        );
      })}

      <div className="relative">
        {roles.map((r, rowIdx) => (
          <RoleBar
            key={r.id}
            rowIndex={rowIdx}
            daysCount={days.length}
            label={r.label}
            employeeName={employees.find((e) => e.id === r.assignedEmployeeId)?.name}
            onClear={() => onClear(r.id)}
          />
        ))}
      </div>
    </section>
  );
}

function DropCell({ onDrop, highlight }: { onDrop: (employeeId: string) => void; highlight?: boolean }) {
  return (
    <div
      className={`h-12 border-b border-l border-white/10 ${highlight ? "bg-softbrew-blue/5" : "bg-black/20"}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/employeeId");
        if (id) onDrop(id);
      }}
    />
  );
}

function RoleBar({
  rowIndex,
  daysCount,
  label,
  employeeName,
  onClear,
}: {
  rowIndex: number;
  daysCount: number;
  label: string;
  employeeName?: string;
  onClear: () => void;
}) {
  const top = 48 + rowIndex * 48;
  const left = 240;
  return (
    <div className="pointer-events-none absolute inset-0" style={{ top: 0 }}>
      <div
        className="pointer-events-auto absolute mt-2 ml-2 rounded-xl border border-white/10 bg-white/10 backdrop-blur px-3 py-1 text-sm flex items-center gap-2"
        style={{ top: top, left: left, right: 12 }}
      >
        <span className="font-medium">{label}</span>
        {employeeName ? (
          <span className="text-white/70">· {employeeName}</span>
        ) : (
          <span className="text-white/50">· unbesetzt</span>
        )}
        {employeeName && (
          <button
            className="ml-auto text-xs rounded-lg bg-red-500/20 text-red-200 px-2 py-0.5 hover:bg-red-500/30"
            onClick={onClear}
          >
            Entfernen
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Kalender & Staffing ---------- */
function WeekCalendar({ days, compact }: { days: Date[]; compact?: boolean }) {
  const display = days.slice(0, 7);
  return (
    <div className={`rounded-2xl border border-white/10 ${compact ? "" : "bg-white/5"}`}>
      <div className="grid" style={{ gridTemplateColumns: `120px repeat(7, 1fr)` }}>
        <div className="p-3 font-medium border-b border-white/10 bg-white/5">Uhrzeit</div>
        {display.map((d, i) => (
          <div key={i} className="p-2 text-center text-xs border-b border-l border-white/10 bg-white/5">
            <div className="font-medium">{formatDay(d)}</div>
            <div className="text-white/60">{formatWeekdayShort(d)}</div>
          </div>
        ))}
      </div>
      {Array.from({ length: 12 }).map((_, row) => (
        <div key={row} className="grid" style={{ gridTemplateColumns: `120px repeat(7, 1fr)` }}>
          <div className="p-2 text-xs text-white/60 border-b border-white/10 bg-black/30">{8 + row}:00</div>
          {Array.from({ length: 7 }).map((__, col) => (
            <div key={col} className="h-12 border-b border-l border-white/10 bg-black/20" />
          ))}
        </div>
      ))}
    </div>
  );
}

function StaffingTable({ employees, days, compact }: { employees: Employee[]; days: Date[]; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 overflow-hidden ${compact ? "" : "bg-white/5"}`}>
      <div className="grid" style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(80px, 1fr))` }}>
        <div className="p-3 font-medium bg-white/5 border-b border-white/10">Mitarbeitende</div>
        {days.map((d, i) => (
          <div key={i} className="p-2 text-center text-xs bg-white/5 border-b border-l border-white/10">
            <div className="font-medium">{formatDay(d)}</div>
            <div className="text-white/60">{formatWeekdayShort(d)}</div>
          </div>
        ))}
      </div>
      {employees.map((e) => (
        <div key={e.id} className="grid" style={{ gridTemplateColumns: `240px repeat(${days.length}, minmax(80px, 1fr))` }}>
          <div className="p-3 border-b border-white/10 bg-black/30">
            <div className="font-medium">{e.name}</div>
            <div className="text-xs text-white/60">{e.role ?? "—"}</div>
          </div>
          {days.map((_, i) => (
            <div key={i} className="h-10 border-b border-l border-white/10 bg-black/20" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Utils ---------- */
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function enumerateDays(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const list: Date[] = [];
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) list.push(new Date(d));
  return list;
}
function formatDay(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatWeekdayShort(d: Date) {
  return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()];
}
