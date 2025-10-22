import { create } from "zustand";

export type Availability = { start: string; end: string; type: "available" | "unavailable" };
export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "aktiv" | "inaktiv" | "urlaub"; // nur in Handy-App änderbar
  email?: string;
  phone?: string;
  hireDate?: string;
  custom?: Record<string, string>;
  availability?: Availability[];
};

// ...bestehender Code oben bleibt

type State = {
  employees: Employee[];
  setAll: (list: Employee[]) => void;
  add: (e: Omit<Employee, "id">) => Employee;
  update: (id: string, patch: Partial<Employee>) => void;
  byId: (id: string) => Employee | undefined;
  remove: (id: string) => void;             // <— NEU
};

export const useEmployees = create<State>((set, get) => ({
  employees: [],
  setAll: (list) => set({ employees: list }),
  add: (e) => {
    const nextId = String(get().employees.length + 1).padStart(3, "0");
    const obj: Employee = { id: nextId, ...e, availability: e.availability ?? [] };
    set({ employees: [obj, ...get().employees] });
    return obj;
  },
  update: (id, patch) => {
    set({
      employees: get().employees.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  },
  byId: (id) => get().employees.find((x) => x.id === id),
  remove: (id) => set({ employees: get().employees.filter((x) => x.id !== id) }), // <— NEU
}));

