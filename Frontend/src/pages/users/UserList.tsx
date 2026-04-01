import React, { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../../services/userService";
import type { User } from "../../types/user";
import UserRow from "./UserRow";
import { getRoles } from "../../services/roleService";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";
import "../../styles/userPage.css";

interface Props {
  onEdit: (user: User) => void;
  reloadFlag: boolean; // Para recargar cuando se edita un usuario
}
const UserList: React.FC<Props> = ({ onEdit, reloadFlag }) => {
  const [users, setUsers] = useState<User[]>([]);

  // Cargar roles y usuarios desde el backend y combinar nombres de rol
  const loadAll = async () => {
    try {
      const rolesData: { id: number; nombre: string }[] = await getRoles();
      const usersData = await getUsers();

      // Agregar rolNombre a cada usuario para mostrar en la tabla
      const usersWithRoleName = usersData.map((u) => ({
        ...u,
        rolNombre: rolesData.find((r) => r.id === u.rolId)?.nombre ?? "Sin rol",
      }));

      setUsers(usersWithRoleName);
    } catch (error) {
      showErrorAlert("Error al obtener la lista de usuarios o roles.");
    }
  };

  //Eliminar usuario con confirmación
  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert(
      "¿Deseas eliminar este usuario?"
    );
    if (!confirmed) return;

    try {
      await deleteUser(id);
      showSuccessAlert("Usuario eliminado correctamente.");
      loadAll(); // Recargar lista después de eliminar
    } catch (error) {
      showErrorAlert("No se pudo eliminar el usuario.");
    }
  };

  // Cargar datos al montar el componente y cuando cambie reloadFlag
  useEffect(() => {
    loadAll();
  }, [reloadFlag]);

  return (
    <div className="user-list-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Nombres</th>
            <th>Identificación</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Género</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <tr>
              <td colSpan={7} className="no-data">
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
