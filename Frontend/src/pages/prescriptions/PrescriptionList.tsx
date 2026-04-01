// src/pages/prescriptions/PrescriptionList.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getPrescriptions,
  getPrescriptionById,            // importar
  type PrescriptionListItem,
  deletePrescription,
} from "../../services/prescriptionService";
import PrescriptionEditModal from "./PrescriptionEditModal";
import PrescriptionViewModal from "./PrescriptionViewModal";
import {
  showConfirmActionAlert,
  showSuccessAlert,
  showErrorAlert,
} from "../../utils/alerts";

function formatDateDDMMYYYY(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function statusClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "emitida")   return "status-badge status--emitida";
  if (s === "revisada")  return "status-badge status--revisada";
  if (s === "entregada") return "status-badge status--entregada";
  if (s === "anulada")   return "status-badge status--anulada";
  return "status-badge status--pendiente";
}


/** Formatea cédulas tipo CR:
 * - 9 dígitos → 1-XXXX-XXXX
 * - 10 dígitos → XX-XXXX-XXXX
 * Si no calza, devuelve la entrada original.
 */
function formatIdCR(raw?: string) {
  if (!raw) return "—";
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 9)  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5)}`;
  if (d.length === 10) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
  return raw; // ya viene con guiones o es otro formato
}

export default function PrescriptionList() {
  const [items, setItems] = useState<PrescriptionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page] = useState(1);
  const [pageSize] = useState(20);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<PrescriptionListItem | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ----- estado para el modal de "Ver" -----
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [viewSeed, setViewSeed] = useState<
    { patientName?: string; patientIdentification?: string } | undefined
  >(undefined);

  // Si viene ?view=ID (opcionalmente con ?pn y ?pid) en el URL, enfocamos esa receta
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const [focusedSeed, setFocusedSeed] = useState<
    { patientName?: string; patientIdentification?: string } | undefined
  >(undefined);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("view");
    if (v && /^\d+$/.test(v)) {
      setFocusedId(Number(v));
      const pn  = sp.get("pn")  || undefined;
      const pid = sp.get("pid") || undefined;
      setFocusedSeed({
        patientName: pn,
        patientIdentification: pid ? formatIdCR(pid) : undefined,
      });
    }
  }, []);

  // carga: si hay focusedId, cargar SOLO esa receta; sino, cargar listado normal
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (focusedId != null) {
          // Cargar receta puntual
          const full = await getPrescriptionById(focusedId);
          if (!alive) return;

          const patientName = focusedSeed?.patientName ?? "—";
          const patientIdentification = formatIdCR(focusedSeed?.patientIdentification);

          const one: PrescriptionListItem = {
            id: full.id,
            patientName,
            patientIdentification,
            issueDate: full.issueDate,
            status: full.status,
          };

          setItems([one]);
          setTotal(1);

          // Abrir modal de "Ver" y limpiar querystring
          setViewId(full.id);
          setViewSeed({ patientName, patientIdentification });
          setViewOpen(true);

          const url = new URL(window.location.href);
          url.searchParams.delete("view");
          url.searchParams.delete("pn");
          url.searchParams.delete("pid");
          window.history.replaceState({}, "", url.toString());
        } else {
          // Listado normal
          const res = await getPrescriptions(
            undefined,
            undefined,
            undefined,
            page,
            pageSize
          );
          if (!alive) return;
          setItems(res.items ?? []);
          setTotal(res.total ?? 0);
        }
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setError("No se pudieron cargar las recetas.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [page, pageSize, focusedId, focusedSeed]);

  const hasData = useMemo(() => items && items.length > 0, [items]);

  const openEdit = (row: PrescriptionListItem) => {
    setEditItem(row);
    setEditOpen(true);
  };

  // abrir modal de VER desde botón
  const openView = (row: PrescriptionListItem) => {
    setViewId(row.id);
    setViewSeed({
      patientName: row.patientName,
      patientIdentification: formatIdCR(row.patientIdentification),
    });
    setViewOpen(true);
  };

  const handleSaved = ({ id, status }: { id: number; status: string }) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleDelete = async (row: PrescriptionListItem) => {
    const ok = await showConfirmActionAlert(
      `¿Deseas eliminar la receta #${row.id} del paciente ${row.patientName}?`
    );
    if (!ok) return;

    try {
      setDeletingId(row.id);
      await deletePrescription(row.id);
      setItems((prev) => prev.filter((r) => r.id !== row.id));
      setTotal((t) => Math.max(0, t - 1));
      showSuccessAlert("La receta fue eliminada correctamente.");
    } catch (e) {
      console.error(e);
      showErrorAlert("No se pudo eliminar la receta. Inténtalo nuevamente.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th className="nowrap">#</th>
              <th>Paciente</th>
              <th>Cédula</th>
              <th>Emitida</th>
              <th>Estado</th>
              <th className="nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="muted">
                  Cargando…
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="muted">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && !hasData && (
              <tr>
                <td colSpan={6} className="muted">
                  No hay recetas registradas.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              hasData &&
              items.map((r, idx) => (
                <tr key={r.id}>
                  <td>{(page - 1) * pageSize + (idx + 1)}</td>
                  <td>{r.patientName}</td>
                  <td className="nowrap">{formatIdCR(r.patientIdentification)}</td>
                  <td className="nowrap">{formatDateDDMMYYYY(r.issueDate)}</td>
                  <td className="status-cell">
                  <span className={statusClass(r.status)}>{r.status}</span></td>
                  <td className="nowrap">
                    <button className="btn-primary" onClick={() => openView(r)}>
                      Ver
                    </button>{" "}
                    <button
                      className="btn-secondary"
                      onClick={() => openEdit(r)}
                    >
                      Editar
                    </button>{" "}
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(r)}
                      disabled={deletingId === r.id}
                      title={
                        deletingId === r.id ? "Eliminando..." : "Eliminar"
                      }
                    >
                      {deletingId === r.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

      </div>

      {/* Modal editar */}
      <PrescriptionEditModal
        open={editOpen}
        item={editItem}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />

      {/* Modal ver */}
      <PrescriptionViewModal
        open={viewOpen}
        id={viewId}
        seed={viewSeed}
        onClose={() => setViewOpen(false)}
      />
    </>
  );
}
