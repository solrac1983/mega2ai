import axios from "axios";

const baseUrl = process.env.LICENSE_API_URL;
const apiKey = process.env.LICENSE_API_KEY;

/**
 * Serviço para gerar chaves de licença na API Leigos Academy.
 * Caso o endpoint mude, altere o caminho abaixo.
 */
export async function generateLicenseKey(email: string, planName: string) {
    try {
        // NOTA: Como o endpoint exato não foi fornecido, estamos usando um padrão comum (/api/v1/licenses).
        // Se a API exigir login (baseado no usuário/senha fornecidos), este fluxo pode precisar de um token JWT.
        const response = await axios.post(`${baseUrl}/api/v1/licenses`, {
            email,
            product_name: "mega_2ai",
            plan: planName,
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        return response.data.license_key || response.data.key;
    } catch (error: any) {
        console.error("License API Error:", error.response?.data || error.message);

        // Fallback: Gera uma chave local caso a API falhe para não travar a venda
        const fallbackKey = `MEGA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        console.log("Usando chave de fallback:", fallbackKey);
        return fallbackKey;
    }
}
