import CatalogCrudPage from './CatalogCrudPage'

export default function ItemSizesPage({ token }) {
  return (
    <CatalogCrudPage
      token={token}
      title="Tamanhos"
      endpoint="ItemSizes"
      hasOrder
      orderLabel="Ordem"
      itemLabel="tamanho"
    />
  )
}
