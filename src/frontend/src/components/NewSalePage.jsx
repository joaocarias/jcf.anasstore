
import { Loader2, Minus, Plus, Save, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CustomerFormModal, { EMPTY_CUSTOMER_FORM, buildCustomerPayload } from './CustomerFormModal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_PRODUCT_FORM = {
  name: '',
  description: '',
  supplierUid: '',
  categoryUid: '',
  purchasePrice: '',
  salePrice: '',
  colorUid: '',
  itemSizeUid: '',
  stockQuantity: '0',
}

function parseApiError(payload, fallbackMessage) {
  if (payload?.message) return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) return payload.errors.join(' ')
  return fallbackMessage
}

function formatCurrencyInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 0) return ''
  const amount = Number(digits) / 100
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function currencyInputToNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 0) return 0
  return Number(digits) / 100
}

function parsePercentInput(value) {
  if (!value) return 0
  const normalized = value.replace('%', '').trim().replace('.', ',')
  const [integerPart, decimalPart = ''] = normalized.split(',')
  const integerDigits = integerPart.replace(/\D/g, '')
  const decimalDigits = decimalPart.replace(/\D/g, '').slice(0, 2)
  if (!integerDigits && !decimalDigits) return 0
  const raw = `${integerDigits || '0'}.${decimalDigits.padEnd(2, '0')}`
  return Number(raw)
}

function formatPercent(value) {
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0
  return `${safe.toFixed(2).replace('.', ',')}%`
}

export default function NewSalePage({ token }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [variations, setVariations] = useState([])
  const [genres, setGenres] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [colors, setColors] = useState([])
  const [itemSizes, setItemSizes] = useState([])
  const [selectedCustomerUid, setSelectedCustomerUid] = useState('')
  const [selectedPaymentMethodUid, setSelectedPaymentMethodUid] = useState('')
  const [installments, setInstallments] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [selectedVariationUid, setSelectedVariationUid] = useState('')
  const [saleItems, setSaleItems] = useState([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [pageError, setPageError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saleSummary, setSaleSummary] = useState(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState(EMPTY_CUSTOMER_FORM)
  const [newCustomerError, setNewCustomerError] = useState('')
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [newProductForm, setNewProductForm] = useState(EMPTY_PRODUCT_FORM)
  const [newProductError, setNewProductError] = useState('')
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const productMap = useMemo(() => {
    const map = new Map()
    products.forEach((product) => {
      map.set(product.uid, product)
    })
    return map
  }, [products])

  const orderedPaymentMethods = useMemo(() => {
    return [...paymentMethods].sort((a, b) => {
      const aOrder = Number(a.displayOrder ?? 0)
      const bOrder = Number(b.displayOrder ?? 0)
      return aOrder - bOrder
    })
  }, [paymentMethods])

  const selectedPaymentMethod = useMemo(() => {
    return orderedPaymentMethods.find((method) => method.uid === selectedPaymentMethodUid) ?? null
  }, [orderedPaymentMethods, selectedPaymentMethodUid])

  const maxInstallments = useMemo(() => {
    const max = Number(selectedPaymentMethod?.maxInstallments ?? 1)
    return Number.isFinite(max) && max > 0 ? max : 1
  }, [selectedPaymentMethod])

  const filteredVariations = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return variations
    return variations.filter((item) =>
      `${item.productName} ${item.colorName} ${item.itemSizeName}`.toLowerCase().includes(query),
    )
  }, [productSearch, variations])

  const totals = useMemo(() => {
    const subtotal = saleItems.reduce((acc, item) => acc + item.totalAmount, 0)
    const percent = Math.min(Math.max(discountPercent || 0, 0), 100)
    const discount = subtotal > 0 ? (subtotal * percent) / 100 : 0
    const total = Math.max(0, subtotal - discount)
    return { subtotal, discount, total, percent }
  }, [saleItems, discountPercent])

  const loadLookups = useCallback(async () => {
    async function load(endpoint) {
      const response = await fetch(`${API_BASE_URL}/${endpoint}?page=1&pageSize=500`, { headers: authHeaders })
      if (!response.ok) return []
      const payload = await response.json()
      return Array.isArray(payload?.items) ? payload.items : []
    }

    try {
      const [
        customersPayload,
        productsPayload,
        variationsPayload,
        genresPayload,
        suppliersPayload,
        categoriesPayload,
        paymentMethodsPayload,
        colorsPayload,
        itemSizesPayload,
      ] = await Promise.all([
        load('Customers'),
        load('Products'),
        load('ProductVariations'),
        load('Genres'),
        load('Suppliers'),
        load('Categories'),
        load('PaymentMethods'),
        load('Colors'),
        load('ItemSizes'),
      ])

      setCustomers(customersPayload)
      setProducts(productsPayload)
      setVariations(variationsPayload)
      setGenres(genresPayload)
      setSuppliers(suppliersPayload)
      setCategories(categoriesPayload)
      setPaymentMethods(paymentMethodsPayload)
      setColors(colorsPayload)
      setItemSizes(itemSizesPayload)
    } catch {
      setPageError('Nao foi possivel carregar os dados da venda.')
    }
  }, [authHeaders])

  useEffect(() => {
    if (!selectedPaymentMethodUid && orderedPaymentMethods.length > 0) {
      const firstMethod = orderedPaymentMethods[0]
      setSelectedPaymentMethodUid(firstMethod.uid)
      setDiscountPercent(Number(firstMethod.discountPercentage ?? 0))
      setInstallments(1)
    }
  }, [orderedPaymentMethods, selectedPaymentMethodUid])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  function handleAddItem() {
    if (!selectedVariationUid) return

    const variation = variations.find((item) => item.uid === selectedVariationUid)
    if (!variation) return

    if ((variation.stockQuantity ?? 0) <= 0) {
      setPageError('Este produto esta indisponivel no estoque.')
      return
    }

    const existing = saleItems.find((item) => item.variationUid === variation.uid)
    if (existing) {
      handleUpdateQuantity(variation.uid, existing.quantity + 1)
      return
    }

    const product = productMap.get(variation.productUid)
    const unitPrice = Number(product?.salePrice ?? 0)
    if (unitPrice <= 0) {
      setPageError('Preco de venda invalido para o produto selecionado.')
      return
    }

    setSaleItems((current) => [
      ...current,
      {
        variationUid: variation.uid,
        productUid: variation.productUid,
        label: `${variation.productName} | ${variation.colorName} | ${variation.itemSizeName}`,
        quantity: 1,
        unitPrice,
        totalAmount: unitPrice,
        stockQuantity: variation.stockQuantity ?? 0,
      },
    ])
    setSelectedVariationUid('')
    setPageError('')
  }

  function handleUpdateQuantity(variationUid, newQuantity) {
    setSaleItems((current) =>
      current.map((item) => {
        if (item.variationUid !== variationUid) return item
        if (newQuantity <= 0) return item
        if (newQuantity > item.stockQuantity) {
          setPageError('Quantidade solicitada excede o estoque.')
          return item
        }
        return {
          ...item,
          quantity: newQuantity,
          totalAmount: item.unitPrice * newQuantity,
        }
      }),
    )
  }

  function handleRemoveItem(variationUid) {
    setSaleItems((current) => current.filter((item) => item.variationUid !== variationUid))
  }

  function handleNewCustomerInputChange(field, value) {
    setNewCustomerForm((current) => ({ ...current, [field]: value }))
  }

  function handlePaymentMethodChange(value) {
    setSelectedPaymentMethodUid(value)
    const method = orderedPaymentMethods.find((item) => item.uid === value)
    if (method) {
      setDiscountPercent(Number(method.discountPercentage ?? 0))
      const nextMax = Number(method.maxInstallments ?? 1)
      setInstallments((current) => {
        const safeMax = Number.isFinite(nextMax) && nextMax > 0 ? nextMax : 1
        return Math.min(Math.max(current, 1), safeMax)
      })
    }
  }

  async function handleCreateCustomer(event) {
    event.preventDefault()
    setIsCreatingCustomer(true)
    setNewCustomerError('')

    const payload = buildCustomerPayload(newCustomerForm)

    try {
      const response = await fetch(`${API_BASE_URL}/Customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }
        setNewCustomerError(parseApiError(payloadError, 'Nao foi possivel criar o cliente.'))
        return
      }

      const created = await response.json()
      setCustomers((current) => [created, ...current])
      setSelectedCustomerUid(created.uid)
      setIsNewCustomerOpen(false)
      setNewCustomerForm(EMPTY_CUSTOMER_FORM)
    } catch {
      setNewCustomerError('Nao foi possivel criar o cliente.')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault()
    setIsCreatingProduct(true)
    setNewProductError('')

    const productPayload = {
      name: newProductForm.name.trim(),
      description: newProductForm.description.trim(),
      supplierUid: newProductForm.supplierUid,
      purchasePrice: currencyInputToNumber(newProductForm.purchasePrice),
      salePrice: currencyInputToNumber(newProductForm.salePrice),
      categoryUid: newProductForm.categoryUid,
      isActive: true,
    }

    try {
      const productResponse = await fetch(`${API_BASE_URL}/Products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(productPayload),
      })

      if (!productResponse.ok) {
        let payloadError = null
        try {
          payloadError = await productResponse.json()
        } catch {
          payloadError = null
        }
        setNewProductError(parseApiError(payloadError, 'Nao foi possivel criar o produto.'))
        return
      }

      const createdProduct = await productResponse.json()

      const variationPayload = {
        productUid: createdProduct.uid,
        code: '',
        colorUid: newProductForm.colorUid,
        itemSizeUid: newProductForm.itemSizeUid,
        isActive: true,
      }

      const variationResponse = await fetch(`${API_BASE_URL}/ProductVariations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(variationPayload),
      })

      if (!variationResponse.ok) {
        let payloadError = null
        try {
          payloadError = await variationResponse.json()
        } catch {
          payloadError = null
        }
        setNewProductError(parseApiError(payloadError, 'Nao foi possivel criar a variacao do produto.'))
        return
      }

      const createdVariation = await variationResponse.json()

      const stockPayload = {
        quantity: Number.parseInt(newProductForm.stockQuantity, 10),
      }

      const stockResponse = await fetch(`${API_BASE_URL}/ProductVariations/${createdVariation.uid}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(stockPayload),
      })

      if (!stockResponse.ok) {
        let payloadError = null
        try {
          payloadError = await stockResponse.json()
        } catch {
          payloadError = null
        }
        setNewProductError(parseApiError(payloadError, 'Nao foi possivel salvar o estoque do produto.'))
        return
      }

      setProducts((current) => [createdProduct, ...current])
      setVariations((current) => [createdVariation, ...current])
      setIsNewProductOpen(false)
      setNewProductForm(EMPTY_PRODUCT_FORM)
    } catch {
      setNewProductError('Nao foi possivel criar o produto.')
    } finally {
      setIsCreatingProduct(false)
    }
  }

  async function handleFinalizeSale() {
    if (saleItems.length === 0) {
      setPageError('Adicione pelo menos um produto para finalizar a venda.')
      return
    }

    if (!selectedPaymentMethodUid) {
      setPageError('Selecione a forma de pagamento para finalizar a venda.')
      return
    }

    if (installments < 1 || installments > maxInstallments) {
      setPageError('Numero de parcelas invalido para a forma de pagamento selecionada.')
      return
    }

    if (totals.percent > 100) {
      setPageError('O desconto nao pode ser maior que 100%.')
      return
    }

    setIsSubmitting(true)
    setPageError('')

    try {
      const response = await fetch(`${API_BASE_URL}/Sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          customerUid: selectedCustomerUid || null,
          paymentMethodUid: selectedPaymentMethodUid,
          installments,
          discountAmount: totals.discount,
          items: saleItems.map((item) => ({
            productVariationUid: item.variationUid,
            quantity: item.quantity,
          })),
        }),
      })

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }
        setPageError(parseApiError(payloadError, 'Nao foi possivel finalizar a venda.'))
        return
      }

      let payload = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      const saleUid = payload?.uid
      if (saleUid) {
        await loadSaleSummary(saleUid)
      }

      setSaleItems([])
      setDiscountPercent(0)
      setSelectedCustomerUid('')
      setSelectedVariationUid('')
      setInstallments(1)
      if (orderedPaymentMethods.length > 0) {
        const firstMethod = orderedPaymentMethods[0]
        setSelectedPaymentMethodUid(firstMethod.uid)
        setDiscountPercent(Number(firstMethod.discountPercentage ?? 0))
      }
      await loadLookups()
    } catch {
      setPageError('Nao foi possivel finalizar a venda.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function loadSaleSummary(saleUid) {
    setIsSummaryLoading(true)
    setSummaryError('')
    setIsSummaryOpen(true)
    try {
      const response = await fetch(`${API_BASE_URL}/Sales/${saleUid}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      })

      if (!response.ok) {
        setSummaryError('Nao foi possivel carregar o resumo da venda.')
        setSaleSummary(null)
        return
      }

      const payload = await response.json()
      setSaleSummary(payload)
    } catch {
      setSummaryError('Nao foi possivel carregar o resumo da venda.')
      setSaleSummary(null)
    } finally {
      setIsSummaryLoading(false)
    }
  }

  function handleCloseSummary() {
    setIsSummaryOpen(false)
    setSaleSummary(null)
    setSummaryError('')
  }
  return (
    <section className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl dark:bg-gray-900 dark:shadow-black/30">
      <header className="mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nova Venda</h2>
      </header>

      {pageError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {pageError}
        </p>
      )}

      <div className="grid gap-4">
        <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
          Cliente (opcional)
          <div className="flex gap-2">
            <select
              value={selectedCustomerUid}
              onChange={(event) => setSelectedCustomerUid(event.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Selecione</option>
              {customers.map((customer) => (
                <option key={customer.uid} value={customer.uid}>
                  {customer.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsNewCustomerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <Plus size={14} />
              Novo Cliente
            </button>
          </div>
        </label>

        <div className="grid gap-2">
          <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
            Produto
            <input
              type="text"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Pesquisar produto"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
          <div className="flex gap-2">
            <select
              value={selectedVariationUid}
              onChange={(event) => setSelectedVariationUid(event.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Selecione</option>
              {filteredVariations.map((variation) => (
                <option key={variation.uid} value={variation.uid} disabled={(variation.stockQuantity ?? 0) <= 0}>
                  {variation.productName} | {variation.colorName} | {variation.itemSizeName}
                  {(variation.stockQuantity ?? 0) <= 0 ? ' (Indisponivel)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              <Plus size={14} />
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setIsNewProductOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <Plus size={14} />
              Novo Produto
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Produtos adicionados</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2 pr-3">Produto</th>
                  <th className="py-2 pr-3">Qtd</th>
                  <th className="py-2 pr-3">Valor</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 text-right">Remover</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item) => (
                  <tr key={item.variationUid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.label}</td>
                    <td className="py-2 pr-3">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.variationUid, item.quantity - 1)}
                          className="rounded-lg border border-gray-200 p-1 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.variationUid, item.quantity + 1)}
                          className="rounded-lg border border-gray-200 p-1 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="py-2 pr-3">{item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.variationUid)}
                        className="rounded-lg border border-gray-200 p-1 text-gray-700 transition hover:border-red-500 hover:text-red-600 dark:border-gray-700 dark:text-gray-200"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {saleItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                      Nenhum produto adicionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
              Forma de pagamento
              <select
                value={selectedPaymentMethodUid}
                onChange={(event) => handlePaymentMethodChange(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione</option>
                {orderedPaymentMethods.map((method) => (
                  <option key={method.uid} value={method.uid}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
              Parcelas
              <input
                type="number"
                min="1"
                max={maxInstallments}
                value={installments}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isNaN(value)) {
                    setInstallments(1)
                    return
                  }
                  setInstallments(Math.min(Math.max(value, 1), maxInstallments))
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
          </div>
          <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
            <span>Subtotal</span>
            <span>{totals.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Desconto</span>
            <input
              type="text"
              inputMode="decimal"
              value={formatPercent(discountPercent)}
              onChange={(event) => {
                const parsed = parsePercentInput(event.target.value)
                setDiscountPercent(Math.min(Math.max(parsed, 0), 100))
              }}
              className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100">
            <span>Total</span>
            <span>{totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinalizeSale}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Finalizando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>

      {isNewCustomerOpen && (
        <CustomerFormModal
          isOpen={isNewCustomerOpen}
          title="Adicionar Cliente"
          formData={newCustomerForm}
          genres={genres}
          isSaving={isCreatingCustomer}
          saveErrorMessage={newCustomerError}
          onChange={handleNewCustomerInputChange}
          onClose={() => setIsNewCustomerOpen(false)}
          onSubmit={handleCreateCustomer}
        />
      )}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo Produto</h3>
            </header>
            <form className="grid gap-4" onSubmit={handleCreateProduct}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Nome
                  <input
                    type="text"
                    value={newProductForm.name}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Descricao
                  <input
                    type="text"
                    value={newProductForm.description}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, description: event.target.value }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Fornecedor
                  <select
                    value={newProductForm.supplierUid}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, supplierUid: event.target.value }))}
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
                    value={newProductForm.categoryUid}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, categoryUid: event.target.value }))}
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
                    type="text"
                    value={newProductForm.purchasePrice}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, purchasePrice: formatCurrencyInput(event.target.value) }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Preco de Venda
                  <input
                    type="text"
                    value={newProductForm.salePrice}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, salePrice: formatCurrencyInput(event.target.value) }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Cor
                  <select
                    value={newProductForm.colorUid}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, colorUid: event.target.value }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {colors.map((item) => (
                      <option key={item.uid} value={item.uid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Tamanho
                  <select
                    value={newProductForm.itemSizeUid}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, itemSizeUid: event.target.value }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Selecione</option>
                    {itemSizes.map((item) => (
                      <option key={item.uid} value={item.uid}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Estoque inicial
                  <input
                    type="number"
                    min="0"
                    value={newProductForm.stockQuantity}
                    onChange={(event) => setNewProductForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>
              {newProductError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {newProductError}
                </p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProduct}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isCreatingProduct ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreatingProduct ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isSummaryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resumo da Venda</h3>
            </header>

            {isSummaryLoading && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Carregando resumo...</p>
            )}

            {!isSummaryLoading && summaryError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {summaryError}
              </p>
            )}

            {!isSummaryLoading && !summaryError && saleSummary && (
              <div className="grid gap-4">
                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Cliente
                  </h4>
                  {saleSummary.customerName ? (
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{saleSummary.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Telefone</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {saleSummary.customerPhone || '-'}
                          {saleSummary.customerIsWhatsApp ? ' (WhatsApp)' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300">Venda avulsa (cliente nao identificado).</p>
                  )}
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Pagamento
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Forma</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{saleSummary.paymentMethodName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Parcelas</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{saleSummary.installments}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Produtos
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                          <th className="py-2 pr-3">Produto</th>
                          <th className="py-2 pr-3">Qtd</th>
                          <th className="py-2 pr-3">Valor</th>
                          <th className="py-2 pr-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleSummary.items?.map((item) => (
                          <tr key={item.productVariationUid} className="border-b border-gray-50 dark:border-gray-800">
                            <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">
                              {item.productName} | {item.colorName} | {item.itemSizeName}
                            </td>
                            <td className="py-2 pr-3">{item.quantity}</td>
                            <td className="py-2 pr-3">
                              {Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2 pr-3">
                              {Number(item.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                        {saleSummary.items?.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                              Nenhum produto registrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{Number(saleSummary.subtotalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span>Desconto</span>
                    <span>{Number(saleSummary.discountAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100">
                    <span>Total</span>
                    <span>{Number(saleSummary.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </section>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleCloseSummary}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}



