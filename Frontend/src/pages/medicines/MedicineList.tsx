// src/pages/medicines/MedicineList.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getMedicines,
  getMedicineById,
  deleteMedicine,
} from "../../services/medicineService";
import type { Medicine, MedicineBrief } from "../../types/medicine";
import {
  showConfirmActionAlert,
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/alerts";

interface Props {
  reloadFlag: number;
  onView: (med: Medicine) => void;
  onEdit: (med: Medicine) => void;
  onDeleted: () => void;
}

export default function MedicineList({
  reloadFlag,
  onView,
  onEdit,
  onDeleted,
}: Props) {
  const [q, setQ] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [onlyNotExpired, setOnlyNotExpired] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [items, setItems] = useState<MedicineBrief[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const debouncedQ = useMemo(() => q, [q]);
  useEffect(() => {
    const id = setTimeout(() => {}, 0);
    return () => clearTimeout(id);
  }, [debouncedQ]);

  const load = async () => {
    setLoading(true);
    try {
      const { items, total } = await getMedicines(
        q.trim() || undefined,
        onlyAvailable,
        onlyNotExpired,
        page,
        pageSize
      );
      setItems(items);
      setTotal(total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadFlag, page, pageSize, onlyAvailable, onlyNotExpired, debouncedQ]);

  const handleView = async (id: number) => {
    try {
      const full = await getMedicineById(id);
      onView(full);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const full = await getMedicineById(id);
      onEdit(full);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmActionAlert(
      "¿Deseas eliminar este medicamento? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    try {
      await deleteMedicine(id);
      await showSuccessAlert("Medicamento eliminado correctamente.");
      onDeleted();
      load();
    } catch (e) {
      console.error(e);
      await showErrorAlert("No se pudo eliminar el medicamento.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const formatMonthYear = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  return (
    <div className="medicine-list">
      {/* FILTROS */}
      <div className="med-filters card-like">
        <div className="med-grid">
          <div className="med-field">
            <label className="med-label">Buscar</label>
            <input
              type="text"
              className="med-input"
              placeholder="Nombre, presentación, concentración…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="med-field med-checks">
            <label className="med-label">Filtros</label>
            <label className="med-check">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => {
                  setOnlyAvailable(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Solo disponibles</span>
            </label>
            <label className="med-check">
              <input
                type="checkbox"
                checked={onlyNotExpired}
                onChange={(e) => {
                  setOnlyNotExpired(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Solo no vencidos</span>
            </label>
          </div>

          <div className="med-field">
            <label className="med-label">Tamaño página</label>
            <select
              className="med-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 15, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="med-field med-pager">
            <label className="med-label">Página</label>
            <div className="med-pager-row">
              <button
                className="btn btn-ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀
              </button>
              <div className="med-pager-indicator">
                {page}/{totalPages}
              </div>
              <button
                className="btn btn-ghost"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Presentación</th>
              <th className="nowrap">Cantidad</th>
              <th className="nowrap">Concentración</th>
              <th className="nowrap">Expira</th>
              <th className="text-center acciones-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading">Cargando…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">Sin resultados</td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="fw-semibold">{m.nameMedicine}</div>
                    {m.description && (
                      <div className="muted small">{m.description}</div>
                    )}
                  </td>
                  <td>{m.typePresentation ?? "—"}</td>
                  <td className="text-center">{m.availableQuantity}</td>
                  <td className="text-center">
                    {m.concentration != null ? `${m.concentration}` : "—"}
                  </td>
                  <td className="text-center">{formatMonthYear(m.expirationDate)}</td>
                  <td className="acciones-col">
                    <div className="actions">
                      <button className="btn btn-primary" onClick={() => handleView(m.id)}>Ver</button>
                      <button className="btn btn-secondary" onClick={() => handleEdit(m.id)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(m.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINACIÓN */}
      <div className="list-footer">
        <div className="muted small">
          Mostrando {(items.length && (page - 1) * pageSize + 1) || 0}–
          {(page - 1) * pageSize + items.length} de {total}
        </div>
        <div className="footer-pager">
          <button
            className="btn btn-ghost"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <button
            className="btn btn-ghost"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
