import { Loader2, Pencil, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  supplierUid: '',
  purchasePrice: '',
  salePrice: '',
  categoryUid: '',
  colorUids: [],
  itemSizeUids: [],
}

function parseApiError(payload, fallbackMessage) {
  if (payload?.message) return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) return payload.errors.join(' ')
  return fallbackMessage
}

function formatMoney(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

export default function ProductsPage({ token }) {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [colors, setColors] = useState([])
  const [itemSizes, setItemSizes] = useState([])
  const [searchInput, setSearchInput] = useState('')
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

  const loadProducts = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}/Products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        if (response.status === 403) {
          setErrorMessage('Voce nao possui acesso para realizar esta acao.')
          setProducts([])
          setTotalItems(0)
          return
        }
        throw new Error('failed')
      }

      const payload = await response.json()
      setProducts(ensureArray(payload?.items))
      setTotalItems(typeof payload?.total === 'number' ? payload.total : 0)
    } catch {
      setErrorMessage('Nao foi possivel carregar os produtos.')
      setProducts([])
      setTotalItems(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, searchName, token])

  const loadLookupData = useCallback(async () => {
    async function load(endpoint) {
      const response = await fetch(`${API_BASE_URL}/${endpoint}?page=1&pageSize=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return []
      const payload = await response.json()
      return ensureArray(payload?.items)
    }

    try {
      const [suppliersPayload, categoriesPayload, colorsPayload, itemSizesPayload] = await Promise.all([
        load('Suppliers'),
        load('Categories'),
        load('Colors'),
        load('ItemSizes'),
      ])

      setSuppliers(suppliersPayload)
      setCategories(categoriesPayload)
      setColors(colorsPayload)
      setItemSizes(itemSizesPayload)
    } catch {
      setSuppliers([])
      setCategories([])
      setColors([])
      setItemSizes([])
    }
  }, [token])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    loadLookupData()
  }, [loadLookupData])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function toggleArraySelection(field, uid) {
    setFormData((current) => {
      const currentValues = ensureArray(current[field])
      const exists = currentValues.includes(uid)
      return {
        ...current,
        [field]: exists ? currentValues.filter((x) => x !== uid) : [...currentValues, uid],
      }
    })
  }

  function handleSearchProducts() {
    setCurrentPage(1)
    setSearchName(searchInput.trim())
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

  function mapProductToForm(product) {
    return {
      code: product?.code ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      supplierUid: product?.supplierUid ?? '',
      purchasePrice: product?.purchasePrice ? String(product.purchasePrice) : '',
      salePrice: product?.salePrice ? String(product.salePrice) : '',
      categoryUid: product?.categoryUid ?? '',
      colorUids: ensureArray(product?.colors).map((x) => x.uid),
      itemSizeUids: ensureArray(product?.itemSizes).map((x) => x.uid),
    }
  }

  async function handleOpenEdit(uid) {
    setSaveErrorMessage('')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Products/${uid}`, {
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
      setFormData(mapProductToForm(payload))
      setEditingUid(uid)
      setIsFormOpen(true)
    } catch {
      setErrorMessage('Nao foi possivel carregar produto para edicao.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveErrorMessage('')

    const isEditing = Boolean(editingUid)
    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      supplierUid: formData.supplierUid,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice),
      categoryUid: formData.categoryUid,
      colorUids: ensureArray(formData.colorUids),
      itemSizeUids: ensureArray(formData.itemSizeUids),
      ...(isEditing ? { isActive: true } : {}),
    }

    try {
      const response = await fetch(isEditing ? `${API_BASE_URL}/Products/${editingUid}` : `${API_BASE_URL}/Products`, {
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
        const fallback = isEditing ? 'Nao foi possivel atualizar o produto.' : 'Nao foi possivel criar o produto.'
        setSaveErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      handleCloseForm()
      await loadProducts()
    } catch {
      setSaveErrorMessage(isEditing ? 'Nao foi possivel atualizar o produto.' : 'Nao foi possivel criar o produto.')
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
      const response = await fetch(`${API_BASE_URL}/Products/${pendingDeleteItem.uid}`, {
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
      await loadProducts()
    } catch {
      setErrorMessage('Nao foi possivel excluir o produto.')
    } finally {
      setDeletingUid(null)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Produtos</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSearchProducts()
              }
            }}
            placeholder="Buscar por codigo/nome"
            className="w-56 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleSearchProducts}
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

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Carregando produtos...</p>}

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
                  <th className="py-2 pr-3">Codigo</th>
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Fornecedor</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Preco Compra</th>
                  <th className="py-2 pr-3">Preco Venda</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.code}</td>
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.supplierName}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.categoryName}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatMoney(item.purchasePrice)}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatMoney(item.salePrice)}</td>
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

                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhum produto encontrado.
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
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Proxima
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {editingUid ? 'Editar Produto' : 'Adicionar Produto'}
              </h3>
            </header>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Codigo
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(event) => handleInputChange('code', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                  Nome
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Descricao
                <textarea
                  value={formData.description}
                  onChange={(event) => handleInputChange('description', event.target.value)}
                  required
                  rows={3}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Fornecedor
                  <select
                    value={formData.supplierUid}
                    onChange={(event) => handleInputChange('supplierUid', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {suppliers.map((item) => (
                      <option key={item.uid} value={item.uid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Categoria
                  <select
                    value={formData.categoryUid}
                    onChange={(event) => handleInputChange('categoryUid', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {categories.map((item) => (
                      <option key={item.uid} value={item.uid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Preco de Compra
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(event) => handleInputChange('purchasePrice', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Preco de Venda
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(event) => handleInputChange('salePrice', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <legend className="px-1 text-sm font-semibold text-gray-600 dark:text-gray-300">Cores</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {colors.map((item) => (
                      <label key={item.uid} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={ensureArray(formData.colorUids).includes(item.uid)}
                          onChange={() => toggleArraySelection('colorUids', item.uid)}
                        />
                        {item.name}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                  <legend className="px-1 text-sm font-semibold text-gray-600 dark:text-gray-300">Tamanhos</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {itemSizes.map((item) => (
                      <label key={item.uid} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={ensureArray(formData.itemSizeUids).includes(item.uid)}
                          onChange={() => toggleArraySelection('itemSizeUids', item.uid)}
                        />
                        {item.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
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
                Deseja realmente excluir o produto <strong>{pendingDeleteItem.name}</strong>?
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
