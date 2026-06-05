import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import StudentHome from '../components/StudentHome'
import TeacherHome from '../components/TeacherHome'

export default function HomePage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready } = store

  useEffect(() => {
    if (ready && !user) router.replace('/')
  }, [ready, user])

  if (!ready || !user) return null

  return (
    <>
      <Head><title>Inicio — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        {user.role === 'student'
          ? <StudentHome store={store} />
          : <TeacherHome store={store} />
        }
      </Layout>
    </>
  )
}
