'use client'
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

/**
 * PhoneInput — Türkiye cep telefonu girişi.
 *
 * Format: "05XX XXX XX XX" (boşluklu, 11 hane).
 *
 * Kurallar:
 *   - "05" öntakısı kilitli (silinemez, üzerine yazılamaz).
 *   - Sadece sona yazılır, sondan silinir; başa/ortaya ekleme yok.
 *   - Cursor her zaman sona alınır.
 *
 * Yardımcılar:
 *   - toIntl('0552 773 59 94') → '905527735994'
 *   - fromIntl('905527735994') → '0552 773 59 94'
 *
 * Bağımlılık yok — bu component ileride ayrı bir kütüphaneye taşınacak.
 */

const NON_DIGIT = /\D/g

export function toIntl(formatted: string): string {
  const digits = formatted.replace(NON_DIGIT, '')
  if (!digits || digits === '05') return ''
  if (digits.startsWith('0')) return '90' + digits.slice(1, 11)
  if (digits.startsWith('90')) return digits.slice(0, 12)
  return '90' + digits.slice(0, 10)
}

export function fromIntl(intl: string | null | undefined): string {
  if (!intl) return ''
  const digits = intl.replace(NON_DIGIT, '')
  const local = digits.startsWith('90') ? '0' + digits.slice(2) : digits.startsWith('0') ? digits : '0' + digits
  return formatLocal(local)
}

/** Ham girdiyi "0552 773 59 94" formatına getirir. "05" öntakısı garanti edilir. */
export function formatLocal(raw: string): string {
  let digits = raw.replace(NON_DIGIT, '').slice(0, 11)
  if (digits.length === 0) return '05'
  if (digits[0] !== '0') digits = '0' + digits.slice(0, 10)
  if (digits.length === 1) return '05'
  if (digits[1] !== '5') digits = '05' + digits.slice(2)
  let f = digits
  if (digits.length > 4) f = digits.slice(0, 4) + ' ' + digits.slice(4)
  if (digits.length > 7) f = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7)
  if (digits.length > 9) f = digits.slice(0, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 9) + ' ' + digits.slice(9)
  return f
}

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & {
  value: string
  onChange: (formatted: string) => void
}

const PhoneInput = forwardRef<HTMLInputElement, Props>(function PhoneInput(
  { value, onChange, placeholder = '05XX XXX XX XX', inputMode = 'numeric', style, onFocus, onClick, onSelect, onKeyDown, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

  // Değer boşsa "05" olarak başlat
  useEffect(() => {
    if (!value || value.replace(NON_DIGIT, '').length < 2) {
      onChange('05')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveCursorToEnd = () => {
    requestAnimationFrame(() => {
      const el = innerRef.current
      if (!el) return
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(NON_DIGIT, '').slice(0, 11)
    const safe = digits.length < 2 ? '05' : digits
    onChange(formatLocal(safe))
    moveCursorToEnd()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const len = el.value.length
    const selStart = el.selectionStart ?? len
    const selEnd = el.selectionEnd ?? len
    const digitsCount = el.value.replace(NON_DIGIT, '').length

    if (e.key === 'Backspace') {
      if (digitsCount <= 2) { e.preventDefault(); return }
      if (selEnd !== len) { e.preventDefault(); moveCursorToEnd(); return }
    }
    if (e.key === 'Delete') { e.preventDefault(); return }
    if (e.key === 'ArrowLeft' || e.key === 'Home') {
      e.preventDefault()
      moveCursorToEnd()
      return
    }
    if (e.key.length === 1 && /\d/.test(e.key)) {
      if (selStart !== len || selEnd !== len) {
        e.preventDefault()
        if (digitsCount >= 11) return
        onChange(formatLocal(el.value.replace(NON_DIGIT, '') + e.key))
        moveCursorToEnd()
        return
      }
    }

    onKeyDown?.(e)
  }

  const handleFocusOrClick = (e: React.SyntheticEvent<HTMLInputElement>) => {
    moveCursorToEnd()
    if (e.type === 'focus') onFocus?.(e as React.FocusEvent<HTMLInputElement>)
    else if (e.type === 'click') onClick?.(e as React.MouseEvent<HTMLInputElement>)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const len = el.value.length
    const selStart = el.selectionStart ?? len
    if (selStart < 2) {
      el.setSelectionRange(Math.min(2, len), Math.min(2, len))
    }
    onSelect?.(e as React.SyntheticEvent<HTMLInputElement, Event>)
  }

  return (
    <input
      ref={innerRef}
      type="tel"
      value={value || '05'}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocusOrClick}
      onClick={handleFocusOrClick}
      onSelect={handleSelect}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={14}
      style={style}
      {...rest}
    />
  )
})

export default PhoneInput
