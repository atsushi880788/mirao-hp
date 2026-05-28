import { kv } from '@vercel/kv';

// デフォルトのコード（KVに名前がない場合のフォールバック）
const DEFAULT_CODES = {
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

async function getCodeNames() {
  const saved = await kv.get('code_names');
  if (saved && typeof saved === 'object') {
    return { ...DEFAULT_CODES, ...saved };
  }
  return { ...DEFAULT_CODES };
}

export default async function handler(req, res) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, message: 'コードが入力されていません' });
  }

  const trimmedCode = code.trim();

  // KVから最新の紹介者名を取得
  let codeNames;
  try {
    codeNames = await getCodeNames();
  } catch {
    codeNames = { ...DEFAULT_CODES };
  }

  // コードの有効性チェック
  if (!codeNames[trimmedCode]) {
    return res.status(200).json({ valid: false, message: '無効なコードです' });
  }

  // ログを記録
  try {
    const now = new Date().toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const logEntry = {
      code: trimmedCode,
      referrer: codeNames[trimmedCode],
      timestamp: now,
      ip: req.headers['x-forwarded-for'] || 'unknown',
    };

    // KVにログを追加（リスト形式）
    await kv.lpush('access_logs', JSON.stringify(logEntry));

    // コードごとのカウントも記録
    await kv.incr(`count_${trimmedCode}`);

    return res.status(200).json({
      valid: true,
      message: 'アクセスを受け付けました',
    });
  } catch (error) {
    console.error('KV error:', error);
    // KVエラーでも認証は通過させる
    return res.status(200).json({
      valid: true,
      message: 'アクセスを受け付けました',
    });
  }
}
