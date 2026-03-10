import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Loader2,
  Palette,
  Pencil,
  Plus,
  Ruler,
  Save,
  Search,
  Shapes,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

const EMPTY_FORM = {
  name: '',
  description: '',
  supplierUid: '',
  purchasePrice: '',
  salePrice: '',
  categoryUid: '',
}

const EMPTY_SUPPLIER_FORM = {
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

const EMPTY_CATEGORY_FORM = {
  name: '',
  description: '',
}

const EMPTY_COLOR_FORM = {
  name: '',
  description: '',
}

const EMPTY_ITEM_SIZE_FORM = {
  name: '',
  description: '',
  order: '',
}

const EMPTY_VARIATION_FORM = {
  code: '',
  colorUid: '',
  itemSizeUid: '',
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

function formatMoney(value) {
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false)
  const [quickSupplierFormData, setQuickSupplierFormData] = useState(EMPTY_SUPPLIER_FORM)
  const [quickSupplierErrorMessage, setQuickSupplierErrorMessage] = useState('')
  const [isCreatingQuickSupplier, setIsCreatingQuickSupplier] = useState(false)
  const [isQuickCategoryOpen, setIsQuickCategoryOpen] = useState(false)
  const [quickCategoryFormData, setQuickCategoryFormData] = useState(EMPTY_CATEGORY_FORM)
  const [quickCategoryErrorMessage, setQuickCategoryErrorMessage] = useState('')
  const [isCreatingQuickCategory, setIsCreatingQuickCategory] = useState(false)
  const [isQuickColorOpen, setIsQuickColorOpen] = useState(false)
  const [quickColorFormData, setQuickColorFormData] = useState(EMPTY_COLOR_FORM)
  const [quickColorErrorMessage, setQuickColorErrorMessage] = useState('')
  const [isCreatingQuickColor, setIsCreatingQuickColor] = useState(false)
  const [isQuickItemSizeOpen, setIsQuickItemSizeOpen] = useState(false)
  const [quickItemSizeFormData, setQuickItemSizeFormData] = useState(EMPTY_ITEM_SIZE_FORM)
  const [quickItemSizeErrorMessage, setQuickItemSizeErrorMessage] = useState('')
  const [isCreatingQuickItemSize, setIsCreatingQuickItemSize] = useState(false)
  const [viewingProduct, setViewingProduct] = useState(null)
  const [activeViewTab, setActiveViewTab] = useState('general')
  const [viewVariations, setViewVariations] = useState([])
  const [isLoadingVariations, setIsLoadingVariations] = useState(false)
  const [variationsErrorMessage, setVariationsErrorMessage] = useState('')
  const [variationFormData, setVariationFormData] = useState(EMPTY_VARIATION_FORM)
  const [isSavingVariation, setIsSavingVariation] = useState(false)
  const [deletingVariationUid, setDeletingVariationUid] = useState(null)
  const [pendingDeleteVariation, setPendingDeleteVariation] = useState(null)
  const [pendingStockVariation, setPendingStockVariation] = useState(null)
  const [stockFormQuantity, setStockFormQuantity] = useState('0')
  const [stockErrorMessage, setStockErrorMessage] = useState('')
  const [isSavingStock, setIsSavingStock] = useState(false)
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

  const loadProductVariations = useCallback(
    async (productUid) => {
      setIsLoadingVariations(true)
      setVariationsErrorMessage('')

      try {
        const params = new URLSearchParams({
          page: '1',
          pageSize: '100',
          productUid,
        })

        const response = await fetch(`${API_BASE_URL}/ProductVariations?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          if (response.status === 403) {
            setVariationsErrorMessage('Voce nao possui acesso para realizar esta acao.')
            setViewVariations([])
            return
          }

          throw new Error('failed')
        }

        const payload = await response.json()
        setViewVariations(ensureArray(payload?.items))
      } catch {
        setVariationsErrorMessage('Nao foi possivel carregar as variacoes do produto.')
        setViewVariations([])
      } finally {
        setIsLoadingVariations(false)
      }
    },
    [token],
  )

  useEffect(() => {
    if (activeViewTab !== 'variations' || !viewingProduct?.uid) {
      return
    }

    loadProductVariations(viewingProduct.uid)
  }, [activeViewTab, viewingProduct?.uid, loadProductVariations])

  function handleInputChange(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function handleQuickSupplierInputChange(field, value) {
    setQuickSupplierFormData((current) => ({ ...current, [field]: value }))
  }

  function handleQuickCategoryInputChange(field, value) {
    setQuickCategoryFormData((current) => ({ ...current, [field]: value }))
  }

  function handleQuickColorInputChange(field, value) {
    setQuickColorFormData((current) => ({ ...current, [field]: value }))
  }

  function handleQuickItemSizeInputChange(field, value) {
    setQuickItemSizeFormData((current) => ({ ...current, [field]: value }))
  }

  function handleVariationInputChange(field, value) {
    setVariationFormData((current) => ({ ...current, [field]: value }))
  }

  function handleReuseVariation(variation) {
    setVariationFormData({
      code: variation?.code ?? '',
      colorUid: variation?.colorUid ?? '',
      itemSizeUid: variation?.itemSizeUid ?? '',
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

  function handleOpenQuickSupplier() {
    setQuickSupplierFormData(EMPTY_SUPPLIER_FORM)
    setQuickSupplierErrorMessage('')
    setIsQuickSupplierOpen(true)
  }

  function handleCloseQuickSupplier() {
    if (isCreatingQuickSupplier) return
    setIsQuickSupplierOpen(false)
    setQuickSupplierErrorMessage('')
  }

  function handleOpenQuickCategory() {
    setQuickCategoryFormData(EMPTY_CATEGORY_FORM)
    setQuickCategoryErrorMessage('')
    setIsQuickCategoryOpen(true)
  }

  function handleCloseQuickCategory() {
    if (isCreatingQuickCategory) return
    setIsQuickCategoryOpen(false)
    setQuickCategoryErrorMessage('')
  }

  function handleOpenQuickColor() {
    setQuickColorFormData(EMPTY_COLOR_FORM)
    setQuickColorErrorMessage('')
    setIsQuickColorOpen(true)
  }

  function handleOpenQuickItemSize() {
    setQuickItemSizeFormData(EMPTY_ITEM_SIZE_FORM)
    setQuickItemSizeErrorMessage('')
    setIsQuickItemSizeOpen(true)
  }

  function handleCloseQuickColor() {
    if (isCreatingQuickColor) return
    setIsQuickColorOpen(false)
    setQuickColorErrorMessage('')
  }

  function handleCloseQuickItemSize() {
    if (isCreatingQuickItemSize) return
    setIsQuickItemSizeOpen(false)
    setQuickItemSizeErrorMessage('')
  }

  function mapProductToForm(product) {
    return {
      name: product?.name ?? '',
      description: product?.description ?? '',
      supplierUid: product?.supplierUid ?? '',
      purchasePrice: product?.purchasePrice ? formatCurrencyInput(product.purchasePrice) : '',
      salePrice: product?.salePrice ? formatCurrencyInput(product.salePrice) : '',
      categoryUid: product?.categoryUid ?? '',
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
      name: formData.name.trim(),
      description: formData.description.trim(),
      supplierUid: formData.supplierUid,
      purchasePrice: currencyInputToNumber(formData.purchasePrice),
      salePrice: currencyInputToNumber(formData.salePrice),
      categoryUid: formData.categoryUid,
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

  async function handleCreateQuickSupplier(event) {
    event.preventDefault()
    setIsCreatingQuickSupplier(true)
    setQuickSupplierErrorMessage('')

    const payload = {
      name: quickSupplierFormData.name.trim(),
      phone: quickSupplierFormData.phone.trim(),
      email: quickSupplierFormData.email.trim(),
      isWhatsApp: quickSupplierFormData.isWhatsApp,
      address: {
        place: emptyToNull(quickSupplierFormData.place),
        number: emptyToNull(quickSupplierFormData.number),
        neighborhood: emptyToNull(quickSupplierFormData.neighborhood),
        complement: emptyToNull(quickSupplierFormData.complement),
        zipCode: emptyToNull(quickSupplierFormData.zipCode),
        city: emptyToNull(quickSupplierFormData.city),
        state: emptyToNull(quickSupplierFormData.state),
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Suppliers`, {
        method: 'POST',
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

        const fallback = 'Nao foi possivel criar o fornecedor.'
        setQuickSupplierErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      const createdSupplier = await response.json()
      setSuppliers((current) => [createdSupplier, ...current])
      handleInputChange('supplierUid', createdSupplier.uid)
      setIsQuickSupplierOpen(false)
    } catch {
      setQuickSupplierErrorMessage('Nao foi possivel criar o fornecedor.')
    } finally {
      setIsCreatingQuickSupplier(false)
    }
  }

  async function handleCreateQuickCategory(event) {
    event.preventDefault()
    setIsCreatingQuickCategory(true)
    setQuickCategoryErrorMessage('')

    const payload = {
      name: quickCategoryFormData.name.trim(),
      description: quickCategoryFormData.description.trim(),
      isActive: true,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Categories`, {
        method: 'POST',
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

        const fallback = 'Nao foi possivel criar a categoria.'
        setQuickCategoryErrorMessage(parseApiError(payloadError, fallback))
        return
      }

      const createdCategory = await response.json()
      setCategories((current) => [createdCategory, ...current])
      handleInputChange('categoryUid', createdCategory.uid)
      setIsQuickCategoryOpen(false)
    } catch {
      setQuickCategoryErrorMessage('Nao foi possivel criar a categoria.')
    } finally {
      setIsCreatingQuickCategory(false)
    }
  }

  async function handleCreateQuickColor(event) {
    event.preventDefault()
    setIsCreatingQuickColor(true)
    setQuickColorErrorMessage('')

    const payload = {
      name: quickColorFormData.name.trim(),
      description: quickColorFormData.description.trim(),
      isActive: true,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Colors`, {
        method: 'POST',
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

        setQuickColorErrorMessage(parseApiError(payloadError, 'Nao foi possivel criar a cor.'))
        return
      }

      const createdColor = await response.json()
      setColors((current) => [createdColor, ...current])
      handleVariationInputChange('colorUid', createdColor.uid)
      setIsQuickColorOpen(false)
    } catch {
      setQuickColorErrorMessage('Nao foi possivel criar a cor.')
    } finally {
      setIsCreatingQuickColor(false)
    }
  }

  async function handleCreateQuickItemSize(event) {
    event.preventDefault()
    setIsCreatingQuickItemSize(true)
    setQuickItemSizeErrorMessage('')

    const payload = {
      name: quickItemSizeFormData.name.trim(),
      description: quickItemSizeFormData.description.trim(),
      order: Number(quickItemSizeFormData.order || 0),
      isActive: true,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ItemSizes`, {
        method: 'POST',
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
        setQuickItemSizeErrorMessage(parseApiError(payloadError, 'Nao foi possivel criar o tamanho.'))
        return
      }

      const createdItemSize = await response.json()
      setItemSizes((current) => [createdItemSize, ...current])
      handleVariationInputChange('itemSizeUid', createdItemSize.uid)
      setIsQuickItemSizeOpen(false)
    } catch {
      setQuickItemSizeErrorMessage('Nao foi possivel criar o tamanho.')
    } finally {
      setIsCreatingQuickItemSize(false)
    }
  }

  function handleRequestDelete(item) {
    setPendingDeleteItem(item)
  }

  function handleOpenView(item) {
    setViewingProduct(item)
    setActiveViewTab('general')
    setViewVariations([])
    setVariationsErrorMessage('')
    setIsLoadingVariations(false)
    setVariationFormData(EMPTY_VARIATION_FORM)
    setPendingStockVariation(null)
    setStockFormQuantity('0')
    setStockErrorMessage('')
  }

  function handleOpenViewByTab(item, tab) {
    setViewingProduct(item)
    setActiveViewTab(tab)
    setViewVariations([])
    setVariationsErrorMessage('')
    setIsLoadingVariations(false)
    setVariationFormData(EMPTY_VARIATION_FORM)
    setPendingStockVariation(null)
    setStockFormQuantity('0')
    setStockErrorMessage('')
  }

  function handleCloseView() {
    setViewingProduct(null)
    setActiveViewTab('general')
    setViewVariations([])
    setVariationsErrorMessage('')
    setIsLoadingVariations(false)
    setVariationFormData(EMPTY_VARIATION_FORM)
    setPendingStockVariation(null)
    setStockFormQuantity('0')
    setStockErrorMessage('')
  }

  function handleCloseDeleteModal() {
    if (deletingUid) return
    setPendingDeleteItem(null)
  }

  function handleRequestDeleteVariation(variation) {
    setPendingDeleteVariation(variation)
  }

  function handleOpenStockVariation(variation) {
    setPendingStockVariation(variation)
    setStockFormQuantity(String(Number(variation?.stockQuantity ?? 0)))
    setStockErrorMessage('')
  }

  function handleCloseDeleteVariationModal() {
    if (deletingVariationUid) return
    setPendingDeleteVariation(null)
  }

  function handleCloseStockVariationModal() {
    if (isSavingStock) return
    setPendingStockVariation(null)
    setStockFormQuantity('0')
    setStockErrorMessage('')
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

  async function handleCreateVariation(event) {
    event.preventDefault()

    if (!viewingProduct?.uid) return

    setIsSavingVariation(true)
    setVariationsErrorMessage('')

    const payload = {
      productUid: viewingProduct.uid,
      code: variationFormData.code.trim(),
      colorUid: variationFormData.colorUid,
      itemSizeUid: variationFormData.itemSizeUid,
      isActive: true,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/ProductVariations`, {
        method: 'POST',
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

        setVariationsErrorMessage(parseApiError(payloadError, 'Nao foi possivel criar a variacao do produto.'))
        return
      }

      setVariationFormData(EMPTY_VARIATION_FORM)
      await loadProductVariations(viewingProduct.uid)
      await loadProducts()
    } catch {
      setVariationsErrorMessage('Nao foi possivel criar a variacao do produto.')
    } finally {
      setIsSavingVariation(false)
    }
  }

  async function handleSaveVariationStock(event) {
    event.preventDefault()

    if (!pendingStockVariation?.uid || !viewingProduct?.uid) return

    setIsSavingStock(true)
    setStockErrorMessage('')

    const parsedQuantity = Number.parseInt(stockFormQuantity, 10)
    const quantity = Number.isNaN(parsedQuantity) ? -1 : parsedQuantity

    try {
      const response = await fetch(`${API_BASE_URL}/ProductVariations/${pendingStockVariation.uid}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }

        setStockErrorMessage(parseApiError(payloadError, 'Nao foi possivel salvar o estoque da variacao.'))
        return
      }

      handleCloseStockVariationModal()
      await Promise.all([loadProductVariations(viewingProduct.uid), loadProducts()])
    } catch {
      setStockErrorMessage('Nao foi possivel salvar o estoque da variacao.')
    } finally {
      setIsSavingStock(false)
    }
  }

  async function handleDeleteVariation() {
    if (!pendingDeleteVariation?.uid || !viewingProduct?.uid) return

    const variationUid = pendingDeleteVariation.uid

    if (!viewingProduct?.uid) return

    setDeletingVariationUid(variationUid)
    setVariationsErrorMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/ProductVariations/${variationUid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        let payloadError = null
        try {
          payloadError = await response.json()
        } catch {
          payloadError = null
        }

        setVariationsErrorMessage(parseApiError(payloadError, 'Nao foi possivel remover a variacao do produto.'))
        return
      }

      setPendingDeleteVariation(null)
      await loadProductVariations(viewingProduct.uid)
      await loadProducts()
    } catch {
      setVariationsErrorMessage('Nao foi possivel remover a variacao do produto.')
    } finally {
      setDeletingVariationUid(null)
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
            placeholder="Buscar por nome"
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
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Fornecedor</th>
                  <th className="py-2 pr-3">Categoria</th>
                  <th className="py-2 pr-3">Estoque</th>
                  <th className="py-2 pr-3">Preço Venda</th>
                  <th className="py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.uid} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{item.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.supplierName}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{item.categoryName}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{Number(item.stockQuantity ?? 0)}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatMoney(item.salePrice)}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenView(item)}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                          title="Visualizar"
                        >
                          <Eye size={15} />
                        </button>
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
                          onClick={() => handleOpenViewByTab(item, 'variations')}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                          title="Variação"
                        >
                          <Shapes size={15} />
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
                    <td colSpan={6} className="py-3 text-center text-xs text-gray-500 dark:text-gray-400">
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
                  Proxima
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingProduct && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Visualizar Produto</h3>
            </header>

            <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setActiveViewTab('general')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activeViewTab === 'general'
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Info size={14} />
                Dados Gerais
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('variations')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activeViewTab === 'variations'
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Shapes size={14} />
                Variações
              </button>
            </div>

            {activeViewTab === 'general' && <div className="grid gap-3 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Nome:</span> {viewingProduct.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Descricao:</span> {viewingProduct.description}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Fornecedor:</span> {viewingProduct.supplierName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Categoria:</span> {viewingProduct.categoryName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Preço de Compra:</span> {formatMoney(viewingProduct.purchasePrice)}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Preço de Venda:</span> {formatMoney(viewingProduct.salePrice)}
              </p>
            </div>}

            {activeViewTab === 'variations' && (
              <>
                <form className="mb-4 grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700" onSubmit={handleCreateVariation}>
                  <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                    <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                      Codigo
                      <input
                        type="text"
                        value={variationFormData.code}
                        onChange={(event) => handleVariationInputChange('code', event.target.value)}
                        placeholder="Opcional"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </label>

                    <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                      Cor
                      <div className="flex gap-2">
                        <select
                          value={variationFormData.colorUid}
                          onChange={(event) => handleVariationInputChange('colorUid', event.target.value)}
                          required
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Selecione</option>
                          {colors.map((item) => (
                            <option key={item.uid} value={item.uid}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleOpenQuickColor}
                          aria-label="Adicionar cor"
                          title="Adicionar cor"
                          className="inline-flex items-center justify-center rounded-lg border border-blue-600 p-2 text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        >
                          <Palette size={14} />
                        </button>
                      </div>
                    </label>

                    <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                      Tamanho
                      <div className="flex gap-2">
                        <select
                          value={variationFormData.itemSizeUid}
                          onChange={(event) => handleVariationInputChange('itemSizeUid', event.target.value)}
                          required
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Selecione</option>
                          {itemSizes.map((item) => (
                            <option key={item.uid} value={item.uid}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleOpenQuickItemSize}
                          aria-label="Adicionar tamanho"
                          title="Adicionar tamanho"
                          className="inline-flex items-center justify-center rounded-lg border border-blue-600 p-2 text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        >
                          <Ruler size={14} />
                        </button>
                      </div>
                    </label>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isSavingVariation}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
                      >
                        {isSavingVariation ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      </button>
                    </div>
                  </div>
                </form>

                {isLoadingVariations && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Carregando variações...
                  </div>
                )}

                {!isLoadingVariations && variationsErrorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    {variationsErrorMessage}
                  </div>
                )}

                {!isLoadingVariations && !variationsErrorMessage && viewVariations.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Nenhuma variação disponivel para este produto.
                  </div>
                )}

                {!isLoadingVariations && !variationsErrorMessage && viewVariations.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                          <th className="px-3 py-2">Codigo</th>
                          <th className="px-3 py-2">Cor</th>
                          <th className="px-3 py-2">Tamanho</th>
                          <th className="px-3 py-2">Estoque</th>
                          <th className="px-3 py-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewVariations.map((variation) => (
                          <tr key={variation.uid} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{variation.code || '-'}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{variation.colorName}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{variation.itemSizeName}</td>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                              {Number(variation.stockQuantity ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleReuseVariation(variation)}
                                className="mr-2 rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-blue-600 hover:text-blue-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
                                title="+"
                              >
                                <Plus size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenStockVariation(variation)}
                                className="mr-2 rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                                title="Estoque"
                              >
                                <Boxes size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestDeleteVariation(variation)}
                                disabled={deletingVariationUid === variation.uid}
                                className="rounded-lg border border-gray-200 p-1.5 text-gray-700 transition hover:border-red-500 hover:text-red-600 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:border-red-500 dark:hover:text-red-400"
                                title="Remover"
                              >
                                {deletingVariationUid === variation.uid ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleCloseView}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Fechar
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
                  <div className="flex gap-2">
                    <select
                      value={formData.supplierUid}
                      onChange={(event) => handleInputChange('supplierUid', event.target.value)}
                      required
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Selecione</option>
                      {suppliers.map((item) => (
                        <option key={item.uid} value={item.uid}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleOpenQuickSupplier}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <Plus size={14} />
                      Fornecedor
                    </button>
                  </div>
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Categoria
                  <div className="flex gap-2">
                    <select
                      value={formData.categoryUid}
                      onChange={(event) => handleInputChange('categoryUid', event.target.value)}
                      required
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Selecione</option>
                      {categories.map((item) => (
                        <option key={item.uid} value={item.uid}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleOpenQuickCategory}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  </div>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Preço de Compra
                  <input
                    type="text"
                    value={formData.purchasePrice}
                    onChange={(event) => handleInputChange('purchasePrice', formatCurrencyInput(event.target.value))}
                    placeholder="R$ 0,00"
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Preço de Venda
                  <input
                    type="text"
                    value={formData.salePrice}
                    onChange={(event) => handleInputChange('salePrice', formatCurrencyInput(event.target.value))}
                    placeholder="R$ 0,00"
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
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

      {isQuickSupplierOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar Fornecedor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cadastro rapido sem sair da tela de produto.</p>
            </header>

            <form className="grid gap-4" onSubmit={handleCreateQuickSupplier}>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Nome
                  <input
                    type="text"
                    value={quickSupplierFormData.name}
                    onChange={(event) => handleQuickSupplierInputChange('name', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Email
                  <input
                    type="email"
                    value={quickSupplierFormData.email}
                    onChange={(event) => handleQuickSupplierInputChange('email', event.target.value)}
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
                    value={quickSupplierFormData.phone}
                    onChange={(event) => handleQuickSupplierInputChange('phone', formatPhone(event.target.value))}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
                <label className="mt-7 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={quickSupplierFormData.isWhatsApp}
                    onChange={(event) => handleQuickSupplierInputChange('isWhatsApp', event.target.checked)}
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
                      value={quickSupplierFormData.place}
                      onChange={(event) => handleQuickSupplierInputChange('place', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Numero
                    <input
                      type="text"
                      value={quickSupplierFormData.number}
                      onChange={(event) => handleQuickSupplierInputChange('number', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Bairro
                    <input
                      type="text"
                      value={quickSupplierFormData.neighborhood}
                      onChange={(event) => handleQuickSupplierInputChange('neighborhood', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    Complemento
                    <input
                      type="text"
                      value={quickSupplierFormData.complement}
                      onChange={(event) => handleQuickSupplierInputChange('complement', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    CEP
                    <input
                      type="text"
                      value={quickSupplierFormData.zipCode}
                      onChange={(event) => handleQuickSupplierInputChange('zipCode', formatZipCode(event.target.value))}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                    Cidade
                    <input
                      type="text"
                      value={quickSupplierFormData.city}
                      onChange={(event) => handleQuickSupplierInputChange('city', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </label>
                  <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                    UF
                    <select
                      value={quickSupplierFormData.state}
                      onChange={(event) => handleQuickSupplierInputChange('state', event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="AC">AC</option>
                      <option value="AL">AL</option>
                      <option value="AP">AP</option>
                      <option value="AM">AM</option>
                      <option value="BA">BA</option>
                      <option value="CE">CE</option>
                      <option value="DF">DF</option>
                      <option value="ES">ES</option>
                      <option value="GO">GO</option>
                      <option value="MA">MA</option>
                      <option value="MT">MT</option>
                      <option value="MS">MS</option>
                      <option value="MG">MG</option>
                      <option value="PA">PA</option>
                      <option value="PB">PB</option>
                      <option value="PR">PR</option>
                      <option value="PE">PE</option>
                      <option value="PI">PI</option>
                      <option value="RJ">RJ</option>
                      <option value="RN">RN</option>
                      <option value="RS">RS</option>
                      <option value="RO">RO</option>
                      <option value="RR">RR</option>
                      <option value="SC">SC</option>
                      <option value="SP">SP</option>
                      <option value="SE">SE</option>
                      <option value="TO">TO</option>
                      <option value="EX">EX</option>
                    </select>
                  </label>
                </div>
              </div>

              {quickSupplierErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {quickSupplierErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseQuickSupplier}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuickSupplier}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isCreatingQuickSupplier ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreatingQuickSupplier ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickCategoryOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar Categoria</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cadastro rapido sem sair da tela de produto.</p>
            </header>

            <form className="grid gap-4" onSubmit={handleCreateQuickCategory}>
              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Nome
                <input
                  type="text"
                  value={quickCategoryFormData.name}
                  onChange={(event) => handleQuickCategoryInputChange('name', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Descricao
                <textarea
                  rows={3}
                  value={quickCategoryFormData.description}
                  onChange={(event) => handleQuickCategoryInputChange('description', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              {quickCategoryErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {quickCategoryErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseQuickCategory}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuickCategory}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isCreatingQuickCategory ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreatingQuickCategory ? 'Salvando...' : 'Salvar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickColorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar Cor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cadastro rapido sem sair da variacao do produto.</p>
            </header>

            <form className="grid gap-4" onSubmit={handleCreateQuickColor}>
              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Nome
                <input
                  type="text"
                  value={quickColorFormData.name}
                  onChange={(event) => handleQuickColorInputChange('name', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Descricao
                <textarea
                  rows={3}
                  value={quickColorFormData.description}
                  onChange={(event) => handleQuickColorInputChange('description', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              {quickColorErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {quickColorErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseQuickColor}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuickColor}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isCreatingQuickColor ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreatingQuickColor ? 'Salvando...' : 'Salvar Cor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuickItemSizeOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar Tamanho</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cadastro rapido sem sair da variacao do produto.</p>
            </header>

            <form className="grid gap-4" onSubmit={handleCreateQuickItemSize}>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 md:col-span-2">
                  Nome
                  <input
                    type="text"
                    value={quickItemSizeFormData.name}
                    onChange={(event) => handleQuickItemSizeInputChange('name', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>

                <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                  Ordem
                  <input
                    type="number"
                    min="1"
                    value={quickItemSizeFormData.order}
                    onChange={(event) => handleQuickItemSizeInputChange('order', event.target.value)}
                    required
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </label>
              </div>

              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Descricao
                <textarea
                  rows={3}
                  value={quickItemSizeFormData.description}
                  onChange={(event) => handleQuickItemSizeInputChange('description', event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>

              {quickItemSizeErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {quickItemSizeErrorMessage}
                </p>
              )}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseQuickItemSize}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuickItemSize}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:opacity-70"
                >
                  {isCreatingQuickItemSize ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isCreatingQuickItemSize ? 'Salvando...' : 'Salvar Tamanho'}
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

      {pendingStockVariation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Adicionar estoque</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Variacao <strong>{pendingStockVariation.code || '-'} | {pendingStockVariation.colorName} | {pendingStockVariation.itemSizeName}</strong>
              </p>
            </header>
            <form className="grid gap-4" onSubmit={handleSaveVariationStock}>
              <label className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                Quantidade
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={stockFormQuantity}
                  onChange={(event) => setStockFormQuantity(event.target.value)}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              {stockErrorMessage && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {stockErrorMessage}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseStockVariationModal}
                  disabled={isSavingStock}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingStock}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingStock ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSavingStock ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {pendingDeleteVariation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 px-4 py-6">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <header className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Confirmar exclusao</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Deseja realmente excluir a variacao <strong>{pendingDeleteVariation.code || '-'} | {pendingDeleteVariation.colorName} | {pendingDeleteVariation.itemSizeName}</strong>?
              </p>
            </header>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseDeleteVariationModal}
                disabled={Boolean(deletingVariationUid)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteVariation}
                disabled={Boolean(deletingVariationUid)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingVariationUid ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingVariationUid ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}




