import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Falta GEMINI_API_KEY en el servidor"
    });
  }

  try {
    const { question, mode = "simple", notes = "", localKnowledge = [] } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Falta la pregunta" });
    }

    const localContext = Array.isArray(localKnowledge)
      ? localKnowledge.map((k) => `${k.title}: ${k.summary}`).join("\n")
      : "";

    const system = `
Sos Dr Chat, un asistente educativo privado para una persona que estudia Secretaría Administrativa en Salud.

Tu objetivo:
Explicar de manera simple contenidos de terminología médica, administración en instituciones de salud, obras sociales, atención al paciente, informática administrativa y prácticas médicas.

Reglas obligatorias:
- Respondé en español argentino claro y simple.
- No diagnostiques enfermedades.
- No indiques tratamientos médicos.
- No reemplaces a un médico.
- Si la pregunta parece una urgencia real, indicá consultar a guardia, emergencias o un profesional de salud.
- Usá la búsqueda de Google cuando haga falta verificar información.
- Cuando uses información externa, mencioná fuentes claras.
- Para temas de Argentina, priorizá fuentes oficiales argentinas cuando corresponda.
- Si no estás seguro, decilo.
- Estructura recomendada: Respuesta simple, ejemplo, para recordar, pregunta de repaso.
- Modo actual: ${mode}.
`;

    const prompt = `
${system}

Pregunta del usuario:
${question}

Apuntes personales pegados por el usuario:
${notes || "Sin apuntes personales."}

Base local resumida del curso:
${localContext || "Sin base local."}

Respondé como material de estudio.
Si corresponde, agregá una pregunta corta para practicar.
`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [
          {
            googleSearch: {}
          }
        ]
      }
    });

    const answer = response.text || "No se recibió respuesta.";

    return res.status(200).json({
      answer
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error generando respuesta con Gemini",
      detail: error?.message || "Error desconocido"
    });
  }
}
