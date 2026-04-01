import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { SlotInfo, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/appointmentCalendar.css";
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

const AppointmentCalendar: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentBrief[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [dailyAppointments, setDailyAppointments] = useState<AppointmentBrief[]>([]);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  //  Logout
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Cargar citas
  const loadAppointments = async () => {
    try {
      const data = await getAppointmentsForCalendar();
      console.log(" Citas recibidas:", data);
      setAppointments(data);
    } catch (error) {
      console.error(" Error al cargar citas:", error);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // 🔹 Convertir citas a eventos para el calendario
  const events = appointments.map((a) => {
    const start = new Date(`${a.dateAppointment}T${a.hourAppointment}`);
    const end = new Date(start.getTime() + 45 * 60000); // duración estimada 45 min
    return {
      id: a.id,
      title: `${a.hourAppointment.substring(0, 5)} - ${a.patientName}`,
      start,
      end,
      allDay: false,
    };
  });

  
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const clicked = slotInfo.start;
    const selectedDateStr = format(clicked, "yyyy-MM-dd"); // formato local, sin UTC

    setSelectedDate(clicked);
    setHighlightedDate(selectedDateStr);

    const filtered = appointments.filter(
      (a) => a.dateAppointment === selectedDateStr
    );

    console.log("📅 Día seleccionado (local):", selectedDateStr, filtered);
    setDailyAppointments(filtered);
  };

 
  const handleSelectEvent = (event: any) => {
    const clicked = event.start instanceof Date ? event.start : new Date(event.start);
    const eventDateStr = format(clicked, "yyyy-MM-dd"); // formato local, sin UTC

    setSelectedDate(clicked);
    setHighlightedDate(eventDateStr);

    const filtered = appointments.filter(
      (a) => a.dateAppointment === eventDateStr
    );

    console.log("🩺 Evento seleccionado:", eventDateStr, filtered);
    setDailyAppointments(filtered);
  };

  // Día resaltado en el calendario
  const dayPropGetter = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (dateStr === highlightedDate) {
      return { className: "highlighted-day" };
    }
    return {};
  };

  // Cambio de vista
  const handleViewChange = (view: View) => {
    setCurrentView(view);
  };

  // Navegación (Hoy / Anterior / Siguiente)
  const handleNavigate = (date: Date) => {
    setCurrentDate(date);
  };

  return (
    <div className="page-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-left">
          <span className="clinic-name">Clínica Dr.Guido</span>
          <span className="divider"></span>
          <span className="subtitle">Sistema Clínico</span>
        </div>

        <div className="navbar-right">
          <Link to="/patients" className="menu-item">Pacientes</Link>
          <Link to="/appointments" className="menu-item">Citas</Link>
          <Link to="/consultations" className="menu-item">Consultas</Link>
          <Link to="/medicines" className="menu-item">Medicamentos</Link>
          <Link to="/diseases" className="menu-item">Enfermedades</Link>
          <Link to="/exams" className="menu-item">Exámenes</Link>
          <Link to="/prescriptions" className="menu-item">Recetas</Link>

          <button className="logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="calendar-container">
        {/* PANEL IZQUIERDO: CALENDARIO */}
        <div className="calendar-panel">
          <h2 className="calendar-title">
            Agenda de{" "}
            {format(currentDate, "MMMM yyyy", { locale: es }).replace(/^\w/, (c) =>
              c.toUpperCase()
            )}
          </h2>

          <Calendar
            localizer={localizer}
            events={events}
            date={currentDate}
            onNavigate={handleNavigate}
            view={currentView}
            onView={handleViewChange}
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

        {/* PANEL DERECHO: CITAS DEL DÍA */}
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
                  <div className="appointment-time">
                    {a.hourAppointment.substring(0, 5)} AM
                  </div>
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
    </div>
  );
};

export default AppointmentCalendar;
