export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '')
}
