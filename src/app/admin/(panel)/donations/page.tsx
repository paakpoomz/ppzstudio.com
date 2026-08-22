import { listDonationsForAdmin } from "@/server/donations";
import { DonationActions } from "@/components/admin/DonationActions";
import { formatThaiDateTime } from "@/lib/date";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "รอโอน",
    className: "border-line bg-surface-2 text-text-muted",
  },
  CONFIRMED: {
    label: "แจ้งโอนแล้ว · รอตรวจ",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  REJECTED: {
    label: "ปฏิเสธ",
    className: "border-line bg-surface-2 text-text-muted",
  },
};

export default async function DonationsPage() {
  const donations = await listDonationsForAdmin();
  const waiting = donations.filter((d) => d.status === "CONFIRMED").length;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">การสนับสนุน</h1>
      <p className="mt-1 text-sm text-text-muted">
        {waiting > 0
          ? `${waiting} รายการรอตรวจ — เทียบยอดกับที่เข้าบัญชีจริงก่อนกดอนุมัติ`
          : "ไม่มีรายการรอตรวจ"}
      </p>

      {donations.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          ยังไม่มีใครกดสร้าง QR
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {donations.map((d) => {
            const style = STATUS[d.status] ?? STATUS.PENDING;
            return (
              <li
                key={d.id}
                className="rounded-xl border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-lg text-primary tabular-nums">
                    {d.amount.toFixed(2)} ฿
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    {d.refCode}
                  </span>
                  <span className="font-semibold">
                    {d.name || "ผู้ไม่ประสงค์ออกนาม"}
                  </span>
                  <span
                    className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>

                <p className="mt-1 font-mono text-xs text-text-muted tabular-nums">
                  {formatThaiDateTime(d.createdAt)}
                  {d.approvedBy ? ` · ตรวจโดย ${d.approvedBy.name}` : ""}
                </p>

                {d.message ? (
                  <p className="mt-3 text-sm text-text-muted">{d.message}</p>
                ) : null}

                {d.slipUrl ? (
                  <a
                    href={d.slipUrl}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 block w-fit"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.slipUrl}
                      alt={`สลิปของ ${d.refCode}`}
                      className="max-h-56 rounded-lg border border-line"
                    />
                  </a>
                ) : d.status === "CONFIRMED" ? (
                  <p className="mt-3 text-sm text-text-muted">
                    ไม่ได้แนบสลิป — ต้องเทียบยอด {d.amount.toFixed(2)} บาท
                    กับรายการเข้าบัญชีเอง
                  </p>
                ) : null}

                {d.status === "CONFIRMED" ? (
                  <div className="mt-4">
                    <DonationActions id={d.id} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
