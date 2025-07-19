// Utilitário para combinar classes CSS (versão simplificada)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}