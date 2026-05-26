import { kv } from '@vercel/kv';

const ADMIN_PASSWORD = 'Froption88';

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

export default async function handler(req, res) {
  const { password } = req.query;

  if (password !== ADMIN_PASSWORD) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send(`
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MIRAO 管理</title>
<style>
  body { background: #0D0C0A; color: #EAE4DA; font-family: 'Jost', sans-serif;
    display: flex; align-items: center; justify-content: center; min-height: 100vh;
    margin: 0; }
  .box { text-align: center; }
  h1 { font-size: 1.5rem; font-weight: 200; letter-spacing: 0.3em; margin-bottom: 2rem; color: #9B4A38; }
  input { background: transparent; border: none; border-bottom: 1px solid #5C2D22;
    color: #EAE4DA; padding: 0.6rem 0; font-size: 1rem; letter-spacing: 0.2em;
    text-align: center; width: 200px; outline: none; display: block; margin: 0 auto 1.5rem; }
  button { background: transparent; border: 1px solid #5C2D22; color: #9B4A38;
    padding: 0.6rem 2rem; font-size: 0.7rem; letter-spacing: 0.3em; cursor: pointer; }
  button:hover { background: #7A3B2E; color: #0D0C0A; }
</style>
</head>
<body>
<div class="box">
  <h1>MIRAO ADMIN</h1>
  <form onsubmit="location.href='/api/admin?password='+document.getElementById('pw').value;return false;">
    <input id="pw" type="password" placeholder="パスワード">
    <button type="submit">入　る</button>
  </form>
</div>
</body>
</html>
    `);
  }

  let logs = [];
  let counts = {};

  try {
    const rawLogs = await kv.lrange('access_logs', 0, 199);
    logs = rawLogs.map(l => {
      try { return JSON.parse(l); }
      catch { return null; }
    }).filter(Boolean);

    for (const code of Object.keys(VALID_CODES)) {
      const count = await kv.get(`count_${code}`);
      counts[code] = count || 0;
    }
  } catch (error) {
    console.error('KV error:', error);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MIRAO 管理画面</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0D0C0A; color: #EAE4DA;
    font-family: 'Noto Sans JP', sans-serif; font-weight: 300;
    padding: 2rem; min-height: 100vh; }
  h1 { font-family: 'Jost', sans-serif; font-size: 1.2rem; font-weight: 200;
    letter-spacing: 0.4em; color: #9B4A38; margin-bottom: 2.5rem; }
  h2 { font-size: 0.65rem; letter-spacing: 0.3em; color: #524D48;
    margin: 2rem 0 0.8rem; }
  .summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.8rem; margin-bottom: 2.5rem; }
  .summary-card { border: 1px solid rgba(122,59,46,0.2); padding: 0.9rem 1rem; }
  .s-code { font-family: 'Jost', sans-serif; font-size: 1rem; font-weight: 200;
    color: #9B4A38; display: block; margin-bottom: 0.2rem; }
  .s-name { font-size: 0.65rem; color: #524D48; letter-spacing: 0.1em;
    display: block; margin-bottom: 0.5rem; }
  .s-count { font-family: 'Jost', sans-serif; font-size: 1.8rem; font-weight: 200;
    color: #EAE4DA; }
  .s-unit { font-size: 0.6rem; color: #524D48; margin-left: 0.3rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  th { font-size: 0.58rem; letter-spacing: 0.15em; color: #524D48;
    text-align: left; padding: 0.5rem 0.8rem;
    border-bottom: 1px solid rgba(122,59,46,0.15); }
  td { padding: 0.65rem 0.8rem; border-bottom: 1px solid rgba(122,59,46,0.07);
    color: #8A837A; }
  td.code { font-family: 'Jost', sans-serif; color: #9B4A38; font-weight: 300; }
  td.name { color: #EAE4DA; }
  tr:hover td { background: rgba(122,59,46,0.04); }
  .empty { text-align: center; color: #524D48; padding: 2rem;
    font-size: 0.7rem; letter-spacing: 0.2em; }
  .total { font-size: 0.6rem; color: #524D48; letter-spacing: 0.15em;
    margin-bottom: 0.8rem; }
</style>
</head>
<body>

<h1>MIRAO — ADMIN</h1>

<h2>コード別アクセス数</h2>
<div class="summary">
  ${Object.entries(VALID_CODES).map(([code, name]) => `
    <div class="summary-card">
      <span class="s-code">${code}</span>
      <span class="s-name">${name}</span>
      <span class="s-count">${counts[code] || 0}<span class="s-unit">回</span></span>
    </div>
  `).join('')}
</div>

<h2>アクセスログ（最新200件）</h2>
<p class="total">合計 ${logs.length} 件</p>

${logs.length === 0 ? '<p class="empty">まだアクセスログがありません</p>' : `
<table>
  <thead>
    <tr>
      <th>日時</th>
      <th>コード</th>
      <th>紹介者</th>
    </tr>
  </thead>
  <tbody>
    ${logs.map(log => `
      <tr>
        <td>${log.timestamp}</td>
        <td class="code">${log.code}</td>
        <td class="name">${log.referrer}</td>
      </tr>
    `).join('')}
  </tbody>
</table>
`}

</body>
</html>
  `);
}
