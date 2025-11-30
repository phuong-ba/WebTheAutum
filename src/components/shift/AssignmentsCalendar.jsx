import React from 'react';
import { IconChevronLeft, IconChevronRight, BtnAdd } from '@/assets/svg/externalIcon';

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDateToYMD(date) {
  const y = date.getFullYear();
  const m = ('' + (date.getMonth() + 1)).padStart(2, '0');
  const d = ('' + date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AssignmentsCalendar({ phanCa = [], calendarDate, onPrev, onNext, onDayClick, onEventClick }) {
  const sodays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]; // Vietnamese short days
  const firstOfMonth = startOfMonth(calendarDate);
  const lastOfMonth = endOfMonth(calendarDate);

  // start display from Monday (or Sunday) - we will show Sunday first for simplicity
  const startIndex = firstOfMonth.getDay(); // 0=Sunday
  const totalDays = lastOfMonth.getDate();
  const rows = [];

  let cells = [];
  // leading blanks
  for (let i = 0; i < startIndex; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push(new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), d));
  }

  // pad trailing
  while (cells.length % 7 !== 0) cells.push(null);

  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const eventsByDay = {};
  phanCa.forEach((pc) => {
    // ensure ngayPhanCa exists
    if (!pc.ngayPhanCa) return;
    const key = pc.ngayPhanCa;
    eventsByDay[key] = eventsByDay[key] || [];
    eventsByDay[key].push(pc);
  });

  const todayYMD = formatDateToYMD(new Date());

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600 font-medium">{calendarDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}</div>
        <div className="flex items-center gap-2">
          <button onClick={onPrev} aria-label="Tháng trước" className="p-2 rounded-md bg-slate-100 hover:bg-slate-200">
            <IconChevronLeft width={16} height={16} />
          </button>
          <button onClick={onNext} aria-label="Tháng sau" className="p-2 rounded-md bg-slate-100 hover:bg-slate-200">
            <IconChevronRight width={16} height={16} />
          </button>
          <button onClick={() => onDayClick?.(todayYMD)} aria-label="Thêm phân ca hôm nay" title="Thêm phân ca hôm nay" className="p-2 rounded-md bg-[#ED7014] hover:bg-[#D6621B] text-white">
            <BtnAdd width={14} height={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {sodays.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-slate-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mt-2">
        {rows.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            {row.map((cell, cIdx) => {
              if (!cell)
                return <div key={cIdx} className="h-24 bg-slate-50 rounded-md p-1" />;

              const ymd = formatDateToYMD(cell);
              const events = eventsByDay[ymd] || [];

              const today = new Date();
              const isToday = formatDateToYMD(cell) === formatDateToYMD(today);
              return (
                <div key={cIdx} role="button" tabIndex={0} onClick={() => onDayClick?.(ymd)} onKeyDown={(e)=> (e.key === 'Enter' || e.key === ' ') && onDayClick?.(ymd) } className={`h-24 rounded-md border p-2 overflow-hidden ${isToday ? 'bg-[#FFF4E6] border-orange-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 mb-1 font-medium">{cell.getDate()}</div>
                    {events.length > 0 && (
                      <div className="text-[11px] text-white bg-slate-400 px-1 rounded-md">{events.length}</div>
                    )}
                  </div>
                      <div className="flex flex-col gap-1 text-[12px] overflow-auto max-h-14">
                    {events.length === 0 && (
                      <div className="text-slate-300 text-xs">-</div>
                    )}
                        {events.map((ev) => (
                          <div key={ev.id} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEventClick?.(ev)} onClick={() => onEventClick?.(ev)} className="py-0.5 px-1 rounded-md bg-slate-50 border border-slate-100 text-slate-700 text-[12px] cursor-pointer flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full mt-1 bg-sky-400" />
                        <div>
                          <div className="font-semibold">{ev.hoTenNhanVien}</div>
                          <div className="text-[11px] text-slate-500">{ev.tenCa}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
