// src/types/project.ts
export type ProjectDB = {
  id: string;
  name: string | null;
  org_id: string | null;
  client_name?: string | null;
  location?: string | null;
  start_date?: string | null; // ISO-String oder null
  end_date?: string | null; // ISO-String oder null
  created_at?: string | null;
};
