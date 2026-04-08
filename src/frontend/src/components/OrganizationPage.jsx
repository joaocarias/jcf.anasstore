import { Building2, Loader2, Pencil, Plus, Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_FORM = {
  legalName: '',
  tradeName: '',
  cnpj: '',
  phone: '',
  email: '',
  openingDate: '',
  cnae: '',
  stateRegistration: '',
  administrator: '',
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

function formatCnpj(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function formatCityState(city, state) {
  if (city && state) return `${city} - ${state}`
  if (city) return city
  if (state) return state
  return '-'
}

export default function OrganizationPage({ token, isAdmin = false }) {
  const [organization, setOrganization] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [formData, setFormData] = useState(EMPTY_FORM)

  const loadOrganization = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Organization`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 404) {
        setOrganization(null)
        return
      }

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Você não possui acesso para realizar esta ação.')
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setOrganization(payload)
    } catch {
      setErrorMessage('Não foi possível carregar os dados da organização.')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function mapOrganizationToForm(org) {
    return {
      legalName: org?.legalName ?? '',
      tradeName: org?.tradeName ?? '',
      cnpj: org?.cnpj ?? '',
      phone: org?.phone ?? '',
      email: org?.email ?? '',
      openingDate: org?.openingDate ?? '',
      cnae: org?.cnae ?? '',
      stateRegistration: org?.stateRegistration ?? '',
      administrator: org?.administrator ?? '',
      place: org?.place ?? '',
      number: org?.number ?? '',
      neighborhood: org?.neighborhood ?? '',
      complement: org?.complement ?? '',
      zipCode: org?.zipCode ?? '',
      city: org?.city ?? '',
      state: org?.state ?? 'RN',
    }
  }

  function handleOpenCreate() {
    setFormData(EMPTY_FORM)
    setSaveErrorMessage('')
    setIsFormOpen(true)
  }

  function handleOpenEdit() {
    if (!organization) return
    setFormData(mapOrganizationToForm(organization))
    setSaveErrorMessage('')
    setIsFormOpen(true)
  }

  function handleCloseForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setSaveErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')

    const isEditing = Boolean(organization?.uid)
    const payload = {
      legalName: formData.legalName.trim(),
      tradeName: formData.tradeName.trim(),
      cnpj: emptyToNull(formData.cnpj),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      openingDate: emptyToNull(formData.openingDate),
      cnae: emptyToNull(formData.cnae),
      stateRegistration: emptyToNull(formData.stateRegistration),
      administrator: formData.administrator.trim(),
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
      const response = await fetch(
        isEditing ? `${API_BASE_URL}/Organization/${organization.uid}` : `${API_BASE_URL}/Organization`,
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
        const fallback = isEditing
          ? 'Não foi possível atualizar a organização.'
          : 'Não foi possível cadastrar a organização.'
        setSaveErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      handleCloseForm()
      await loadOrganization()
    } catch {
      setSaveErrorMessage(isEditing ? 'Não foi possível atualizar a organização.' : 'Não foi possível cadastrar a organização.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 sm:p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Organização</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Dados institucionais e endereço da empresa.
          </p>
        </div>
        {organization && isAdmin && (
          <button
            type="button"
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            <Pencil size={16} />
            Editar
          </button>
        )}
      </header>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando organização...</p>}

      {!isLoading && errorMessage && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && !organization && (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-8 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <Building2 size={20} />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Nenhuma organização cadastrada</h3>
          <p className="mt-2 text-sm">
            Cadastre os dados da empresa Pará continuar com as configurações do sistema.
          </p>
          {isAdmin ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              <Plus size={16} />
              Cadastrar organização
            </button>
          ) : (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Apenas administradores podem cadastrar a organização.
            </p>
          )}
        </div>
      )}

      {!isLoading && !errorMessage && organization && (
        <div className="grid gap-4">
          <div className="grid gap-4 rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Razão social</p>
              <p className="mt-1 font-semibold">{organization.legalName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nome fantasia</p>
              <p className="mt-1 font-semibold">{organization.tradeName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">CNPJ</p>
              <p className="mt-1 font-semibold">{organization.cnpj || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Telefone</p>
              <p className="mt-1 font-semibold">{organization.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">E-mail</p>
              <p className="mt-1 font-semibold">{organization.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Data de abertura</p>
              <p className="mt-1 font-semibold">{organization.openingDate || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">CNAE</p>
              <p className="mt-1 font-semibold">{organization.cnae || '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Inscrição estadual</p>
              <p className="mt-1 font-semibold">{organization.stateRegistration || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Administrador</p>
              <p className="mt-1 font-semibold">{organization.administrator}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Endereço</p>
            <p className="mt-2 font-semibold">
              {(organization.place || '-')}{organization.number ? `, ${organization.number}` : ''}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {organization.neighborhood || '-'} {organization.complement ? `- ${organization.complement}` : ''}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{formatCityState(organization.city, organization.state)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{organization.zipCode || '-'}</p>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {organization ? 'Editar organização' : 'Cadastrar organização'}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Razão social
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(event) => handleInputChange('legalName', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Nome fantasia
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(event) => handleInputChange('tradeName', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  CNPJ
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(event) => handleInputChange('cnpj', formatCnpj(event.target.value))}
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

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  E-mail
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleInputChange('email', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Data de abertura
                  <input
                    type="date"
                    value={formData.openingDate}
                    onChange={(event) => handleInputChange('openingDate', event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  CNAE
                  <input
                    type="text"
                    value={formData.cnae}
                    onChange={(event) => handleInputChange('cnae', event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Inscrição estadual
                  <input
                    type="text"
                    value={formData.stateRegistration}
                    onChange={(event) => handleInputChange('stateRegistration', event.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Administrador
                <input
                  type="text"
                  value={formData.administrator}
                  onChange={(event) => handleInputChange('administrator', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

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
                      <option value="PB">Paráiba</option>
                      <option value="PR">Parána</option>
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
    </section>
  )
}



