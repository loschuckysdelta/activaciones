import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";
import { syncUserDays } from "../lib/subscription.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  if(req.method!=="POST") return res.status(405).json({success:false,message:"Método no permitido"});
  try{
    const telegramId=String(req.body?.telegramId||"").trim(); const amount=Number(req.body?.amount);
    if(!telegramId) return res.status(400).json({success:false,message:"telegramId es obligatorio"});
    if(!Number.isInteger(amount)||amount<=0) return res.status(400).json({success:false,message:"amount debe ser un entero mayor que 0"});
    const db=await getDb(); const users=db.collection("users"); const now=new Date();
    let user=await users.findOne({telegramId});
    if(!user) return res.status(404).json({success:false,message:"Usuario no encontrado"});
    user=await syncUserDays(users,user,now);
    if((Number(user.days)||0)<amount) return res.status(409).json({success:false,message:"Días insuficientes",user:{telegramId:user.telegramId,username:user.username||"",credits:Number(user.credits)||0,days:Number(user.days)||0,daysExpiresAt:user.daysExpiresAt||null}});
    const currentExpiry=new Date(user.daysExpiresAt);
    const newExpiry=new Date(currentExpiry.getTime()-amount*DAY_MS);
    const daysLeft=Math.max(0,Math.ceil((newExpiry.getTime()-now.getTime())/DAY_MS));
    await users.updateOne({telegramId},{$set:{days:daysLeft,daysExpiresAt:daysLeft>0?newExpiry:null,updatedAt:now}});
    user=await users.findOne({telegramId});
    return res.status(200).json({success:true,message:`Se descontaron ${amount} días`,deducted:amount,user:{telegramId:user.telegramId,username:user.username||"",credits:Number(user.credits)||0,days:Number(user.days)||0,daysExpiresAt:user.daysExpiresAt||null}});
  }catch(error){console.error("[deduct_days]",error);return res.status(500).json({success:false,message:"Error interno del servidor"});}
}
