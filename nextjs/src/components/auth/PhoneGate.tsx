'use client'
import { useSession } from 'next-auth/react'
import PhoneRequiredModal from './PhoneRequiredModal'

interface Props {
  brandPart1: string
  brandPart2: string
  children: React.ReactNode
}

export default function PhoneGate({ brandPart1, brandPart2, children }: Props) {
  const { data: session, status } = useSession()
  const user = session?.user
  if (status === 'authenticated' && user && !user.phone) {
    return <PhoneRequiredModal brandPart1={brandPart1} brandPart2={brandPart2} />
  }
  return <>{children}</>
}
