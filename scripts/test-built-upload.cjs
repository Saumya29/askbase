// Run after npm run build. Services are local fakes; no real API keys are used.
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const server = createServer(async (req, res) => {
  let data = ''; for await (const chunk of req) data += chunk;
  const body = data ? JSON.parse(data) : null;
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/v1/embeddings') return res.end(JSON.stringify({data: body.input.map((_, index) => ({index, embedding: Array(1536).fill(0.1)})), usage:{prompt_tokens:10,total_tokens:10}}));
  if (req.url.startsWith('/rest/v1/documents')) return res.end(JSON.stringify({id:'fixture-document'}));
  if (req.url.startsWith('/rest/v1/chunks')) { res.statusCode=201; return res.end(''); }
  res.statusCode=404; res.end(JSON.stringify({error:'Unexpected test request'}));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.OPENAI_API_KEY='fixture-key'; process.env.OPENAI_BASE_URL=base+'/v1';
  process.env.SUPABASE_URL=base; process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-key';
  try {
    const built = await require('../.next/server/app/api/upload/route.js');
    for (const filename of ['Harbour_AI_Product_Brief.pdf','Harbour_AI_Pilot_Results.pdf','Harbour_AI_Safety_Policy.pdf']) {
      const form = new FormData();
      form.set('file',new File([readFileSync(`public/sample-documents/${filename}`)],filename,{type:'application/pdf'}));
      const response = await built.routeModule.userland.POST(new Request(base+'/api/upload',{method:'POST',body:form}));
      const body = await response.json();
      assert.equal(response.status,200,JSON.stringify(body)); assert.ok(body.chunks>=2);
      console.log(`Compiled route passed: ${filename}, ${body.chunks} chunks`);
    }
  } finally { server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
