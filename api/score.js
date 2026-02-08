export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { nama, skor } = req.body;
  const token = process.env.GH_TOKEN;
  const repo = "kyy-dev/Project-PKN"; // Pastikan ini username/repo kamu
  const path = "leaderboard.json";

  try {
    // 1. Ambil data lama dari GitHub
    const getFile = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${token}` }
    });
    const fileData = await getFile.json();
    
    // Decode isi file lama
    let currentData = [];
    if (fileData.content) {
      const contentStr = Buffer.from(fileData.content, 'base64').toString();
      currentData = JSON.parse(contentStr);
    }

    // 2. Tambah skor baru
    currentData.push({ nama, skor, tanggal: new Date().toISOString() });
    
    // Urutkan skor tertinggi di atas
    currentData.sort((a, b) => b.skor - a.skor);

    // 3. Kirim balik ke GitHub
    const updateFile = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update skor: ${nama}`,
        content: Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64'),
        sha: fileData.sha // Ini sangat penting!
      })
    });

    if (updateFile.ok) {
      res.status(200).json({ message: 'Berhasil simpan skor!' });
    } else {
      const errorDetail = await updateFile.json();
      res.status(500).json({ error: 'Gagal update GitHub', detail: errorDetail });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
