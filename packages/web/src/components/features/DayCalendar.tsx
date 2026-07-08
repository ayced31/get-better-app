// ─── Day Calendar ───────────────────────────────────────────────
import { useState, useMemo } from 'react';
import { getISTDate } from '@get-better/shared';
import './DayCalendar.css';

interface DayCalendarProps {
  monthlyBreakdown?: { date: string; points: number }[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function DayCalendar({
  monthlyBreakdown = [],
  selectedDate,
  onSelectDate,
  className = '',
}: DayCalendarProps) {
  const today = getISTDate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = today.split('-').map(Number);
    return { year, month: month - 1 }; // 0-indexed month
  });

  const pointsMap = useMemo(() => {
    const map = new Map<string, number>();
    monthlyBreakdown.forEach(({ date, points }) => map.set(date, points));
    return map;
  }, [monthlyBreakdown]);

  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay();

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const formatDate = (day: number): string => {
    const m = String(currentMonth.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentMonth.year}-${m}-${d}`;
  };

  return (
    <div className={`day-calendar ${className}`}>
      <div className="day-calendar__header">
        <h3 className="day-calendar__month">
          {MONTHS[currentMonth.month]} {currentMonth.year}
        </h3>
        <div className="day-calendar__nav">
          <button className="day-calendar__nav-btn" onClick={prevMonth} aria-label="Previous month">
            ←
          </button>
          <button className="day-calendar__nav-btn" onClick={nextMonth} aria-label="Next month">
            →
          </button>
        </div>
      </div>

      <div className="day-calendar__weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="day-calendar__weekday">{d}</div>
        ))}
      </div>

      <div className="day-calendar__grid">
        {/* Empty cells for days before the first of month */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="day-calendar__cell day-calendar__cell--empty" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDate(day);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const points = pointsMap.get(dateStr);

          const dotClass = points !== undefined
            ? points > 3
              ? 'day-calendar__points-dot--high'
              : points > 0
                ? 'day-calendar__points-dot--positive'
                : points < 0
                  ? 'day-calendar__points-dot--negative'
                  : 'day-calendar__points-dot--zero'
            : '';

          const cellClasses = [
            'day-calendar__cell',
            isToday && 'day-calendar__cell--today',
            isSelected && 'day-calendar__cell--selected',
            isFuture && 'day-calendar__cell--future',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={day}
              className={cellClasses}
              onClick={() => !isFuture && onSelectDate?.(dateStr)}
            >
              <span className="day-calendar__day">{day}</span>
              {dotClass && (
                <div className={`day-calendar__points-dot ${dotClass}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
