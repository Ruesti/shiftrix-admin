// src/lib/types/project.ts
export type ProjectType = 'bounded' | 'open' | 'recurring' | 'adhoc';

export interface NewProjectPayload {
  name: string;
  description?: string;
  project_type: ProjectType;
  start_date?: string; // ISO (YYYY-MM-DD)
  end_date?: string;   // ISO
  recurrence?: string; // z.B. "RRULE:FREQ=WEEKLY;BYDAY=MO,FR"
  planned_headcount?: number;
  variable_headcount?: boolean;
  client_name?: string;
  location?: string;
}
