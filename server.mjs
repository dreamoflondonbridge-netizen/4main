import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)||!['.html','.css','.js'].includes(path.extname(file))) {res.writeHead(404);return res.end();}const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[path.extname(file)]);res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('글가람 서버 준비 완료'));
