// src/lib/vehicleService.ts
// Serviço de consulta de placa - Com fallback para mock

export interface VehicleData {
  plate: string;
  model: string;
  year: string;
  engine: string;
  fuel: string;
  chassi: string;
  cv: string;
}

// Token da API de placas - VOCÊ PRECISA COLOCAR SEU TOKEN REAL AQUI
const API_TOKEN = "SEU_TOKEN_AQUI"; // Substitua pelo seu token real
const API_URL = "https://wdapi2.com.br/consulta";

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

  // Verifica se o token foi configurado
  if (API_TOKEN === "SEU_TOKEN_AQUI") {
    console.warn("⚠️ Token da API não configurado. Usando dados mock.");
    return getMockData(cleanPlate);
  }

  try {
    // Tenta buscar da API real
    const response = await fetch(`${API_URL}/${cleanPlate}/${API_TOKEN}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ API retornou erro ${response.status}. Usando dados mock.`);
      return getMockData(cleanPlate);
    }

    const data = await response.json();
    
    // Verifica se a API retornou dados válidos
    if (data && data.modelo) {
      return {
        plate: cleanPlate,
        model: data.modelo || data.model || "Modelo não encontrado",
        year: data.ano || new Date().getFullYear().toString(),
        engine: data.motor || "Motor não especificado",
        fuel: data.combustivel || "Não informado",
        chassi: data.chassi || `CHASSI${cleanPlate}`,
        cv: data.potencia || "0"
      };
    } else {
      console.warn("⚠️ API não retornou dados válidos. Usando dados mock.");
      return getMockData(cleanPlate);
    }
  } catch (error) {
    console.error("❌ Erro ao consultar API de placas:", error);
    console.log("📦 Usando dados mock como fallback.");
    return getMockData(cleanPlate);
  }
}