async function testFetch() {
  try {
    console.log("Starting fetch to n8n webhook...");
    const res = await fetch('https://n8n.srv1214309.hstgr.cloud/webhook/disparo-manual-planilha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'iniciar',
        nome_campanha: 'teste luan disparo ilunia',
        tipo_campanha: 'prospeccao',
        template_id: 'ilunia_v2',
      }),
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testFetch();
