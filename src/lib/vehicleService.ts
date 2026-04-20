// src/lib/vehicleService.ts
// Servico de consulta de placa - Com fallback para mock

import { supabase } from './supabase';

export interface VehicleData {
  plate: string;
  model: string;
  year: string;
  engine: string;
  fuel: string;
  chassi: string;
  cv: string;
}

// Icones para logs (opcional, apenas para visualizacao)
const ICONS = {
  error: '[ERRO]',
  warning: '[AVISO]',
  success: '[OK]',
  info: '[INFO]',
  mock: '[MOCK]'
};

// Dados mock para fallback
const getMockData = (plate: string): VehicleData => {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  const mockDatabase: Record<string, VehicleData> = {
    "BRA2E20": {
      plate: cleanPlate,
      model: "Fiat Toro 2.0 TD",
      year: "2023",
      engine: "2.0 TD",
      fuel: "Diesel",
      chassi: `9BF${cleanPlate}789012`,
      cv: "170"
    },
    "BRA1E19": {
      plate: cleanPlate,
      model: "VW Amarok 2.0 TDI",
      year: "2023",
      engine: "2.0 TDI",
      fuel: "Diesel",
      chassi: `9BW${cleanPlate}123456`,
      cv: "180"
    },
    "BRA6E24": {
      plate: cleanPlate,
      model: "Jeep Compass 2.0 TD",
      year: "2023",
      engine: "2.0 TD",
      fuel: "Diesel",
      chassi: `9BC${cleanPlate}345678`,
      cv: "170"
    }
  };

  return mockDatabase[cleanPlate] || {
    plate: cleanPlate,
    model: "Modelo nao encontrado",
    year: new Date().getFullYear().toString(),
    engine: "Motor nao especificado",
    fuel: "Nao informado",
    chassi: `CHASSI${cleanPlate}`,
    cv: "0"
  };
};

export async function fetchVehicleByPlate(plate: string): Promise<VehicleData | null> {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  
  if (cleanPlate.length < 7) {
    console.log(`${ICONS.warning} Placa muito curta:`, cleanPlate);
    return null;
  }

  console.log(`${ICONS.info} Buscando dados para placa: ${cleanPlate}`);

  try {
    const { data, error } = await supabase.functions.invoke('lookup-vehicle', {
      body: { plate: cleanPlate }
    });

    if (error) {
      console.error(`${ICONS.error} Erro na Edge Function:`, error.message);
      console.log(`${ICONS.mock} Usando dados mock como fallback.`);
      return getMockData(cleanPlate);
    }

    if (data && data.vehicle) {
      console.log(`${ICONS.success} Dados recebidos da API:`, data.vehicle);
      return {
        plate: cleanPlate,
        model: data.vehicle.model || "Modelo nao encontrado",
        year: data.vehicle.year || new Date().getFullYear().toString(),
        engine: data.vehicle.engine || "Motor nao especificado",
        fuel: data.vehicle.fuel || "Nao informado",
        chassi: data.vehicle.chassi || `CHASSI${cleanPlate}`,
        cv: data.vehicle.cv || data.vehicle.power || "0"
      };
    } else if (data && data.model) {
      console.log(`${ICONS.success} Dados recebidos da API (formato direto):`, data);
      return {
        plate: cleanPlate,
        model: data.model || "Modelo nao encontrado",
        year: data.year || new Date().getFullYear().toString(),
        engine: data.engine || "Motor nao especificado",
        fuel: data.fuel || "Nao informado",
        chassi: data.chassi || `CHASSI${cleanPlate}`,
        cv: data.cv || data.power || "0"
      };
    } else {
      console.warn(`${ICONS.warning} Edge Function nao retornou dados validos:`, data);
      console.log(`${ICONS.mock} Usando dados mock como fallback.`);
      return getMockData(cleanPlate);
    }
    
  } catch (error) {
    console.error(`${ICONS.error} Erro ao consultar API de placas via Edge Function:`, error);
    console.log(`${ICONS.mock} Usando dados mock como fallback.`);
    return getMockData(cleanPlate);
  }
}