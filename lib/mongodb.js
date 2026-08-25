import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "telegram_bot";

if (!uri) {
  throw new Error("Falta la variable de entorno MONGODB_URI");
}

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
