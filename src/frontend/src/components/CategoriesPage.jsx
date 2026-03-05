import CatalogCrudPage from './CatalogCrudPage'

export default function CategoriesPage({ token }) {
  return (
    <CatalogCrudPage
      token={token}
      title="Categorias"
      endpoint="Categories"
      itemLabel="categoria"
    />
  )
}
