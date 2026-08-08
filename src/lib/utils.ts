import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 금액을 "1,200,000원" 형식으로 표시합니다. */
export function formatCurrency(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}
