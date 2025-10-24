import EmployeesClient from "./EmployeesClient";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <EmployeesClient />
    </section>
  );
}
