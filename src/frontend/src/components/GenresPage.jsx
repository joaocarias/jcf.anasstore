import CatalogCrudPage from './CatalogCrudPage'

export default function GenresPage({ token }) {
  return (
    <CatalogCrudPage
      token={token}
      title="Gêneros"
      endpoint="Genres"
      itemLabel="gênero"
    />
  )
}
