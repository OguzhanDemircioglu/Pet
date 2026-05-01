'use client'
import { NON_DIGIT_RE } from '@/lib/constants'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(NON_DIGIT_RE, '').slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
}

export default function PhoneInput({ value, onChange, ...rest }: Props) {
  return (
    <input
      {...rest}
      type="tel"
      value={formatPhoneDisplay(value)}
      inputMode="numeric"
      placeholder="05XX XXX XX XX"
      onChange={e => {
        const raw = e.target.value.replace(NON_DIGIT_RE, '').slice(0, 11)
        onChange(raw)
      }}
    />
  )
}
