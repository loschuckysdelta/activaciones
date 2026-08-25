import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Método no permitido" });
  }

  try {
    const telegramId = String(req.body?.telegramId || "").trim();
    const type = String(req.body?.type || "").trim().toLowerCase();
    const amount = Number(req.body?.amount);

    if (!telegramId) {
      return res.status(400).json({ success: false, message: "telegramId es obligatorio" });
    }

    if (!["credits", "days"].includes(type)) {
      return res.status(400).json({ success: false, message: "type debe ser credits o days" });
    }

    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: "amount debe ser 0 o un entero positivo" });
    }

    const db = await getDb();
    const users = db.collection("users");
    const now = new Date();

    const field = {};
    field[type] = amount;

    await users.updateOne(
      { telegramId },
      {
        $setOnInsert: {
          telegramId,
          credits: 0,
          days: 0,
          createdAt: now
        },
        $set: {
          ...field,
          updatedAt: now
        }
      },
      { upsert: true }
    );

    const user = await users.findOne({ telegramId });

    return res.status(200).json({
      success: true,
      message: `${type} actualizado`,
      user: {
        telegramId: user.telegramId,
        username: user.username || "",
        credits: user.credits || 0,
        days: user.days || 0
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
