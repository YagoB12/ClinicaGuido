import React, { useState } from "react";
import Swal from "sweetalert2";
import "../../styles/patientPage.css";
import { createPatient } from "../../services/patientService";

// Helpers (inspirados en MedicineForm)

function blockNonIntegerKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  const bad = ["e", "E", "+", "-", ".", ","];
  if (bad.includes(e.key)) e.preventDefault();
}
function filterPasteInteger(e: React.ClipboardEvent<HTMLInputElement>) {
  const text = e.clipboardData.getData("text");
  if (!/^\d*$/.test(text)) e.preventDefault();
}
function preventWheel(e: React.WheelEvent<HTMLInputElement>) {
  (e.target as HTMLInputElement).blur();
  e.stopPropagation();
}

const onlyDigits = (s?: string) => (s || "").replace(/\D/g, "");

interface PatientFormData {
  name: string;
  photo: File | null;
  email: string;
  identification: string;
  phone: string;
  gender: string;
  birthDate: string;
  address: string;
  maritalStatus: string;
  disability: string;
  emergencyContactNumber: string;
  emergencyContactRelation: string;
  emergencyContactName: string;
}

const PatientForm: React.FC = () => {
  const [form, setForm] = useState<PatientFormData>({
    name: "",
    photo: null,
    email: "",
    identification: "",
    phone: "",
    gender: "",
    birthDate: "",
    address: "",
    maritalStatus: "",
    disability: "",
    emergencyContactNumber: "",
    emergencyContactRelation: "",
    emergencyContactName: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value } as any);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, photo: file });
  };

  // ===================== Validaciones con Swal =====================
  async function validate(): Promise<boolean> {
    const msgs: string[] = [];

    // Campos obligatorios básicos
    if (!form.name?.trim()) msgs.push("• El nombre es requerido.");
    if (!form.identification?.trim()) msgs.push("• La identificación es requerida.");
    if (!form.email?.trim()) msgs.push("• El correo es requerido.");
    if (!form.phone?.trim()) msgs.push("• El teléfono es requerido.");
    if (!form.birthDate?.trim()) msgs.push("• La fecha de nacimiento es requerida.");
    if (!form.address?.trim()) msgs.push("• La dirección es requerida.");
    if (!form.maritalStatus?.trim()) msgs.push("• El estado civil es requerido.");
    if (!form.emergencyContactName?.trim()) msgs.push("• El nombre de contacto de emergencia es requerido.");
    if (!form.emergencyContactNumber?.trim()) msgs.push("• El teléfono de emergencia es requerido.");

    // Fecha de nacimiento: no futura ni anterior a 200 años
    if (form.birthDate) {
      const birth = new Date(form.birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minDate = new Date(today);
      minDate.setFullYear(minDate.getFullYear() - 200);
      if (birth > today) msgs.push("• La fecha de nacimiento no puede ser futura.");
      if (birth < minDate) msgs.push("• La fecha de nacimiento no puede ser anterior a hace 200 años.");
    }

    // Teléfonos: exactamente 8 dígitos
    const phoneDigits = onlyDigits(form.phone);
    const emergDigits = onlyDigits(form.emergencyContactNumber);
    if (phoneDigits.length !== 8) msgs.push("• El teléfono debe tener exactamente 8 dígitos.");
    if (emergDigits.length !== 8) msgs.push("• El teléfono de emergencia debe tener exactamente 8 dígitos.");

    // Identificación: entre 9 y 12 dígitos
    const idDigits = onlyDigits(form.identification);
    if (idDigits.length < 9 || idDigits.length > 12) msgs.push("• La identificación debe tener entre 9 y 12 dígitos.");

    // Foto: solo tipos de imagen
    if (form.photo) {
      try {
        if (!form.photo.type.startsWith("image/")) msgs.push("• La foto debe ser un archivo de imagen (jpg, png, etc.).");
      } catch (e) {
        // ignore
      }
    }

    if (msgs.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Datos inválidos o incompletos",
        html: msgs.join("<br/>"),
        confirmButtonColor: "#d89c0b",
      });
      return false;
    }

    return true;
  }

  // helper: file -> base64 (used to embed photo in JSON)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;

    try {
      // Build payload matching the JSON example expected by the backend
      // Convert photo to base64 (strip data URL prefix) and send exact key names
      const payload: any = {
        Name: form.name,
        Identification: form.identification,
        Email: form.email,
        Phone: form.phone ? Number(form.phone) : null,
        Gender: form.gender === "male",
        BirthDate: form.birthDate,
        Address: form.address,
        MaritalStatus: form.maritalStatus,
        Disability: form.disability ? form.disability : null,
        Photo: null,
        EmergencyContactName: form.emergencyContactName || form.emergencyContactRelation,
        EmergencyContactNumber: form.emergencyContactNumber ? Number(form.emergencyContactNumber) : null,
      };

      if (form.photo) {
        const base64DataUrl = await fileToBase64(form.photo);
        // base64DataUrl is like 'data:image/png;base64,AAAA...'
        const parts = base64DataUrl.split(",");
        const base64Only = parts.length > 1 ? parts[1] : parts[0];
        payload.Photo = base64Only;
      }

      await createPatient(payload);

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Paciente creado correctamente",
        confirmButtonColor: "#d89c0b",
      });

      // (navigation removed: returning to list is handled by parent/routes)

      setForm({
        name: "",
        photo: null,
        email: "",
        identification: "",
        phone: "",
        gender: "",
        birthDate: "",
        address: "",
        maritalStatus: "",
        disability: "",
        emergencyContactNumber: "",
        emergencyContactRelation: "",
        emergencyContactName: "",
      });

      const fileInput = document.querySelector('input[name="photo"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      // Prefer server's detailed validation info when available
      const resp = error?.response?.data;
      let message = "No se pudo crear el paciente";
      if (resp) {
        if (resp.details) {
          // details seems to be an object with arrays per field
          try {
            const details = resp.details;
            const parts: string[] = [];
            for (const k of Object.keys(details)) {
              const arr = details[k];
              if (Array.isArray(arr)) parts.push(`${k}: ${arr.join(", ")}`);
            }
            if (parts.length) message = parts.join(" | ");
            else if (typeof resp.error === "string") message = resp.error;
          } catch (e) {
            message = JSON.stringify(resp);
          }
        } else if (resp.error) message = resp.error;
        else if (resp.message) message = resp.message;
      } else {
        message = error?.message || message;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "#d89c0b",
      });
    }
  };

  return (
    <form className="patient-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Nombre *</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} />
      </div>

        {/* Apellido eliminado: backend usa un solo campo Name */}

      <div className="form-group">
        <label>Foto</label>
        <input type="file" name="photo" accept="image/*" onChange={handleFileChange} />
      </div>

      <div className="form-group">
        <label>Correo *</label>
        <input type="text" name="email" value={form.email} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Identificación *</label>
        <input
          type="text"
          name="identification"
          value={form.identification}
          onChange={handleChange}
          inputMode="numeric"
          
          maxLength={12}
          onKeyDown={blockNonIntegerKeys}
          onPaste={filterPasteInteger}
          onWheel={preventWheel}
        />
      </div>

      <div className="form-group">
        <label>Teléfono *</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          inputMode="numeric"
          
          maxLength={8}
          onKeyDown={blockNonIntegerKeys}
          onPaste={filterPasteInteger}
          onWheel={preventWheel}
        />
      </div>

      <div className="form-group">
        <label>Género *</label>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
        </select>
      </div>

      <div className="form-group">
        <label>Fecha de nacimiento *</label>
        <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
      </div>

      <div className="form-group full-width">
        <label>Dirección *</label>
        <textarea name="address" value={form.address} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Discapacidad (opcional)</label>
        <input type="text" name="disability" value={form.disability} onChange={handleChange} placeholder="Ej: Ninguna, Movilidad reducida" />
      </div>

      <div className="form-group">
        <label>Estado civil *</label>
        <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
          <option value="">Seleccione...</option>
          <option value="Soltero/a">Soltero/a</option>
          <option value="Casado/a">Casado/a</option>
          <option value="Divorciado/a">Divorciado/a</option>
          <option value="Viudo/a">Viudo/a</option>
          <option value="Unión libre">Unión libre</option>
        </select>
      </div>

      <div className="form-group">
        <label>Teléfono de emergencia *</label>
        <input
          type="text"
          name="emergencyContactNumber"
          value={form.emergencyContactNumber}
          onChange={handleChange}
          inputMode="numeric"
          
          maxLength={8}
          onKeyDown={blockNonIntegerKeys}
          onPaste={filterPasteInteger}
          onWheel={preventWheel}
        />
      </div>

      <div className="form-group">
        <label>Nombre contacto de emergencia *</label>
        <input type="text" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Ej: María Pérez" />
      </div>

      <div className="form-group">
        <label>Relación del contacto *</label>
        <input type="text" name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} placeholder="Ej: Madre, Padre, Hermano/a" />
      </div>

      <div className="form-button">
        <button type="submit">Guardar Paciente</button>
      </div>
    </form>
  );
};

export default PatientForm;
