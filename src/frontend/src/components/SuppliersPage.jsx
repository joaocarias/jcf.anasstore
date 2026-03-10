import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  isWhatsApp: true,
  place: '',
  number: '',
  neighborhood: '',
  complement: '',
  zipCode: '',
  city: '',
  state: 'RN',
}

function parseApiError(payload, fallbackMessage) {
  if (payload?.message) return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) return payload.errors.join(' ')
  return fallbackMessage
}

function emptyToNull(value) {
  const trimmed = (value ?? '').trim()
  return trimmed.length === 0 ? null : trimmed
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits.length === 0 ? '' : `(${digits}`
  }

  const ddd = digits.slice(0, 2)
  const localNumber = digits.slice(2)

  if (localNumber.length <= 4) {
    return `(${ddd}) ${localNumber}`
  }

  if (localNumber.length <= 8) {
    return `(${ddd}) ${localNumber.slice(0, 4)}-${localNumber.slice(4)}`
  }

  return `(${ddd}) ${localNumber.slice(0, 5)}-${localNumber.slice(5, 9)}`
}

function formatZipCode(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCityState(city, state) {
  if (city && state) return `${city} - ${state}`
  if (city) return city
  if (state) return state
  return '-'
}

export default function SuppliersPage({ token }) {
  const [suppliers, setSuppliers] = useState([])
  const [searchNameInput, setSearchNameInput] = useState('')
  const [searchName, setSearchName] = useState('')
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
  const [formData, setFormData] = useState(EMPTY_FORM)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalItems / pageSize)), [pageSize, totalItems])

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      })

      if (searchName.trim().length > 0) {
        params.set('name', searchName.trim())
      }

      const response = await fetch(`${API_BASE_URL}/Suppliers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Voce nao possui acesso para realizar esta acao.')
          setSuppliers([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setSuppliers(Array.isArray(payload?.items) ? payload.items : [])
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage('Nao foi possivel carregar a lista de fornecedores.')
      setSuppliers([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchName, token])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleSearchSuppliers() {
    setCurrentPage(1)
    setSearchName(searchNameInput.trim())
  }

  function handleOpenCreate() {
    setFormData(EMPTY_FORM)
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

  function mapSupplierToForm(supplier) {
    return {
      name: supplier?.name ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      isWhatsApp: Boolean(supplier?.isWhatsApp),
      place: supplier?.place ?? '',
      number: supplier?.number ?? '',
      neighborhood: supplier?.neighborhood ?? '',
      complement: supplier?.complement ?? '',
      zipCode: supplier?.zipCode ?? '',
      city: supplier?.city ?? '',
      state: supplier?.state ?? 'RN',
    }
  }

  async function handleOpenEdit(uid) {
    setSaveErrorMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Suppliers/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Voce nao possui acesso para realizar esta acao.')
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setFormData(mapSupplierToForm(payload))
      setEditingUid(uid)
      setIsFormOpen(true)
    } catch {
      setErrorMessage('Nao foi possivel carregar fornecedor para edicao.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')

    const isEditing = Boolean(editingUid)
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      isWhatsApp: formData.isWhatsApp,
      address: {
        place: emptyToNull(formData.place),
        number: emptyToNull(formData.number),
        neighborhood: emptyToNull(formData.neighborhood),
        complement: emptyToNull(formData.complement),
        zipCode: emptyToNull(formData.zipCode),
        city: emptyToNull(formData.city),
        state: emptyToNull(formData.state),
      },
      ...(isEditing ? { isActive: true } : {}),
    }

    try {
      const response = await fetch(isEditing ? `${API_BASE_URL}/Suppliers/${editingUid}` : `${API_BASE_URL}/Suppliers`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }
        const fallback = isEditing ? 'Nao foi possivel atualizar o fornecedor.' : 'Nao foi possivel criar o fornecedor.'
        setSaveErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      handleCloseForm()
      await loadSuppliers()
    } catch {
      setSaveErrorMessage(isEditing ? 'Nao foi possivel atualizar o fornecedor.' : 'Nao foi possivel criar o fornecedor.')
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
      const response = await fetch(`${API_BASE_URL}/Suppliers/${pendingDeleteItem.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Voce nao possui acesso para realizar esta acao.')
          return
        }
        throw new Error('failed')
      }

      setPendingDeleteItem(null)
      await loadSuppliers()
    } catch {
      setErrorMessage('Nao foi possivel excluir o fornecedor.')
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Fornecedores</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchNameInput}
            onChange={(event) => setSearchNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchSuppliers()
              }
            }}
            placeholder="Buscar por nome"
            className="w-52 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSearchSuppliers}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <Search size={16} />
            Pesquisar
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </header>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando fornecedores...</p>}

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
                  <th className="py-2 pr-3">Telefone</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Endereco</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((item) => (
                  <tr key={item.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1.5">
                        {item.phone}
                        {item.isWhatsApp && (
                          <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
                        )}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.email}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                      {formatCityState(item.city, item.state)}
                    </td>
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

                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
            <span>Total: {totalItems} | Pagina: {currentPage} | Por pagina: {pageSize}</span>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              ><span className="inline-flex items-center gap-2"><ChevronLeft size={14} /> Anterior</span></button>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              ><span className="inline-flex items-center gap-2">Proxima <ChevronRight size={14} /></span></button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingUid ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
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
                  Email
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Telefone
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(event) => handleInputChange('phone', formatPhone(event.target.value))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formData.isWhatsApp}
                    onChange={(event) => handleInputChange('isWhatsApp', event.target.checked)}
                  />
                  E WhatsApp
                </label>
              </div>

              <div className="mt-1 border-t border-gray-200 pt-4 dark:border-gray-800">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Endereco
                </h4>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                    Logradouro
                    <input
                      type="text"
                      value={formData.place}
                      onChange={(event) => handleInputChange('place', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>

                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Numero
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(event) => handleInputChange('number', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Bairro
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(event) => handleInputChange('neighborhood', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>

                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Complemento
                    <input
                      type="text"
                      value={formData.complement}
                      onChange={(event) => handleInputChange('complement', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>

                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    CEP
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(event) => handleInputChange('zipCode', formatZipCode(event.target.value))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                    Cidade
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(event) => handleInputChange('city', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>

                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    UF
                    <select
                      value={formData.state}
                      onChange={(event) => handleInputChange('state', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapa</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceara</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espirito Santo</option>
                      <option value="GO">Goias</option>
                      <option value="MA">Maranhao</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Para</option>
                      <option value="PB">Paraiba</option>
                      <option value="PR">Parana</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piaui</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondonia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">Sao Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                      <option value="EX">Estrangeiro</option>
                    </select>
                  </label>
                </div>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar exclusao</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja realmente excluir o fornecedor <strong>{pendingDeleteItem.name}</strong>?
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


