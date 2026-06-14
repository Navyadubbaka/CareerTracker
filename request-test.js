const base = `http://localhost:${process.env.PORT || 3000}`;

async function test() {
  try {
    const postRes = await fetch(`${base}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `test note ${new Date().toISOString()}` }),
    });
    console.log('POST status', postRes.status);
    try { console.log('POST body', await postRes.json()); } catch(e){ console.log('POST no json body'); }

    const getRes = await fetch(`${base}/notes`);
    console.log('GET status', getRes.status);
    console.log('GET body', await getRes.json());
  } catch (err) {
    console.error('Request error:', err.message);
  }
}

test();
