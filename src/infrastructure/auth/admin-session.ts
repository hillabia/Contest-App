import "server-only";
import { serverDatabase } from "../supabase/server";
/** Verify an actual Supabase Auth access token and fixed administrator identity. */
export async function requireAdmin(request:Request):Promise<boolean>{
 const header=request.headers.get("authorization");
 if(!header?.startsWith("Bearer "))return false;
 const token=header.slice(7);
 if(token.length<20||token.length>8192)return false;
 const adminId=process.env.CONTEST_ADMIN_USER_ID;
 if(!adminId||!/^[0-9a-f-]{36}$/i.test(adminId))return false;
 const {data,error}=await serverDatabase().auth.getUser(token);
 return !error && data.user?.id===adminId && data.user?.is_anonymous!==true;
}
