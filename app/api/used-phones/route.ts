import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { pakistanPhone } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const schema=z.object({brand:z.string().min(1).max(60),model:z.string().min(1).max(100),storage:z.string().max(30),condition:z.enum(["Like new","Good","Fair","Needs repair"]),pta_approved:z.coerce.boolean(),expected_price:z.coerce.number().min(0).optional(),full_name:z.string().min(2).max(80),phone:pakistanPhone,city:z.string().max(80).optional(),details:z.string().max(1000).optional(),turnstile_token:z.string().trim().max(2048)});
export async function POST(request:Request){if(!hasSupabaseEnv)return NextResponse.json({error:"Database is not connected yet."},{status:503});const limited=rateLimitResponse(await checkRateLimit(request,"used-phone:create"));if(limited)return limited;const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Invalid request"},{status:400});if(!await verifyTurnstile(request,parsed.data.turnstile_token,"sell_phone"))return NextResponse.json({error:"Security verification failed. Please complete the challenge and try again."},{status:403});const requestData:Partial<typeof parsed.data>={...parsed.data};delete requestData.turnstile_token;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from("used_phone_requests").insert({...requestData,user_id:user?.id||null});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({success:true},{status:201})}
