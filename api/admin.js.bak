const DEFAULT_CODES =   {
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

const ADMIN_PASSWORD = 'Froption88';
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function kvGet(key) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${key}/${encodeURIComponent(value)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

async function kvLrange(key, start, stop) {
  const res = await fetch(`${KV_URL}/lrange/${key}/${start}/${stop}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result || [];
}

async function getCodeMap() {
  try {
    const raw = await kvGet('code_map');
    if (raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_CODES, ...parsed };
      }
    }
  } catch (e) {
    console.error('getCodeMap error:', e);
  }
  return { ...DEFAULT_CODES };
}

export default async function handler(req, res) {
  // POST: 個別コードの名前保存
  if (req.method === 'POST') {
    const { password, code, name } = req.body;
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: '認証エラー' });
    }
    if (!code || !DEFAULT_CODES.hasOwnProperty(code)) {
      return res.status(400).json({ error: '無効なコード' });
    }
    const newName = (name || '').trim() || '未割当';
    try {
      const current = await getCodeMap();
      current[code] = newName;
      await kvSet('code_map', JSON.stringify(current));
      return res.status(200).json({ ok: true, name: newName });
    } catch (e) {
      console.error('Save error:', e);
      return res.status(500).json({ error: '保存に失敗しました' });
    }
  }

  // GET: 管理画面
  const { password } = req.query;

  if (password !== ADMIN_PASSWORD) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MIRAO 管理</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Noto+Sans+JP:wght@200;300;400&display=swap" rel="stylesheet">
<style>
  body { background:#0D0C0A; color:#EAE4DA; font-family:'Jost',sans-serif;
    display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .box { text-align:center; }
  h1 { font-size:1.5rem; font-weight:200; letter-spacing:0.3em; margin-bottom:2rem; color:#9B4A38; }
  input { background:transparent; border:none; border-bottom:1px solid #5C2D22;
    color:#EAE4DA; padding:0.6rem 0; font-size:1rem; letter-spacing:0.2em;
    text-align:center; width:200px; outline:none; display:block; margin:0 auto 1.5rem; }
  button { background:transparent; border:1px solid #5C2D22; color:#9B4A38;
    padding:0.6rem 2rem; font-size:0.7rem; letter-spacing:0.3em; cursor:pointer; }
  button:hover { background:#7A3B2E; color:#0D0C0A; }
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
</html>`);
  }

  // 認証OK — データ取得
  let codeMap = { ...DEFAULT_CODES };
  let logs = [];
  let counts = {};

  try {
    codeMap = await getCodeMap();
  } catch (e) {
    console.error('codeMap error:', e);
  }

  try {
    const rawLogs = await kvLrange('access_logs', 0, 199);
    logs = rawLogs.map(l => {
      try { return typeof l === 'string' ? JSON.parse(l) : l; }
      catch { return null; }
    }).filter(Boolean);
  } catch (e) {
    console.error('logs error:', e);
  }

  try {
    for (const code of Object.keys(DEFAULT_CODES)) {
      const c = await kvGet(`count_${code}`);
      counts[code] = c || 0;
    }
  } catch (e) {
    console.error('counts error:', e);
  }

  // コード管理テーブル行
  const codeRows = Object.keys(DEFAULT_CODES).map(code => `
    <tr id="row-${code}">
      <td class="c-code">${code}</td>
      <td class="c-current" id="cur-${code}">${esc(codeMap[code] || '未割当')}</td>
      <td><input class="c-input" id="inp-${code}" value="${esc(codeMap[code] || '未割当')}"></td>
      <td><button class="c-save" onclick="saveName('${code}')">保存</button></td>
      <td class="c-count">${counts[code] || 0}回</td>
      <td class="c-msg" id="msg-${code}"></td>
    </tr>
  `).join('');

  // ログ行
  const logRows = logs.map(log => `
    <tr>
      <td>${esc(log.timestamp || '')}</td>
      <td class="code">${esc(log.code || '')}</td>
      <td class="name">${esc(log.referrer || '')}</td>
    </tr>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MIRAO 管理画面</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Noto+Sans+JP:wght@200;300;400&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0D0C0A;color:#EAE4DA;font-family:'Noto Sans JP',sans-serif;font-weight:300;padding:2rem;min-height:100vh;}
  h1{font-family:'Jost',sans-serif;font-size:1.2rem;font-weight:200;letter-spacing:0.4em;color:#9B4A38;margin-bottom:2.5rem;}
  h2{font-size:0.65rem;letter-spacing:0.3em;color:#524D48;margin:2.5rem 0 0.8rem;text-transform:uppercase;}

  /* コード管理テーブル */
  .code-table{width:100%;border-collapse:collapse;margin-bottom:1rem;}
  .code-table th{font-size:0.58rem;letter-spacing:0.15em;color:#524D48;text-align:left;padding:0.5rem 0.8rem;border-bottom:1px solid rgba(122,59,46,0.15);}
  .code-table td{padding:0.6rem 0.8rem;border-bottom:1px solid rgba(122,59,46,0.07);vertical-align:middle;}
  .c-code{font-family:'Jost',sans-serif;font-size:1rem;font-weight:200;color:#9B4A38;white-space:nowrap;}
  .c-current{font-size:0.78rem;color:#8A837A;white-space:nowrap;}
  .c-input{background:transparent;border:none;border-bottom:1px solid rgba(122,59,46,0.25);color:#EAE4DA;font-size:0.78rem;letter-spacing:0.08em;padding:0.3rem 0;width:120px;outline:none;font-family:'Noto Sans JP',sans-serif;font-weight:300;}
  .c-input:focus{border-bottom-color:#9B4A38;}
  .c-save{background:transparent;border:1px solid #5C2D22;color:#9B4A38;padding:0.3rem 1rem;font-size:0.6rem;letter-spacing:0.2em;cursor:pointer;font-family:'Noto Sans JP',sans-serif;font-weight:300;transition:all 0.3s;white-space:nowrap;}
  .c-save:hover{background:#7A3B2E;color:#0D0C0A;}
  .c-save:disabled{opacity:0.4;cursor:default;}
  .c-count{font-family:'Jost',sans-serif;font-size:0.8rem;color:#EAE4DA;white-space:nowrap;}
  .c-msg{font-size:0.6rem;letter-spacing:0.1em;white-space:nowrap;}
  .c-msg.ok{color:#9B4A38;}
  .c-msg.err{color:#C44;}

  /* ログテーブル */
  .log-table{width:100%;border-collapse:collapse;font-size:0.75rem;}
  .log-table th{font-size:0.58rem;letter-spacing:0.15em;color:#524D48;text-align:left;padding:0.5rem 0.8rem;border-bottom:1px solid rgba(122,59,46,0.15);}
  .log-table td{padding:0.65rem 0.8rem;border-bottom:1px solid rgba(122,59,46,0.07);color:#8A837A;}
  .log-table .code{font-family:'Jost',sans-serif;color:#9B4A38;font-weight:300;}
  .log-table .name{color:#EAE4DA;}
  .log-table tr:hover td{background:rgba(122,59,46,0.04);}
  .total{font-size:0.6rem;color:#524D48;letter-spacing:0.15em;margin-bottom:0.8rem;}
  .empty{text-align:center;color:#524D48;padding:2rem;font-size:0.7rem;letter-spacing:0.2em;}
</style>
</head>
<body>

<h1>MIRAO — ADMIN</h1>

<h2>コード管理</h2>
<table class="code-table">
  <thead>
    <tr>
      <th>コード</th>
      <th>現在の名前</th>
      <th>変更</th>
      <th></th>
      <th>アクセス数</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    ${codeRows}
  </tbody>
</table>

<h2>アクセスログ（最新200件）</h2>
<p class="total">合計 ${logs.length} 件</p>

${logs.length === 0 ? '<p class="empty">まだアクセスログがありません</p>' : `
<table class="log-table">
  <thead>
    <tr><th>日時</th><th>コード</th><th>紹介者</th></tr>
  </thead>
  <tbody>
    ${logRows}
  </tbody>
</table>
`}

<script>
async function saveName(code) {
  var btn = document.querySelector('#row-' + code + ' .c-save');
  var inp = document.getElementById('inp-' + code);
  var msg = document.getElementById('msg-' + code);
  var cur = document.getElementById('cur-' + code);

  btn.disabled = true;
  btn.textContent = '保存中…';
  msg.textContent = '';
  msg.className = 'c-msg';

  try {
    var r = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '${ADMIN_PASSWORD}', code: code, name: inp.value.trim() }),
    });
    var data = await r.json();
    if (data.ok) {
      cur.textContent = data.name;
      msg.textContent = '保存しました';
      msg.className = 'c-msg ok';
    } else {
      msg.textContent = data.error || 'エラー';
      msg.className = 'c-msg err';
    }
  } catch (e) {
    msg.textContent = '通信エラー';
    msg.className = 'c-msg err';
  }

  btn.disabled = false;
  btn.textContent = '保存';
}
</script>

</body>
</html>`);
}
