// src/app/admin/employees/types.ts

export type BuiltinKey =
  | "name"
  | "role"
  | "department"
  | "status"
  | "email"
  | "phone"
  | "hireDate";

export type ColumnKey = BuiltinKey | `custom:${string}`;

export type ColumnDef = {
  key: ColumnKey;
  label: string;
  visible: boolean;
};

// Erzwingt, dass die Datei als Modul gilt – auch wenn nur Types exportiert werden.
export {};
