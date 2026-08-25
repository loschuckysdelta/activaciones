import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  const telegramId = String(req.query.id || "").trim();

  if (!telegramId) {
    return res.status(400).json({
      success: false,
      message: "Falta id de Telegram"
    });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne({ telegramId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username || "",
        credits: user.credits || 0,
        days: user.days || 0,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}
