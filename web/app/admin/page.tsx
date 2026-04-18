import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-[#001c55]">Admin</h1>
      <p className="mt-3 text-slate-600">
        Course CRUD for this project still lives on the Express static admin UI served from the API server (port{" "}
        <strong>3000</strong>).
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Open{" "}
        <Link href="http://localhost:3000" className="font-semibold text-[#001c55] underline">
          http://localhost:3000
        </Link>{" "}
        and use the Admin tab there, or add admin routes to this Next app later.
      </p>
    </div>
  );
}
