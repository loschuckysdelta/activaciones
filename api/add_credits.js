import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const telegramId = String(req.body?.telegramId || "").trim();
    const amount = Number(req.body?.amount);

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId es obligatorio" });
    }

    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "amount debe ser un entero mayor que 0" });
    }

    const db = await getDb();
    const users = db.collection("users");
    const now = new Date();

    // No incluimos credits en $setOnInsert porque también se modifica con $inc.
    await users.updateOne(
      { telegramId },
      {
        $setOnInsert: {
          telegramId,
          username: "",
          days: 0,
          createdAt: now
        },
        $inc: { credits: amount },
        $set: { updatedAt: now }
      },
      { upsert: true }
    );

    const user = await users.findOne({ telegramId });

    return res.status(200).json({
      success: true,
      message: `Se agregaron ${amount} créditos`,
      user: {
        telegramId: user.telegramId,
        username: user.username || "",
        credits: Number(user.credits) || 0,
        days: Number(user.days) || 0
      }
    });
  } catch (error) {
    console.error("[add_credits]", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}
