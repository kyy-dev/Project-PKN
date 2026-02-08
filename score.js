export default async function handler(req, res) { // Pakai huruf kecil 'export'
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { nama, skor } = req.body;
    const token = process.env.GH_TOKEN;
    const repo = 'kyy-dev/Project-PKN';

    try {
        // 1. Ambil data dari GitHub
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/leaderboard.json`, {
            headers: { Authorization: `token ${token}` }
        });
        
        const fileData = await getRes.json();
        
        // 2. Dekode konten (tambahkan pengaman jika JSON kosong)
        let content = [];
        if (fileData.content) {
            const decoded = Buffer.from(fileData.content, 'base64').toString();
            content = JSON.parse(decoded || "[]");
        }

        // 3. Tambah skor baru & urutkan Top 5
        content.push({ nama, skor });
        content.sort((a, b) => b.skor - a.skor);
        const topFive = content.slice(0, 5);
        
        // 4. Encode kembali ke Base64
        const updatedContent = Buffer.from(JSON.stringify(topFive, null, 2)).toString('base64');

        // 5. Push kembali ke GitHub
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/leaderboard.json`, {
            method: 'PUT',
            headers: { 
                Authorization: `token ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: `🏆 Skor Baru: ${nama} (${skor})`,
                content: updatedContent,
                sha: fileData.sha // Penting untuk update file yang sama
            })
        });

        if (putRes.ok) {
            res.status(200).json({ success: true, message: "Papan peringkat diperbarui!" });
        } else {
            const errorText = await putRes.text();
            throw new Error(errorText);
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}
