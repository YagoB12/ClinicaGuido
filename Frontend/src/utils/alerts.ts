import Swal from "sweetalert2";

export const showSuccessAlert = (message: string) => {
  Swal.fire({
    icon: "success",
    title: "Éxito",
    text: message,
    confirmButtonColor: "#03346E",
  });
};

export const showErrorAlert = (message: string) => {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    confirmButtonColor: "#03346E",
  });
};

export const showConfirmActionAlert = async (message: string) => {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: message,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
};
