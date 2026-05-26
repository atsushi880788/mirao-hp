const VALID_CODES = {
  '00111': '三島',
  '00112': '小川',
  '00113': '朝倉',
  '00114': '未割当',
  '00115': '未割当',
  '00116': '未割当',
  '00117': '未割当',
  '00118': '未割当',
  '00119': '未割当',
  '00120': '未割当',
};

async function kvCall(url, token, command) {
  const res = await fetch(`${url}/${command.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: 'コードが入力されていません' });

  const trimmedCode = code.trim();
  if (!VALID_CODES[trimmedCode]) {
    return res.status(200).json({ valid: false, message: '無効なコードです' });
  }

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    const now = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

    const entry = JSON.stringify({
      code: trimmedCode,
      referrer: VALID_CODES[trimmedCode],
      timestamp: now,
    });

    await kvCall(url, token, ['lpush', 'access_logs', encodeURIComponent(entry)]);
    await kvCall(url, token, ['incr', `count_${trimmedCode}`]);
  } catch (e) {
    console.error(e);
  }

  return res.status(200).json({ valid: true });
}
