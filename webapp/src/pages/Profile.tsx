import { useParams } from 'react-router-dom'
import OwnProfilePage from './profile/OwnProfilePage'
import PublicProfilePage from './profile/PublicProfilePage'

export default function Profile() {
  const { id } = useParams()

  if (id) {
    return <PublicProfilePage id={id} />
  }

  return <OwnProfilePage />
}