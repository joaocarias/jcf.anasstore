import { Cake, Eye, Loader2, MessageCircle, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const EMPTY_FORM = {
  name: '',
  genreUid: '',
  birthDate: '',
  phone: '',
  isWhatsApp: true,
  place: '',
  number: '',
  neighborhood: '',
  complement: '',
  zipCode: '',
  city: '',
  state: 'RN',
}

function emptyToNull(value) {
  const trimmed = (value ?? '').trim()
  return trimmed.length === 0 ? null : trimmed
}

function formatCityState(city, state) {
  if (city && state) return `${city} - ${state}`
  if (city) return city
  if (state) return state
  return '-'
}

function formatBirthDate(value) {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return '-'
  return `${day}/${month}/${year}`
}

function isBirthday(value) {
  if (!value) return false
  const [, month, day] = value.split('-')
  if (!month || !day) return false

  const now = new Date()
  const currentDay = String(now.getDate()).padStart(2, '0')
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  return day === currentDay && month === currentMonth
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

function formatDate(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('pt-BR')
}

function formatDateTime(value) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('pt-BR')
}

export default function CustomersListPage({ token }) {
  const [customers, setCustomers] = useState([])
  const [genres, setGenres] = useState([])
  const [searchNameInput, setSearchNameInput] = useState('')
  const [searchName, setSearchName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCustomerUid, setEditingCustomerUid] = useState(null)
  const [deletingCustomerUid, setDeletingCustomerUid] = useState(null)
  const [customerPendingDelete, setCustomerPendingDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [viewErrorMessage, setViewErrorMessage] = useState('')
  const [viewCustomer, setViewCustomer] = useState(null)

  const loadCustomers = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}/Customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          setCustomers([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setCustomers(Array.isArray(payload?.items) ? payload.items : [])
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage('Não foi possível carregar a lista de clientes.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchName, token])

  const loadGenres = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/Genres?page=1&pageSize=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json()
      setGenres(Array.isArray(payload?.items) ? payload.items : [])
    } catch {
      setGenres([])
    }
  }, [token])

  useEffect(() => {
    loadCustomers()
    loadGenres()
  }, [loadCustomers, loadGenres])

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(totalItems / pageSize))
    if (currentPage > pages) {
      setCurrentPage(pages)
    }
  }, [currentPage, pageSize, totalItems])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleSearchCustomers() {
    setCurrentPage(1)
    setSearchName(searchNameInput.trim())
  }

  function handleOpenCreate() {
    setFormData(EMPTY_FORM)
    setSaveErrorMessage('')
    setEditingCustomerUid(null)
    setIsCreateModalOpen(true)
  }

  function handleCloseCreate() {
    setIsCreateModalOpen(false)
    setIsSaving(false)
    setEditingCustomerUid(null)
  }

  function mapCustomerToForm(customer) {
    return {
      name: customer?.name ?? '',
      genreUid: customer?.genreUid ?? '',
      birthDate: customer?.birthDate ?? '',
      phone: customer?.phone ?? '',
      isWhatsApp: Boolean(customer?.isWhatsApp),
      place: customer?.place ?? '',
      number: customer?.number ?? '',
      neighborhood: customer?.neighborhood ?? '',
      complement: customer?.complement ?? '',
      zipCode: customer?.zipCode ?? '',
      city: customer?.city ?? '',
      state: customer?.state ?? 'RN',
    }
  }

  async function handleCreateCustomer(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')
    const isEditing = Boolean(editingCustomerUid)

    const payload = {
      name: formData.name.trim(),
      genreUid: formData.genreUid,
      birthDate: formData.birthDate || null,
      phone: formData.phone.trim(),
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
    }

    try {
      const response = await fetch(isEditing ? `${API_BASE_URL}/Customers/${editingCustomerUid}` : `${API_BASE_URL}/Customers`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(isEditing ? { ...payload, isActive: true } : payload),
      })

      if (!response.ok) {
        let message = isEditing ? 'Não foi possível atualizar o cliente.' : 'Não foi possível criar o cliente.'
        try {
          const errorPayload = await response.json()
          if (errorPayload?.message) {
            message = errorPayload.message
          }
        } catch {
          // ignore parse errors
        }

        setSaveErrorMessage(message)
        return
      }

      handleCloseCreate()
      await loadCustomers()
    } catch {
      setSaveErrorMessage(isEditing ? 'Não foi possível atualizar o cliente.' : 'Não foi possível criar o cliente.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleOpenEdit(customerUid) {
    setSaveErrorMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Customers/${customerUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setFormData(mapCustomerToForm(payload))
      setEditingCustomerUid(customerUid)
      setIsCreateModalOpen(true)
    } catch {
      setErrorMessage('Não foi possível carregar os dados para edição.')
    }
  }

  function handleRequestDelete(customer) {
    setCustomerPendingDelete(customer)
  }

  function handleCloseDeleteModal() {
    if (deletingCustomerUid) {
      return
    }

    setCustomerPendingDelete(null)
  }

  async function handleConfirmDeleteCustomer() {
    if (!customerPendingDelete?.uid) {
      return
    }

    setDeletingCustomerUid(customerPendingDelete.uid)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Customers/${customerPendingDelete.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          return
        }
        throw new Error('failed')
      }

      await loadCustomers()
      setCustomerPendingDelete(null)
    } catch {
      setErrorMessage('Não foi possível excluir o cliente.')
    } finally {
      setDeletingCustomerUid(null)
    }
  }

  async function handleOpenView(customerUid) {
    setIsViewModalOpen(true)
    setIsViewLoading(true)
    setViewErrorMessage('')
    setViewCustomer(null)

    try {
      const response = await fetch(`${API_BASE_URL}/Customers/${customerUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setViewErrorMessage('Você não possui acesso para realizar esta ação.')
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setViewCustomer(payload)
    } catch {
      setViewErrorMessage('Não foi possível carregar os dados do cliente.')
    } finally {
      setIsViewLoading(false)
    }
  }

  function handleCloseView() {
    setIsViewModalOpen(false)
    setViewCustomer(null)
    setViewErrorMessage('')
    setIsViewLoading(false)
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Clientes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchNameInput}
            onChange={(event) => setSearchNameInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchCustomers()
              }
            }}
            placeholder="Buscar por nome"
            className="w-52 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSearchCustomers}
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

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando clientes...</p>}

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
                <th className="py-2 pr-3">Gênero</th>
                <th className="py-2 pr-3">Data de Nascimento</th>
                <th className="py-2 pr-3">Telefone</th>
                <th className="py-2 pr-3">Cidade</th>
                <th className="py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.uid} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{customer.name}</td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{customer.genreName}</td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {formatBirthDate(customer.birthDate)}
                      {isBirthday(customer.birthDate) && (
                        <Cake size={15} className="text-amber-500 dark:text-amber-300" />
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {customer.phone}
                      {customer.isWhatsApp && (
                        <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatCityState(customer.city, customer.state)}</td>
                  <td className="py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenView(customer.uid)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                        title="Exibir"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(customer.uid)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestDelete(customer)}
                        disabled={deletingCustomerUid === customer.uid}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-red-500 dark:hover:text-red-400"
                        title="Excluir"
                      >
                        {deletingCustomerUid === customer.uid ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                    Nenhum cliente encontrado.
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
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingCustomerUid ? 'Editar Cliente' : 'Adicionar Cliente'}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleCreateCustomer}>
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
                  Gênero
                  <select
                    value={formData.genreUid}
                    onChange={(event) => handleInputChange('genreUid', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {genres.map((genre) => (
                      <option key={genre.uid} value={genre.uid}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Data de Nascimento
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(event) => handleInputChange('birthDate', event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

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
                  É WhatsApp
                </label>
              </div>

              <div className="mt-1 border-t border-gray-200 pt-4 dark:border-gray-800">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Endereço
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
                    Número
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
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
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
                  onClick={handleCloseCreate}
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

      {isViewModalOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalhes do Cliente</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualização completa dos dados do cliente.
              </p>
            </header>

            {isViewLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando informações...</p>
            )}

            {!isViewLoading && viewErrorMessage && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {viewErrorMessage}
              </p>
            )}

            {!isViewLoading && !viewErrorMessage && viewCustomer && (
              <div className="grid gap-5">
                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Cliente
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{viewCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gênero</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.genreName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Data de Nascimento</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(viewCustomer.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {viewCustomer.phone}
                        {viewCustomer.isWhatsApp ? ' (WhatsApp)' : ''}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Endereço
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Logradouro</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.place || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Número</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bairro</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.neighborhood || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Complemento</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.complement || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CEP</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.zipCode || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cidade</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.city || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">UF</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{viewCustomer.state || '-'}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Registro
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Criado em</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(viewCustomer.createAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Atualizado em</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(viewCustomer.updateAt)}</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCloseView}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {customerPendingDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar exclusão</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja realmente excluir o cliente <strong>{customerPendingDelete.name}</strong>?
              </p>
            </header>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={Boolean(deletingCustomerUid)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                disabled={Boolean(deletingCustomerUid)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingCustomerUid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingCustomerUid ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}




