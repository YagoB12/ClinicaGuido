import React, { useState } from "react";
import UserList from "./UserList";
import UserForm from "./UserForm";
import UserEditModal from "./UserEditModal";
import { updateUser } from "../../services/userService";
import type { User } from "../../types/user";
import { logoutUser } from "../../services/authService";
import { showConfirmActionAlert } from "../../utils/alerts";
import AppLayout from "../../components/layout/AppLayout";
import {
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/userPage.css";
import { Link } from "react-router-dom";

const tabs = ["Agregar Usuario", "Lista de Usuarios"];

// 🔹 Cerrar sesión
const handleLogout = async () => {
  const confirmed = await showConfirmActionAlert("¿Deseas cerrar sesión?");
  if (confirmed) {
    logoutUser();
  }
};


const UserPage: React.FC = () => {
  // 🔹 Control de pestañas
  const [activeTab, setActiveTab] = useState("Lista de Usuarios");

  // Control del modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bandera para recargar tabla tras editar
  const [reloadFlag, setReloadFlag] = useState(false);

  // Abrir modal de edición
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  // Guardar cambios del modal
  const handleSaveEdit = async (updatedUser: User) => {
    try {
      await updateUser(updatedUser);
      showSuccessAlert("Usuario actualizado correctamente.");
      setIsEditOpen(false);
      setSelectedUser(null);

      // Recargar tabla inmediatamente
      setReloadFlag((prev) => !prev);
    } catch (error) {
      showErrorAlert("No se pudo actualizar el usuario.");
    }
  };

  return (
     <AppLayout title="Gestión de Usuarios">
   
        {/* TABS */}
        <div className="tabs-container">
          <div className="tabs-header">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {activeTab === "Agregar Usuario" ? (
              <UserForm />
            ) : (
              <UserList onEdit={handleEdit} reloadFlag={reloadFlag} />
            )}
          </div>
        </div>
      

      {/* MODAL DE EDICIÓN */}
      {isEditOpen && selectedUser && (
        <UserEditModal
          user={selectedUser}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveEdit} // se llama desde el modal
        />
      )}
    
    </AppLayout>
  );
};

export default UserPage;
