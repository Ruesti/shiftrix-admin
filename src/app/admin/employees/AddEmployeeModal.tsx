"use client";

import { useState } from "react";
import type { Employee as Emp } from "../../../store/employees";
import type { ColumnDef } from "./types";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/60 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
      />
    </div>
  );
}

export default function AddEmployeeModal({
  onClose,
  onSubmit,
  customColumns,
}: {
  onClose: () => void;
  onSubmit: (e: Omit<Emp, "id">) => void;
  customColumns: ColumnDef[];
}) {
  const [form, setForm] = useState<Omit<Emp, "id">>({
    name: "",
    role: "",
    department: "",
    status: "aktiv",
    email: "",
    phone: "",
    hireDate: "",
    custom: {},
    availability: [],
  });

  const valid = form.name.trim().length >= 3 && form.role && form.department;

  function handleChange<K extends keyof Omit<Emp, "id">>(key: K, val: Omit<Emp, "id">[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }
  function setCustomField(id: string, val: string) {
    setForm((f) => ({ ...f, custom: { ...(f.custom ?? {}), [id]: val } }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Mitarbeiter hinzufügen</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name*" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="Vorname Nachname" />
          <Field label="Rolle*" value={form.role} onChange={(v) => handleChange("role", v)} placeholder="z. B. Teammitglied" />
          <Field label="Abteilung*" value={form.department} onChange={(v) => handleChange("department", v)} placeholder="z. B. Service" />
          <div>
            <label className="block text-xs text-white/60 mb-1">Status (wird in der Handy-App geändert)</label>
            <input value={form.status} readOnly className="w-full rounded-brand border border-white/10 bg-white/10 px-3 py-2 text-white/80" />
          </div>
          <Field label="E-Mail" type="email" value={form.email ?? ""} onChange={(v) => handleChange("email", v)} placeholder="name@firma.de" />
          <Field label="Telefon" value={form.phone ?? ""} onChange={(v) => handleChange("phone", v)} placeholder="+49 …" />
          <div>
            <label className="block text-xs text-white/60 mb-1">Eintritt</label>
            <input
              value={form.hireDate ?? ""}
              onChange={(e) => handleChange("hireDate", e.target.value)}
              type="date"
              className="w-full rounded-brand border border-white/10 bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-product-shiftrix/60"
            />
          </div>

          {customColumns.map((c) => {
            const id = (c.key as string).slice(7);
            return (
              <Field
                key={c.key}
                label={c.label}
                value={(form.custom ?? {})[id] ?? ""}
                onChange={(v: string) => setCustomField(id, v)}
                placeholder={`Wert für ${c.label}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn card border-white/20">Abbrechen</button>
          <button disabled={!valid} onClick={() => valid && onSubmit(form)} className="btn btn-primary disabled:opacity-50">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
