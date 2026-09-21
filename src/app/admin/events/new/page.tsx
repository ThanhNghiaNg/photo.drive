import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import EventForm from "@/components/admin/EventForm";

export default async function NewEventPage() {
  await requireAdminPage();
  return <main className="container-page py-8"><div className="mb-6"><Link href="/admin/events" className="text-sm font-semibold text-slate-500 hover:text-blue-600">← Events</Link><h1 className="mt-2 text-2xl font-black">Tạo event mới</h1><p className="mt-1 text-sm text-slate-500">Sau khi tạo, hệ thống sẽ sync Google Drive theo từng batch và chuyển sang trang chọn thumbnail.</p></div><EventForm mode="create" /></main>;
}
