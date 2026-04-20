// src/lib/vehicleService.ts
// Serviço de consulta de placa - Com fallback para mock

import { callFunction } from './supabase';

export interface VehicleData {
  plate: string;
  model: string;
  year: string;
  engine: string;
  fuel: string;
  chassi: string;
  cv: string;
}

// Dados mock para fallback
const getMockData = (plate: string): VehicleData => {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  const mockDatabase: Record<string, VehicleData> = {
    "BRA2E19": {
      plate: cleanPlate,
      model: "VW Amarok 2.0 TDI",
      year: "2023",
      engine: "2.0 TDI",
      fuel: "Diesel",
      chassi: `9BW${cleanPlate}123456`,
      cv: "180"
    },
    "BRA1E19": {
      plate: cleanPlate,
      model: "Fiat Toro 2.0 TD",
      year: "2023",
      engine: "2.0 TD",
      fuel: "Diesel",
      chassi: `9BF${cleanPlate}789012`,
      cv: "170"
    }
  };

  return mockDatabase[cleanPlate] || {
    plate: cleanPlate,
    model: "Modelo não encontrado",
    year: new Date().getFullYear().toString(),
    engine: "Motor não especificado",
    fuel: "Não informado",
    chassi: `CHASSI${cleanPlate}`,
    cv: "0"
  };
};

export async function fetchVehicleByPlate(plate: string): Promise<VehicleData | null> {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  if (cleanPlate.length < 7) {
    return null;
  }

  console.log(`🔍 Buscando dados para placa: ${cleanPlate}`);

  try {
    const data = await callFunction<VehicleData>('lookup-vehicle', { plate: cleanPlate });

    if (data && (data.model || data.plate)) {
      return {
        plate: cleanPlate,
        model: data.model || "Modelo não encontrado",
        year: data.year || new Date().getFullYear().toString(),
        engine: data.engine || "Motor não especificado",
        fuel: data.fuel || "Não informado",
        chassi: data.chassi || `CHASSI${cleanPlate}`,
        cv: data.cv || "0"
      };
    } else {
      console.warn('⚠️ Edge Function não retornou dados válidos. Usando dados mock.');
      return getMockData(cleanPlate);
    }
  } catch (error) {
    console.error('❌ Erro ao consultar API de placas via Edge Function:', error);
    console.log("📦 Usando dados mock como fallback.");
    return getMockData(cleanPlate);
  }
}