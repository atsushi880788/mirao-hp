import { kv } from '@vercel/kv';

// 有効なコード一覧（コードの有効性チェックにのみ使用）。
// 紹介者名の解決は「参照型」に変更したため、ここでは名前を持たない。
// 名前は admin.js が code_map に保存し、表示時（admin.js）に code_map から解決する。
const VALID_CODES = [
  '00111', '00112', '00113', '00114', '00115',
  '00116', '00117', '00118', '00119', '00120',
];

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

  // コードの有効性チェック（名前は解決しない。存在チェックのみ）
  if (!VALID_CODES.includes(trimmedCode)) {
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

    // 参照型：名前は焼き付けない。コード番号（と日時・IP）のみ保存する。
    // 表示時に admin.js が code から現在の登録名（code_map）を解決するため、
    // 後から名前を登録すれば過去ログも最新の名前で表示される。
    const logEntry = {
      code: trimmedCode,
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
