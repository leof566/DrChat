import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const filePath = process.argv[2];
if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY. Creá un archivo .env o configurá la variable en la terminal.");
  process.exit(1);
}
if (!filePath) {
  console.error("Uso: npm run upload:pdf -- ./mi-libro.pdf");
  process.exit(1);
}
if (!fs.existsSync(filePath)) {
  console.error(`No existe el archivo: ${filePath}`);
  process.exit(1);
}

const name = `Dr Chat - ${path.basename(filePath)}`;
console.log(`Creando vector store: ${name}`);
const vectorStore = await client.vectorStores.create({ name });

console.log("Subiendo PDF y esperando procesamiento...");
const stream = fs.createReadStream(filePath);
await client.vectorStores.files.uploadAndPoll(vectorStore.id, stream);

console.log("Listo.");
console.log(`OPENAI_VECTOR_STORE_ID=${vectorStore.id}`);
console.log("Pegá ese valor en Vercel > Settings > Environment Variables.");
