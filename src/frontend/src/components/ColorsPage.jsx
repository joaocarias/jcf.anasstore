import CatalogCrudPage from './CatalogCrudPage'

export default function ColorsPage({ token }) {
  return (
    <CatalogCrudPage
      token={token}
      title="Cores"
      endpoint="Colors"
      itemLabel="cor"
    />
  )
}
