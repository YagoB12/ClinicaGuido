import React from "react";

const HomeHeader: React.FC = () => {
  return (
    <header className="home-header">
      <div className="home-header-content">
        <div className="home-header-icon">🩺</div>
        <h1 className="welcome-title">Bienvenido al Sistema Clínico</h1>
        <p className="welcome-subtitle">
          Administra tus pacientes, citas y consultas desde un solo lugar. 
          Aquí puedes visualizar tu agenda diaria y revisar tus próximas citas.
        </p>
      </div>
    </header>
  );
};

export default HomeHeader;
