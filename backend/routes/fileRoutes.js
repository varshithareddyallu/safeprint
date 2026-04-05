const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mime = require('mime-types');
const ptp = require('pdf-to-printer');
const muhammara = require('muhammara');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// In-memory store for file metadata
const fileStore = {}; // code -> { diskFilename, originalName, key, iv, pdfPassword }

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload & Encrypt File (Single)
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const code = crypto.randomBytes(4).toString('hex');
  const diskFilename = `${code}-${crypto.randomBytes(8).toString('hex')}${path.extname(req.file.originalname)}`;
  const filepath = path.join(uploadDir, diskFilename);

  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(req.file.buffer), cipher.final()]);

  fs.writeFileSync(filepath, encrypted);

  // Store metadata in memory
  fileStore[code] = {
    diskFilename,
    originalName: req.file.originalname,
    key: key.toString('hex'),
    iv: iv.toString('hex'),
    pdfPassword: req.body.password || null,
  };

  res.json({ code });
});

// Stream & Decrypt File for Viewing
router.get('/download/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const fileData = fileStore[code];

  if (!fileData) {
    return res.status(404).json({ error: 'Invalid code. File may have been downloaded already.' });
  }

  const filepath = path.join(uploadDir, fileData.diskFilename);

  if (!fs.existsSync(filepath)) {
    delete fileStore[code];
    return res.status(404).json({ error: 'File not found on server.' });
  }

  const mimeType = mime.lookup(fileData.originalName) || 'application/octet-stream';
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `inline; filename="${fileData.originalName}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });

  if (fileData.pdfPassword && mimeType === 'application/pdf') {
    // Needs to remove PDF password for preview
    const encrypted = fs.readFileSync(filepath);
    const decipherSync = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));
    const decrypted = Buffer.concat([decipherSync.update(encrypted), decipherSync.final()]);
    
    const tmpFile = path.join(os.tmpdir(), `safeprint_prev_${code}.pdf`);
    const unencryptedFile = path.join(os.tmpdir(), `safeprint_prev_open_${code}.pdf`);
    
    fs.writeFileSync(tmpFile, decrypted);
    
    try {
        muhammara.recrypt(tmpFile, unencryptedFile, { password: fileData.pdfPassword });
        fs.unlinkSync(tmpFile);
        
        const readStream = fs.createReadStream(unencryptedFile);
        readStream.on('error', (err) => {
            console.error('File read stream error:', err);
            if (!res.headersSent) res.status(500).send('Error reading file.');
        });
        readStream.on('close', () => {
            if (fs.existsSync(unencryptedFile)) fs.unlinkSync(unencryptedFile);
        });
        readStream.pipe(res);
        return;
    } catch (err) {
        console.error('Failed to decrypt PDF preview with provided password:', err);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        if (fs.existsSync(unencryptedFile)) fs.unlinkSync(unencryptedFile);
        if (!res.headersSent) res.status(500).send('Error decrypting PDF preview. Incorrect password?');
        return;
    }
  }

  // Normal stream
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));
  const readStream = fs.createReadStream(filepath);
  readStream.pipe(decipher).pipe(res);
});

// Direct Print
router.post('/print/:code', async (req, res) => {
  const code = req.params.code.toLowerCase();
  const fileData = fileStore[code];

  if (!fileData) return res.status(404).json({ error: 'Invalid code' });

  const filepath = path.join(uploadDir, fileData.diskFilename);
  const encrypted = fs.readFileSync(filepath);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  const ext = path.extname(fileData.originalName) || '.pdf';
  let tmpFile = path.join(os.tmpdir(), `safeprint_${code}${ext}`);
  fs.writeFileSync(tmpFile, decrypted);

  if (fileData.pdfPassword && ext.toLowerCase() === '.pdf') {
    const unencryptedFile = path.join(os.tmpdir(), `safeprint_open_${code}${ext}`);
    try {
        muhammara.recrypt(tmpFile, unencryptedFile, { password: fileData.pdfPassword });
        fs.unlinkSync(tmpFile);
        tmpFile = unencryptedFile;
    } catch (err) {
        console.error('Failed to decrypt PDF with provided password:', err);
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return res.status(400).json({ error: 'Incorrect PDF password or unable to decrypt.' });
    }
  }

  try {
    await ptp.print(tmpFile);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    delete fileStore[code];
    return res.json({ success: true, message: 'Document sent to printer successfully.' });
  } catch (err) {
    console.error('Print error:', err);
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    return res.status(503).json({ error: 'Failed to send to printer.' });
  }
});

module.exports = router;