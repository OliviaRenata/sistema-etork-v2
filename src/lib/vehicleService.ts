// src/lib/vehicleService.ts
export interface VehicleData {
  model: string;
  year: string;
  engine: string;
  fuel: string;
  chassi?: string;
  cv?: string;
}

export const fetchVehicleByPlate = async (plate: string): Promise<VehicleData | null> => {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanPlate.length < 7) return null;

  try {
    // Substitua pelo seu Token Real da API Placas
    const API_TOKEN = 'SEU_TOKEN_AQUI'; 
    const response = await fetch(`https://wdapi2.com.br/consulta/${cleanPlate}/${API_TOKEN}`);
    
    if (!response.ok) return null;
    const data = await response.json();

    if (data.message === "Placa nao encontrada" || data.codigoRetorno === "1") return null;

    return {
      model: `${data.marca} ${data.modelo}`.trim(),
      year: String(data.anoModelo || data.ano || ''),
      engine: data.extra?.cilindrada || '', 
      fuel: data.combustivel || '',
      chassi: data.chassi || '',
      cv: data.extra?.potencia || ''
    };
  } catch (error) {
    console.error("Erro na busca da placa:", error);
    return null;
  }
};