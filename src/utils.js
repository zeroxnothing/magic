export const formatTk = value => `৳ ${Number(value || 0).toLocaleString('bn-BD')}`

export function banglaDigits(value) {
  return String(value).replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'[digit])
}

export function scrollToOrder() {
  document.getElementById('order')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
