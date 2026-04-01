import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAppointmentsForCalendar } from "../../services/appointmentService";
import type { AppointmentBrief } from "../../types/appointment";

const locales = { es };
const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string, options?: any) =>
    format(date, formatStr, { ...options, locale: es }),
  parse: (value: string, formatStr: string, baseDate: Date, options?: any) =>
    parse(value, formatStr, baseDate, { ...options, locale: es }),
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1, locale: es }),
  getDay,
  locales,
});

const HomeCalendar: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentBrief[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dailyAppointments, setDailyAppointments] = useState<AppointmentBrief[]>([]);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadAppointments = async () => {
      const data = await getAppointmentsForCalendar();
      setAppointments(data);
    };
    loadAppointments();
  }, []);

  const events = appointments.map((a) => {
    const start = new Date(`${a.dateAppointment}T${a.hourAppointment}`);
    const end = new Date(start.getTime() + 45 * 60000);
    return {
      id: a.id,
      title: `${a.hourAppointment.substring(0, 5)} - ${a.patientName}`,
      start,
      end,
      allDay: false,
    };
  });

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const selectedDateStr = format(slotInfo.start, "yyyy-MM-dd");
    setSelectedDate(slotInfo.start);
    setHighlightedDate(selectedDateStr);
    const filtered = appointments.filter((a) => a.dateAppointment === selectedDateStr);
    setDailyAppointments(filtered);
  };

  const handleSelectEvent = (event: any) => {
    const eventDateStr = format(event.start, "yyyy-MM-dd");
    setSelectedDate(event.start);
    setHighlightedDate(eventDateStr);
    const filtered = appointments.filter((a) => a.dateAppointment === eventDateStr);
    setDailyAppointments(filtered);
  };

  const dayPropGetter = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr === highlightedDate) {
      return { className: "highlighted-day" };
    }
    return {};
  };

  return (
    <div className="calendar-container">
      <div className="calendar-panel">
        <h2 className="calendar-title">
          Agenda de {format(currentDate, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) => c.toUpperCase())}
        </h2>

        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={(d) => setCurrentDate(d)}
          view={currentView}
          onView={(v) => setCurrentView(v)}
          startAccessor="start"
          endAccessor="end"
          selectable
          views={["month", "week", "day", "agenda"]}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          popup
          style={{ height: 600 }}
          messages={{
            month: "Mes",
            week: "Semana",
            day: "Día",
            agenda: "Agenda",
            today: "Hoy",
            previous: "< Anterior",
            next: "Siguiente >",
          }}
          dayPropGetter={dayPropGetter}
        />
      </div>

      <div className="side-panel">
        <h3 className="side-title">
          {selectedDate
            ? `Citas del ${selectedDate.getDate()} de ${selectedDate.toLocaleString("es-ES", {
                month: "long",
              })}`
            : "Citas del día"}
        </h3>

        {dailyAppointments.length === 0 ? (
          <p className="no-appointments">No hay citas para mostrar.</p>
        ) : (
          dailyAppointments.map((a) => (
            <div key={a.id} className="appointment-card modern-card">
              <div className="card-left">
                <div className="appointment-time">{a.hourAppointment.substring(0, 5)}</div>
              </div>
              <div className="card-right">
                <div className="appointment-patient">
                  <strong>{a.patientName}</strong>
                </div>
                <div className="appointment-details">
                  <span className="priority-label">Prioridad: </span>
                  <span
                    className={`priority-value ${a.priority?.toLowerCase() || ""}`}
                  >
                    {a.priority || "Normal"}
                  </span>
                </div>

                <div className="appointment-status">
                  <span className="status-label">Estado: </span>
                  <span
                    className={`status-badge ${a.status
                      ?.toLowerCase()
                      .replace(/\s+/g, "-") || "programada"}`}
                  >
                    {a.status || "Programada"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HomeCalendar;
