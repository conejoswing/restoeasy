import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the tables page by default
  redirect('/tables')
}
