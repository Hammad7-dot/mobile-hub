import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { pakistanPhone } from "@/lib/validation";

const schema=z.object({brand:z.string().min(1).max(60),model:z.string().min(1).max(100),storage:z.string().max(30),condition:z.enum(["Like new","Good","Fair","Needs repair"]),pta_approved:z.coerce.boolean(),expected_price:z.coerce.number().min(0).optional(),full_name:z.string().min(2).max(80),phone:pakistanPhone,city:z.string().max(80).optional(),details:z.string().max(1000).optional()});
export async function POST(request:Request){if(!hasSupabaseEnv)return NextResponse.json({error:"Database is not connected yet."},{status:503});const parsed=schema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Invalid request"},{status:400});const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from("used_phone_requests").insert({...parsed.data,user_id:user?.id||null});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({success:true},{status:201})}
