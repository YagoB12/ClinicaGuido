import React, { useEffect, useState } from "react";
import { getAppointmentsForCalendar } from "../../services/appointmentService";
import type { AppointmentBrief } from "../../types/appointment";

const HomeStats: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentBrief[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await getAppointmentsForCalendar();
      setAppointments(data);
    };
    loadData();
  }, []);

  return (
    <section className="quick-stats">
      <div className="stat-card">
        <h3>{appointments.length}</h3>
        <p>Total de citas</p>
      </div>
      <div className="stat-card">
        <h3>{appointments.filter((a) => a.status === "Programada").length}</h3>
        <p>Citas activas</p>
      </div>
      <div className="stat-card">
        <h3>{appointments.filter((a) => a.priority === "Alta").length}</h3>
        <p>Prioridad alta</p>
      </div>
    </section>
  );
};

export default HomeStats;
