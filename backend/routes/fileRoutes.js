const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mime = require('mime-types');
const ptp = require('pdf-to-printer');
const muhammara = require('muhammara');
const shopRoutes = require('./shopRoutes');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// In-memory store for file metadata
// code -> { comment, files: [{ diskFilename, originalName, key, iv, pdfPassword, encrypted }] }
const fileStore = {};

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload & Encrypt Multiple Files
router.post('/upload', upload.array('files', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const code = crypto.randomBytes(4).toString('hex');

  // Parse metadata sent as JSON string from frontend
  let metadata = {};
  try {
    metadata = JSON.parse(req.body.metadata || '{}');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid metadata format' });
  }

  const encryptionPrefs = metadata.encryptionPrefs || []; // [{ encrypt: bool, isPasswordProtected: bool, password: string }]
  const comment = metadata.comment || '';

  const filesData = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const prefs = encryptionPrefs[i] || {};
    const shouldEncrypt = prefs.encrypt !== false; // Default to true for safety
    const pdfPassword = prefs.isPasswordProtected ? (prefs.password || null) : null;

    const diskFilename = `${code}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadDir, diskFilename);

    if (shouldEncrypt) {
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      const encrypted = Buffer.concat([cipher.update(file.buffer), cipher.final()]);
      fs.writeFileSync(filepath, encrypted);

      filesData.push({
        diskFilename,
        originalName: file.originalname,
        key: key.toString('hex'),
        iv: iv.toString('hex'),
        pdfPassword,
        encrypted: true,
      });
    } else {
      // Store file as-is (no AES encryption)
      fs.writeFileSync(filepath, file.buffer);

      filesData.push({
        diskFilename,
        originalName: file.originalname,
        key: null,
        iv: null,
        pdfPassword,
        encrypted: false,
      });
    }
  }

  fileStore[code] = {
    comment,
    files: filesData,
  };

  // --- 10 MINUTE AUTO-DELETE TIMER ---
  setTimeout(() => {
    if (fileStore[code]) {
      console.log(`[Auto-Delete] 10 minutes passed. Deleting files for code: ${code}`);
      const batchData = fileStore[code];
      
      // Delete all files on disk
      batchData.files.forEach(f => {
        const fp = path.join(uploadDir, f.diskFilename);
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
          console.log(`  -> Deleted: ${f.diskFilename}`);
        }
      });

      // Remove from memory
      delete fileStore[code];
    }
  }, 10 * 60 * 1000); // 10 minutes

  res.json({ code });
});

// Get batch info (file list + comment)
router.get('/info/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const batch = fileStore[code];

  if (!batch) {
    return res.status(404).json({ error: 'Invalid code. Files may have been printed already.' });
  }

  const fileList = batch.files.map((f, i) => ({
    index: i,
    name: f.originalName,
    encrypted: f.encrypted,
  }));

  res.json({
    comment: batch.comment,
    files: fileList,
  });
});

// Stream & Decrypt individual file for Viewing
router.get('/download/:code/:index', (req, res) => {
  const code = req.params.code.toLowerCase();
  const index = parseInt(req.params.index, 10);
  const batch = fileStore[code];

  if (!batch) {
    return res.status(404).json({ error: 'Invalid code. Files may have been printed already.' });
  }

  if (isNaN(index) || index < 0 || index >= batch.files.length) {
    return res.status(400).json({ error: 'Invalid file index.' });
  }

  const fileData = batch.files[index];
  const filepath = path.join(uploadDir, fileData.diskFilename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found on server.' });
  }

  const mimeType = mime.lookup(fileData.originalName) || 'application/octet-stream';
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `inline; filename="${fileData.originalName}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });

  if (fileData.encrypted) {
    // Decrypt AES first
    const encryptedBuf = fs.readFileSync(filepath);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);

    if (fileData.pdfPassword && mimeType === 'application/pdf') {
      const tmpFile = path.join(os.tmpdir(), `safeprint_prev_${code}_${index}.pdf`);
      const unencryptedFile = path.join(os.tmpdir(), `safeprint_prev_open_${code}_${index}.pdf`);
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

    // Return decrypted buffer
    res.send(decrypted);
  } else {
    // Not AES-encrypted — handle PDF password if present
    if (fileData.pdfPassword && mimeType === 'application/pdf') {
      const tmpFile = path.join(os.tmpdir(), `safeprint_prev_${code}_${index}.pdf`);
      const unencryptedFile = path.join(os.tmpdir(), `safeprint_prev_open_${code}_${index}.pdf`);
      
      fs.copyFileSync(filepath, tmpFile);

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

    // Normal stream (no encryption, no pdf password)
    const readStream = fs.createReadStream(filepath);
    readStream.pipe(res);
  }
});

// Keep backward compat: /download/:code redirects to first file
router.get('/download/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  const batch = fileStore[code];

  if (!batch) {
    return res.status(404).json({ error: 'Invalid code. Files may have been printed already.' });
  }

  // Redirect to first file
  res.redirect(`/api/files/download/${code}/0`);
});

// Print all files in batch
router.post('/print/:code', async (req, res) => {
  const code = req.params.code.toLowerCase();
  const { shopId } = req.body;
  const batch = fileStore[code];

  if (!batch) return res.status(404).json({ error: 'Invalid code' });

  let checkoutData = null;
  if (shopId) {
    const shop = shopRoutes.getShop(shopId);
    if (shop) {
      const baseRate = 2.0;
      let surgeMultiplier = 1.0;
      let surgeInfo = '';
      
      switch(shop.status) {
        case 'free': surgeMultiplier = 0.9; surgeInfo = "-10% Discount Applied"; break;
        case 'moderate': surgeMultiplier = 1.0; surgeInfo = "Base Demand Pricing"; break;
        case 'busy': surgeMultiplier = 1.25; surgeInfo = "+25% Surge Pricing Active"; break;
        default: surgeMultiplier = 1.0; surgeInfo = "Base Rate Active"; break;
      }
      
      // Mock 4 pages per doc for hackathon speed
      const assumedPages = batch.files.length * 4;
      const totalAmount = (assumedPages * baseRate * surgeMultiplier).toFixed(2);
      const upiId = shop.upiId || 'partner@upi';
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shop.name)}&am=${totalAmount}&cu=INR`;
      
      checkoutData = {
        amount: totalAmount,
        upiLink,
        pages: assumedPages,
        surgeInfo
      };
    }
  }

  const tmpFiles = [];

  try {
    for (let i = 0; i < batch.files.length; i++) {
      const fileData = batch.files[i];
      const filepath = path.join(uploadDir, fileData.diskFilename);

      if (!fs.existsSync(filepath)) continue;

      let fileBuffer;
      if (fileData.encrypted) {
        const encryptedBuf = fs.readFileSync(filepath);
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));
        fileBuffer = Buffer.concat([decipher.update(encryptedBuf), decipher.final()]);
      } else {
        fileBuffer = fs.readFileSync(filepath);
      }

      const ext = path.extname(fileData.originalName) || '.pdf';
      let tmpFile = path.join(os.tmpdir(), `safeprint_${code}_${i}${ext}`);
      fs.writeFileSync(tmpFile, fileBuffer);

      if (fileData.pdfPassword && ext.toLowerCase() === '.pdf') {
        const unencryptedFile = path.join(os.tmpdir(), `safeprint_open_${code}_${i}${ext}`);
        try {
          muhammara.recrypt(tmpFile, unencryptedFile, { password: fileData.pdfPassword });
          fs.unlinkSync(tmpFile);
          tmpFile = unencryptedFile;
        } catch (err) {
          console.error(`Failed to decrypt PDF ${i} with provided password:`, err);
          if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
          continue;
        }
      }

      tmpFiles.push({ tmpFile, filepath });
    }

    // Print all files
    for (const { tmpFile } of tmpFiles) {
      await ptp.print(tmpFile);
    }

    // Cleanup: delete all encrypted + tmp files
    for (const { tmpFile, filepath } of tmpFiles) {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log(`Deleted uploaded file: ${filepath}`);
      }
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
        console.log(`Deleted temporary file: ${tmpFile}`);
      }
    }

    // Also delete any files that were skipped (not found)
    for (const fileData of batch.files) {
      const fp = path.join(uploadDir, fileData.diskFilename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    delete fileStore[code];
    console.log(`Removed batch metadata for code: ${code}`);
    return res.json({ 
      success: true, 
      message: `${tmpFiles.length} document(s) sent to printer successfully.`,
      checkoutData
    });
  } catch (err) {
    console.error('Print error:', err);
    // Cleanup tmp files on error
    for (const { tmpFile } of tmpFiles) {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    return res.status(503).json({ error: 'Failed to send to printer.' });
  }
});

module.exports = router;