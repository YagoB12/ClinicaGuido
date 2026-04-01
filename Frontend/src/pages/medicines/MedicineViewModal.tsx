// src/pages/medicines/MedicineViewModal.tsx
import type { Medicine } from "../../types/medicine";
import "../../styles/medicine.css";

interface Props {
  medicine: Medicine;
  onClose: () => void;
}

export default function MedicineViewModal({ medicine, onClose }: Props) {
  const formatMonthYear = (date?: string) => {
    if (!date) return "—";
    const d = new Date(date);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    return `${m}/${y}`;
  };

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString() : "—";

  // chip “por expirar” si faltan <= 90 días
  const isNearExpiration = (() => {
    if (!medicine.expirationDate) return false;
    const today = new Date();
    const exp = new Date(medicine.expirationDate);
    const diff = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 90 && diff >= 0;
  })();

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h5 className="modal-title">Detalle del Medicamento</h5>
          <button className="btn-close" onClick={onClose}></button>
        </div>

        <div className="modal-body">
          {/* Meta chips (opcional) */}
          <div className="meta-chips">
            {medicine.availableQuantity <= 0 && (
              <span className="chip chip-red">Sin stock</span>
            )}
            {isNearExpiration && (
              <span className="chip chip-amber">Por expirar</span>
            )}
          </div>

          <div className="info-grid">
            <div className="info-item span-2">
              <div className="info-label">Nombre</div>
              <div className="info-value">{medicine.nameMedicine || "—"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Presentación</div>
              <div className="info-value">{medicine.typePresentation || "—"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Concentración</div>
              <div className="info-value">
                {medicine.concentration != null ? medicine.concentration : "—"}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Cantidad</div>
              <div className="info-value">{medicine.availableQuantity}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Expiración</div>
              <div className="info-value">{formatMonthYear(medicine.expirationDate)}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Preparación</div>
              <div className="info-value">{formatDate(medicine.preparationDate)}</div>
            </div>

            <div className="info-item span-2">
              <div className="info-label">Descripción</div>
              <div className="info-value">{medicine.description || "—"}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
