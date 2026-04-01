import React from "react";
import type { User } from "../../types/user";
import "../../styles/userPage.css";

interface Props {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const UserRow: React.FC<Props> = ({ user, onEdit, onDelete }) => {
  return (
    <tr className="user-row">
      <td>{user.name}</td>
      <td>{user.identification}</td>
      <td>{user.email}</td>
      <td>{user.phone}</td>
      <td>{user.gender}</td>
      <td>{user.rolNombre ?? "Sin rol"}</td>

      {/* Estado con texto dentro del círculo */}
      <td className="status-cell">
        <span
          className={`status-badge ${user.isActive ? "active" : "inactive"}`}
        >
          {user.isActive ? "Activo" : "Inactivo"}
        </span>
      </td>

      <td className="actions">
        <button className="action-btn edit-btn" onClick={() => onEdit(user)}>
          Editar
        </button>

        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(user.id!)}
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};

export default UserRow;
