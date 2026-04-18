import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-amber-800 mb-2">Garaj Cafe</h1>
        <p className="text-amber-600 mb-8">QR Menü Sistemi</p>
        <div className="flex flex-col gap-3 items-center">
          <Link href="/waiter" className="bg-amber-700 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-semibold w-48 text-center">
            Garson Paneli
          </Link>
          <Link href="/admin" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-semibold w-48 text-center">
            Admin / Kasa
          </Link>
          <Link href="/admin/tables" className="bg-white border-2 border-amber-300 hover:bg-amber-50 text-amber-800 px-8 py-3 rounded-xl font-semibold w-48 text-center">
            QR Kodlar
          </Link>
        </div>
      </div>
    </div>
  );
}
