import { getDb } from "../lib/mongodb.js";
import { requireAdmin } from "../lib/auth.js";
import { setSubscriptionDays, syncUserDays } from "../lib/subscription.js";

export default async function handler(req,res){
  if(!requireAdmin(req,res)) return;
  if(req.method!=="POST") return res.status(405).json({success:false,message:"Método no permitido"});
  try{
    const telegramId=String(req.body?.telegramId||"").trim(); const type=String(req.body?.type||"").trim().toLowerCase(); const amount=Number(req.body?.amount);
    if(!telegramId) return res.status(400).json({success:false,message:"telegramId es obligatorio"});
    if(!["credits","days"].includes(type)) return res.status(400).json({success:false,message:"type debe ser credits o days"});
    if(!Number.isInteger(amount)||amount<0) return res.status(400).json({success:false,message:"amount debe ser 0 o un entero positivo"});
    const db=await getDb(); const users=db.collection("users"); const now=new Date(); let user;
    if(type==="days") user=await setSubscriptionDays(users,telegramId,amount,now);
    else {
      await users.updateOne({telegramId},{ $setOnInsert:{telegramId,username:"",days:0,daysExpiresAt:null,createdAt:now}, $set:{credits:amount,updatedAt:now}},{upsert:true});
      user=await syncUserDays(users,await users.findOne({telegramId}),now);
    }
    return res.status(200).json({success:true,message:type==="credits"?"Créditos actualizados":"Días actualizados",user:{telegramId:user.telegramId,username:user.username||"",credits:Number(user.credits)||0,days:Number(user.days)||0,daysExpiresAt:user.daysExpiresAt||null}});
  }catch(error){console.error("[set]",error);return res.status(500).json({success:false,message:"Error interno del servidor"});}
}
