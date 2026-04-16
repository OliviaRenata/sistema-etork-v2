// src/lib/utils.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function maskCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function maskPlate(plate: string): string {
  plate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (plate.length === 7) {
    // Old: ABC-1234
    if (/^[A-Z]{3}\d{4}$/.test(plate)) return `${plate.slice(0,3)}-${plate.slice(3)}`;
    // Mercosul: ABC1D23
    return `${plate.slice(0,3)}-${plate.slice(3)}`;
  }
  return plate;
}
