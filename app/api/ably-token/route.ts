import Ably from "ably";

export const revalidate = 0; 
export async function GET(request: Request) {
  // ดึง API Key จาก Environment Variable ที่ตั้งไว้ใน Vercel/Netlify
  const client = new Ably.Rest("NNy6aQ.31gugA:CyLvESI8EPPyWjKld3-kjGGZhW6d2bEce-Mz2x-0l08");
  const tokenRequestData = await client.auth.createTokenRequest({
    clientId: "patient", // ID เฉพาะสำหรับผู้ใช้งานแต่ละคน
  });
  return Response.json(tokenRequestData);
}