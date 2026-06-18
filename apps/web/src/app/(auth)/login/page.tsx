import { redirect } from 'next/navigation'

export default function LoginFallback() {
  redirect('/br/login')
}
