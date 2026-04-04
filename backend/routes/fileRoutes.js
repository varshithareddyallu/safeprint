const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// In-memory store for file metadata
const fileStore = {}; // code -> { diskFilename, originalName, key, iv }

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload & Encrypt File
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

  // Store metadata in memory instead of separate .key file
  fileStore[code] = {
    diskFilename,
    originalName: req.file.originalname,
    key: key.toString('hex'),
    iv: iv.toString('hex'),
  };

  res.json({ code });
});

// Stream & Decrypt File for Viewing
router.get('/download/:code', (req, res) => {
  const code = req.params.code;
  const fileData = fileStore[code];

  if (!fileData) {
    return res.status(404).json({ error: 'Invalid code. File may have been downloaded already.' });
  }

  const filepath = path.join(uploadDir, fileData.diskFilename);

  if (!fs.existsSync(filepath)) {
    delete fileStore[code];
    return res.status(404).json({ error: 'File not found on server. It may have been downloaded already.' });
  }

  const mimeType = mime.lookup(fileData.originalName) || 'application/octet-stream';
  console.log(`Attempting to stream file '${fileData.originalName}' with MIME type '${mimeType}'`);

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(fileData.key, 'hex'), Buffer.from(fileData.iv, 'hex'));

  // IMPORTANT: If the browser does not have a viewer for the `mimeType`,
  // it will fall back to downloading the file, even with "Content-Disposition: inline".
  // A type of `application/octet-stream` will almost always trigger a download.
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `inline; filename="${fileData.originalName}"`,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });

  const readStream = fs.createReadStream(filepath);

  // Add error handling to prevent crashes and leaving dangling files.
  readStream.on('error', (err) => {
    console.error('File read stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Error reading file from server.');
    }
  });

  decipher.on('error', (err) => {
    console.error('Decryption stream error:', err);
    if (!res.headersSent) {
      res.status(500).send('Error decrypting file. It may be corrupt.');
    }
  });

  readStream.pipe(decipher).pipe(res);

  // Delete file and in-memory record after stream is finished
  res.on('finish', () => {
    console.log(`Stream finished for '${fileData.originalName}'. Deleting file and record.`);
    fs.unlink(filepath, (unlinkErr) => {
      if (unlinkErr) console.error(`Failed to delete file ${filepath}:`, unlinkErr);
      // Always remove the in-memory record to prevent re-use of the code
      delete fileStore[code];
    });
  });
});

module.exports = router;