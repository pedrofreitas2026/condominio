"use client";

import { useState } from "react";
import { createApartamento, updateApartamento } from "@/lib/actions/apartamentos";
import { useRouter } from "next/navigation";

interface Apartamento {
  id: number;
  numero: string;
  morador: string | null;
  proprietario: string | null;
  ativo: boolean;
}

export default function ApartamentosClient({
  apartamentos,
}: {
  apartamentos: Apartamento[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingApto, setEditingApto] = useState<Apartamento | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (editingApto) {
        await updateApartamento(editingApto.id, formData);
      } else {
        await createApartamento(formData);
      }
      setShowModal(false);
      setEditingApto(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Apartamentos</h1>
          <p className="text-text-secondary mt-1">
            {apartamentos.length} apartamento(s) cadastrado(s)
          </p>
        </div>
        <button
          onClick={() => {
            setEditingApto(null);
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Novo Apartamento
        </button>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Morador</th>
              <th>Proprietário</th>
              <th>Status</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {apartamentos.map((apto) => (
              <tr key={apto.id}>
                <td>
                  <span className="font-semibold text-text-primary">
                    Apto {apto.numero}
                  </span>
                </td>
                <td className="text-text-secondary">
                  {apto.morador || "—"}
                </td>
                <td className="text-text-secondary">
                  {apto.proprietario || "—"}
                </td>
                <td>
                  <span
                    className={`badge ${
                      apto.ativo ? "badge-success" : "badge-danger"
                    }`}
                  >
                    {apto.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => {
                      setEditingApto(apto);
                      setShowModal(true);
                    }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">
              {editingApto ? "Editar Apartamento" : "Novo Apartamento"}
            </h2>
            <form action={handleSubmit} className="space-y-4">
              {!editingApto && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Número *
                  </label>
                  <input
                    name="numero"
                    required
                    className="input-field"
                    placeholder="Ex: 101"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Morador
                </label>
                <input
                  name="morador"
                  className="input-field"
                  defaultValue={editingApto?.morador || ""}
                  placeholder="Nome do morador"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">
                  Proprietário
                </label>
                <input
                  name="proprietario"
                  className="input-field"
                  defaultValue={editingApto?.proprietario || ""}
                  placeholder="Nome do proprietário"
                />
              </div>
              {editingApto && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    name="ativo"
                    className="input-field"
                    defaultValue={editingApto.ativo ? "true" : "false"}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
