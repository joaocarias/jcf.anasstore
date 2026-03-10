import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function parseApiError(payload, fallbackMessage) {
  if (payload?.message) return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) return payload.errors.join(' ')
  return fallbackMessage
}

export default function CatalogCrudPage({
  token,
  title,
  endpoint,
  hasOrder = false,
  orderLabel = 'Ordem',
  itemLabel = 'registro',
}) {
  const [items, setItems] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUid, setEditingUid] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [deletingUid, setDeletingUid] = useState(null)
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: '',
  })

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [pageSize, totalItems])

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}?page=${currentPage}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          setItems([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setItems(Array.isArray(payload?.items) ? payload.items : [])
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage(`Não foi possível carregar ${title.toLowerCase()}.`)
      setItems([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, endpoint, pageSize, title, token])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleOpenCreate() {
    setFormData({ name: '', description: '', order: '' })
    setSaveErrorMessage('')
    setEditingUid(null)
    setIsFormOpen(true)
  }

  function handleCloseForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingUid(null)
    setSaveErrorMessage('')
  }

  async function handleOpenEdit(uid) {
    setSaveErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      const payload = await response.json()
      setFormData({
        name: payload?.name ?? '',
        description: payload?.description ?? '',
        order: hasOrder ? String(payload?.order ?? '') : '',
      })
      setEditingUid(uid)
      setIsFormOpen(true)
    } catch {
      setErrorMessage(`Não foi possível carregar ${itemLabel} para edição.`)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')

    const isEditing = Boolean(editingUid)
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      ...(hasOrder ? { order: Number(formData.order || 0) } : {}),
      isActive: true,
    }

    try {
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/${endpoint}/${editingUid}` : `${API_BASE_URL}/${endpoint}`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }
        const fallback = isEditing ? `Não foi possível atualizar ${itemLabel}.` : `Não foi possível criar ${itemLabel}.`
        setSaveErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      handleCloseForm()
      await loadItems()
    } catch {
      setSaveErrorMessage(isEditing ? `Não foi possível atualizar ${itemLabel}.` : `Não foi possível criar ${itemLabel}.`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleRequestDelete(item) {
    setPendingDeleteItem(item)
  }

  function handleCloseDeleteModal() {
    if (deletingUid) return
    setPendingDeleteItem(null)
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteItem?.uid) return

    setDeletingUid(pendingDeleteItem.uid)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}/${pendingDeleteItem.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed')
      }

      setPendingDeleteItem(null)
      await loadItems()
    } catch {
      setErrorMessage(`Não foi possível excluir ${itemLabel}.`)
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </header>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>}

      {!isLoading && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && (
        <div className="grid gap-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Descrição</th>
                  {hasOrder && <th className="py-2 pr-3">{orderLabel}</th>}
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                    {hasOrder && <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.order}</td>}
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item.uid)}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(item)}
                          disabled={deletingUid === item.uid}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-red-500 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          {deletingUid === item.uid ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={hasOrder ? 4 : 3} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <span>Total: {totalItems} | Página: {currentPage} | Por página: {pageSize}</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span className="inline-flex items-center gap-2">
                  <ChevronLeft size={14} />
                  Anterior
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <span className="inline-flex items-center gap-2">
                  Próxima
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingUid ? 'Editar' : 'Adicionar'} {itemLabel}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className={`grid gap-3 ${hasOrder ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Nome
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Descrição
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(event) => handleInputChange('description', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                {hasOrder && (
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    {orderLabel}
                    <input
                      type="number"
                      min="1"
                      value={formData.order}
                      onChange={(event) => handleInputChange('order', event.target.value)}
                      required
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                )}
              </div>

              {saveErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {saveErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDeleteItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar exclusão</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja realmente excluir <strong>{pendingDeleteItem.name}</strong>?
              </p>
            </header>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={Boolean(deletingUid)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingUid)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingUid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingUid ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
