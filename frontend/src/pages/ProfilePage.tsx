import { useEffect } from 'react'

import { getMyItems } from '../api/client'

export default function ProfilePage() {
  useEffect(() => {
    const getItems = async () => {
      try {
      const resp = await getMyItems()
      console.log('UE resp:', resp)
      } catch (err) {
        console.log(err)
      }
    }

    getItems()

  }, [])
  return <h1 className="text-2xl font-semibold">Profile page</h1>;
}
