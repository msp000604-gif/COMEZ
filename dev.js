import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2),port=Number(args[args.indexOf('--port')+1])||3000;
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve('.','.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(process.cwd()+path.sep))throw new Error();const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'})[path.extname(file)]||'text/plain; charset=utf-8');res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(port,'0.0.0.0');
