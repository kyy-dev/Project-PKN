export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { nama, skor } = req.body;
    const token = process.env.GH_TOKEN; // Kunci yang kamu simpan di Vercel Settings
    const repo = 'kyy-dev/Project-PKN'; // Nama repo kamu

    try {
        // Ambil data lama dari GitHub
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/leaderboard.json`, {
            headers: { Authorization: `token ${token}` }
        });
        const fileData = await getRes.json();
        const content = JSON.parse(Buffer.from(fileData.content, 'base64').toString());

        // Tambah data baru & urutkan
        content.push({ nama, skor });
        content.sort((a, b) => b.skor - a.skor);
        const updatedContent = Buffer.from(JSON.stringify(content.slice(0, 5), null, 2)).toString('base64');

        // Update (Commit) balik ke GitHub
        await fetch(`https://api.github.com/repos/${repo}/contents/leaderboard.json`, {
            method: 'PUT',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Update skor: ${nama}`,
                content: updatedContent,
                sha: fileData.sha 
            })
        });

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
