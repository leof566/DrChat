import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Falta OPENAI_API_KEY en el servidor" });
  }

  try {
    const { question, mode = "simple", notes = "", localKnowledge = [] } = req.body || {};

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Falta la pregunta" });
    }

    const tools = [
      {
        type: "web_search"
      }
    ];

    if (process.env.OPENAI_VECTOR_STORE_ID) {
      tools.push({
        type: "file_search",
        vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID],
        max_num_results: 5
      });
    }

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
- Cuando uses información externa, mencioná la fuente de forma clara.
- Para temas de Argentina, priorizá fuentes oficiales argentinas cuando corresponda.
- Si no estás seguro, decilo y explicá qué habría que verificar.
- Estructura recomendada: Respuesta simple, ejemplo, para recordar, pregunta de repaso.
- Modo actual: ${mode}.
`;

    const localContext = Array.isArray(localKnowledge)
      ? localKnowledge.map((k) => `${k.title}: ${k.summary}`).join("\n")
      : "";

    const input = [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: `
Pregunta del usuario:
${question}

Apuntes personales pegados por el usuario:
${notes || "Sin apuntes personales."}

Base local resumida del curso:
${localContext || "Sin base local."}

Instrucción extra:
Respondé como material de estudio. Si corresponde, agregá una pregunta corta para practicar.
`
      }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input,
      tools,
      tool_choice: "auto"
    });

    return res.status(200).json({
      answer: response.output_text || "No se recibió respuesta."
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error generando respuesta",
      detail: error?.message || "Error desconocido"
    });
  }
}
