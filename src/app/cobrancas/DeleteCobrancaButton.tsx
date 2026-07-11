"use client";

import { useState, useTransition } from "react";
import { deleteCobranca } from "@/lib/actions/cobrancas";
import { useRouter } from "next/navigation";

export function DeleteCobrancaButton({
  id,
  mesReferencia,
}: {
  id: number;
  mesReferencia: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCobranca(id);
      setShowConfirm(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowConfirm(true);
        }}
        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all"
        title="Apagar cobrança"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {showConfirm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirm(false);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/15">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-400"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-primary">
                Apagar Cobrança
              </h2>
            </div>

            <p className="text-text-secondary mb-2">
              Tem certeza que deseja apagar a cobrança de{" "}
              <span className="text-text-primary font-semibold">
                {mesReferencia}
              </span>
              ?
            </p>
            <p className="text-red-400 text-sm mb-6">
              ⚠️ Esta ação não pode ser desfeita. Todos os itens e pagamentos
              registrados nesta cobrança serão apagados permanentemente.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="btn-danger"
                disabled={isPending}
              >
                {isPending ? "Apagando..." : "Sim, Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
