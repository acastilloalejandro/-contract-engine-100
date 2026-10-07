export function json(res,status,payload){
  res.statusCode=status;
  res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("cache-control","no-store");
  res.end(JSON.stringify(payload));
}
export async function readJson(req){
  let raw="";
  for await(const chunk of req) raw+=chunk;
  if(raw.length>1_000_000) throw new Error("Payload too large");
  return raw?JSON.parse(raw):{};
}
export function method(req,expected){
  if(req.method!==expected){return false;}
  return true;
}
export function requireEnv(name){
  const value=process.env[name];
  if(!value) throw new Error("Missing server configuration: "+name);
  return value;
}
