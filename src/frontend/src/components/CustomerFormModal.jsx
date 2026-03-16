import { Loader2, Save, X } from 'lucide-react'

export const EMPTY_CUSTOMER_FORM = {
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

export function buildCustomerPayload(formData) {
  return {
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
}

export default function CustomerFormModal({
  isOpen,
  title = 'Adicionar Cliente',
  formData = EMPTY_CUSTOMER_FORM,
  genres = [],
  isSaving = false,
  saveErrorMessage = '',
  onChange = () => {},
  onClose = () => {},
  onSubmit = () => {},
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <header className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        </header>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
              Nome
              <input
                type="text"
                value={formData.name}
                onChange={(event) => onChange('name', event.target.value)}
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>

            <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
              Gênero
              <select
                value={formData.genreUid}
                onChange={(event) => onChange('genreUid', event.target.value)}
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
                onChange={(event) => onChange('birthDate', event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>

            <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
              Telefone
              <input
                type="text"
                value={formData.phone}
                onChange={(event) => onChange('phone', formatPhone(event.target.value))}
                required
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>

            <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.isWhatsApp}
                onChange={(event) => onChange('isWhatsApp', event.target.checked)}
              />
              É WhatsApp
            </label>
          </div>

          <div className="mt-1 border-t border-gray-200 pt-4 dark:border-gray-800">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Endereço</h4>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                Logradouro
                <input
                  type="text"
                  value={formData.place}
                  onChange={(event) => onChange('place', event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Número
                <input
                  type="text"
                  value={formData.number}
                  onChange={(event) => onChange('number', event.target.value)}
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
                  onChange={(event) => onChange('neighborhood', event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Complemento
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(event) => onChange('complement', event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                CEP
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(event) => onChange('zipCode', formatZipCode(event.target.value))}
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
                  onChange={(event) => onChange('city', event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                UF
                <select
                  value={formData.state}
                  onChange={(event) => onChange('state', event.target.value)}
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
              onClick={onClose}
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
  )
}
