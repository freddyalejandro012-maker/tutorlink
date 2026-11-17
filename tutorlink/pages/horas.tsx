import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useStore } from '../lib/store'
import Layout from '../components/Layout'
import TeacherHoras from '../components/horas/TeacherHoras'
import StudentHoras from '../components/horas/StudentHoras'

export default function HorasPage() {
  const router = useRouter()
  const store = useStore()
  const { user, ready } = store

  useEffect(() => {
    if (ready && !user) router.replace('/')
  }, [ready, user])

  if (!ready || !user) return null

  return (
    <>
      <Head><title>Horas — TutorLink</title></Head>
      <Layout user={user} credits={user.credits} onLogout={() => { store.logout(); router.push('/') }}>
        {user.role === 'teacher' ? <TeacherHoras user={user} /> : <StudentHoras user={user} />}
      </Layout>
    </>
  )
}
