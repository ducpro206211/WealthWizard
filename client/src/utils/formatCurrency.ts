import { Currency } from "@/types";

export function formatCurrency(amount: number, currency: Currency = 'VND'): string {
  if (isNaN(amount)) return '0';
  
  let formatter;
  
  switch (currency) {
    case 'USD':
      formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatter.format(amount);
    
    case 'EUR':
      formatter = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatter.format(amount);
    
    case 'VND':
    default:
      // VND typically doesn't use decimal places
      formatter = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return formatter.format(amount) + ' ₫';
  }
}

// Shorthand formatter for large numbers
export function formatShortCurrency(amount: number, currency: Currency = 'VND'): string {
  if (isNaN(amount)) return '0';
  
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M ' + (currency === 'VND' ? '₫' : currency);
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'k ' + (currency === 'VND' ? '₫' : currency);
  } else {
    return formatCurrency(amount, currency);
  }
}
