'use client'
import Swal from 'sweetalert2'

const isDark = () =>
  typeof window !== 'undefined' &&
  document.documentElement.classList.contains('dark')

// Toast handle reused for stacking — every swalError call shares this base.
// Position: top-end (top-right). Auto-dismiss after 4s with a progress bar.
// Hover pauses the timer so users can read longer messages.
const ErrorToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

// Small top-right error toast. Replaces toast.error from react-hot-toast for
// API errors. Pass a title only for plan-restriction or other categorized
// errors where an extra hint adds context.
//
// Use:
//   swalError('Stok yetersiz')
//   swalError(err.message ?? 'Bilinmeyen hata', 'Plan kısıtı')
export function swalError(message: string, title?: string) {
  return ErrorToast.fire({
    icon: 'error',
    title: title ?? message,
    text: title ? message : undefined,
    background: isDark() ? '#0a0a0a' : '#ffffff',
    color: isDark() ? '#e5e7eb' : '#111827',
  })
}

// Confirm dialogs stay as centered modals — they need the user's full
// attention since they're action-blocking.
export function swalConfirm(message: string, title: string = 'Onayla') {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Evet',
    cancelButtonText: 'Vazgeç',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    background: isDark() ? '#0a0a0a' : '#ffffff',
    color: isDark() ? '#e5e7eb' : '#111827',
  }).then((r) => r.isConfirmed)
}
