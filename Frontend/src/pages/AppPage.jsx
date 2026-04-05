import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import { Upload, Printer, Copy, Check, Loader2, ShieldAlert, Eye, X, Lock, Unlock, FileText, MessageSquare, ChevronLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';
import PdfCanvasViewer from '../components/PdfCanvasViewer';

const AppPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname === '/print' ? 'download' : 'upload');

  // --- Upload State ---
  const [files, setFiles] = useState([]); // [{ file, encrypt, isPasswordProtected, password }]
  const [comment, setComment] = useState('');
  const [uploadCode, setUploadCode] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Download State ---
  const [downloadCode, setDownloadCode] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResult, setPrintResult] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewContentType, setPreviewContentType] = useState('');

  // --- Batch info state (receive side) ---
  const [batchInfo, setBatchInfo] = useState(null); // { comment, files: [{ index, name, encrypted }] }
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);

  // --- Security State ---
  const [isSecureBlanked, setIsSecureBlanked] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  // --- Anti-screenshot etc ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || ['Meta', 'Shift', 'Alt', 'Control', 'OS'].includes(e.key)) {
        setIsSecureBlanked(true);
        setIsViewing(false);
        setTimeout(() => setIsSecureBlanked(false), 3000);
      }
    };
    const handleBlur = () => { setIsSecureBlanked(true); setIsViewing(false); };
    const handleFocus = () => { setIsSecureBlanked(false); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    const preventAction = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
    };
  }, []);

  // --- Auto-load from URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get('code');
    if (codeFromUrl) {
      setActiveTab('download');
      setDownloadCode(codeFromUrl);
      fetchBatchInfo(codeFromUrl);
    }
  }, []);

  // --- File management helpers ---
  const handleFilesSelected = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newEntries = selectedFiles.map(f => ({
      file: f,
      encrypt: true,
      isPasswordProtected: false,
      password: '',
    }));
    setFiles(prev => [...prev, ...newEntries]);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileOption = (index, key, value) => {
    setFiles(prev => prev.map((f, i) => {
      if (i !== index) return f;
      const updated = { ...f, [key]: value };
      if (key === 'isPasswordProtected' && !value) updated.password = '';
      return updated;
    }));
  };

  // --- Upload ---
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus('Please select at least one file.');
      return;
    }

    const formData = new FormData();
    files.forEach(entry => {
      formData.append('files', entry.file);
    });

    const metadata = {
      encryptionPrefs: files.map(f => ({
        encrypt: f.encrypt,
        isPasswordProtected: f.isPasswordProtected,
        password: f.password,
      })),
      comment,
    };
    formData.append('metadata', JSON.stringify(metadata));

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      const res = await axios.post(`${API_BASE_URL}/upload`, formData);
      setUploadCode(res.data.code);
      const baseUrl = window.location.origin;
      setDownloadUrl(`${baseUrl}/print?code=${res.data.code}`);
      setUploadStatus('✅ Files uploaded successfully.');
    } catch (err) {
      console.error(err);
      setUploadStatus('❌ Something went wrong during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Fetch batch info (receive side) ---
  const fetchBatchInfo = async (code) => {
    try {
      setDownloadStatus('Fetching file info...');
      setPrintResult(null);
      setPreviewUrl('');
      setSelectedFileIndex(null);
      const response = await axios.get(`${API_BASE_URL}/info/${code}`);
      setBatchInfo(response.data);
      setDownloadStatus('');
    } catch (error) {
      console.error(error);
      setDownloadStatus('❌ Invalid code or files have been deleted.');
      setBatchInfo(null);
    }
  };

  // --- Preview a specific file ---
  const previewFile = async (code, index, encrypted) => {
    try {
      setDownloadStatus('Loading preview...');
      setSelectedFileIndex(index);
      const response = await axios.get(`${API_BASE_URL}/download/${code}/${index}`);
      setPreviewUrl(`${API_BASE_URL}/download/${code}/${index}`);
      setPreviewContentType(response.headers['content-type'] || 'application/pdf');
      if (encrypted) {
        setDownloadStatus('✅ Preview loaded. Hold to reveal.');
      } else {
        setDownloadStatus('✅ Preview loaded.');
        setIsViewing(true);
      }
    } catch (error) {
      console.error(error);
      setDownloadStatus('❌ Failed to load file preview.');
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setDownloadStatus('Sending all files to printer...');
      setPrintResult(null);
      await axios.post(`${API_BASE_URL}/print/${downloadCode}`);
      setDownloadStatus('✅ All documents printed & permanently deleted.');
      setPrintResult('success');
      setPreviewUrl('');
      setBatchInfo(null);
      setDownloadCode('');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to print. Please try again.';
      setDownloadStatus(`❌ ${msg}`);
      setPrintResult('error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleScan = (result, error) => {
    if (!!result) {
      const scannedText = result?.text || '';
      const url = new URL(scannedText);
      const extractedCode = url.searchParams.get('code') || scannedText.split('/').pop();
      setDownloadCode(extractedCode);
      fetchBatchInfo(extractedCode);
      setShowScanner(false);
    }
    if (!!error) console.warn(error);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uploadCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetUpload = () => {
    setFiles([]);
    setComment('');
    setUploadCode('');
    setUploadStatus('');
    setDownloadUrl('');
  };

  // --- Helpers for file size display ---
  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans selection:bg-emerald-500/30">
      <div className="bg-slate-800 shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-lg text-slate-200 border border-slate-700 relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />

        <div className="flex bg-slate-900/50 p-1">
          <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-center font-bold transition rounded-lg text-sm ${activeTab === 'upload' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50'}`}>Send Files</button>
          <button onClick={() => setActiveTab('download')} className={`flex-1 py-3 text-center font-bold transition rounded-lg text-sm ${activeTab === 'download' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50'}`}>Receive Files</button>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {!uploadCode ? (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Upload multiple documents. Toggle encryption per file. Files will <span className="text-emerald-400 font-bold">self-destruct</span> after one print.
                  </p>

                  {/* Drop zone */}
                  <label className="block w-full border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-2xl p-6 text-center cursor-pointer hover:border-emerald-500/50 transition relative overflow-hidden group">
                    <input type="file" className="hidden" multiple onChange={handleFilesSelected} />
                    <Upload className="mx-auto mb-3 text-emerald-500 group-hover:scale-110 transition-transform" size={36} />
                    <p className="text-white font-bold text-sm">Click to select files</p>
                    <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG, DOCX — Multiple files allowed</p>
                  </label>

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {files.map((entry, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 space-y-2">
                          {/* File header row */}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium truncate">{entry.file.name}</p>
                              <p className="text-xs text-slate-500">{formatSize(entry.file.size)}</p>
                            </div>
                            <button onClick={() => removeFile(i)} className="p-1 hover:bg-red-500/20 rounded-lg transition text-slate-500 hover:text-red-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Options row */}
                          <div className="flex flex-col gap-2 pl-6">
                            {/* Encrypt toggle */}
                            <label className="flex items-center gap-2 cursor-pointer text-xs">
                              <button
                                type="button"
                                onClick={() => updateFileOption(i, 'encrypt', !entry.encrypt)}
                                className={`w-8 h-5 rounded-full relative transition-colors ${entry.encrypt ? 'bg-emerald-500' : 'bg-slate-600'}`}
                              >
                                <span className={`block w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${entry.encrypt ? 'translate-x-[14px]' : 'translate-x-[3px]'}`} />
                              </button>
                              <span className="text-slate-300 flex items-center gap-1">
                                {entry.encrypt ? <Lock className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                                {entry.encrypt ? 'Encrypted on server' : 'No encryption'}
                              </span>
                            </label>

                            {/* Password protected toggle */}
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-emerald-500 accent-emerald-500"
                                checked={entry.isPasswordProtected}
                                onChange={(e) => updateFileOption(i, 'isPasswordProtected', e.target.checked)}
                              />
                              File is already password-protected
                            </label>

                            {entry.isPasswordProtected && (
                              <input
                                type="password"
                                placeholder="Enter existing file password"
                                value={entry.password}
                                onChange={(e) => updateFileOption(i, 'password', e.target.value)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg outline-none text-white text-xs placeholder-slate-500"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment box */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400">
                      <MessageSquare className="w-4 h-4" />
                      Message for the print shop (optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="e.g. Print 2 copies, double-sided, color for page 1..."
                      rows={3}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl outline-none text-white text-sm placeholder-slate-500 resize-none focus:border-emerald-500/50 transition"
                    />
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    className="w-full py-4 rounded-2xl text-slate-900 font-bold bg-emerald-500 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : `Upload ${files.length} File${files.length !== 1 ? 's' : ''} Securely`}
                  </button>
                  {uploadStatus && !isUploading && <p className="text-xs text-center text-slate-500">{uploadStatus}</p>}
                </>
              ) : (
                <div className="text-center space-y-4">
                  <p className="font-medium text-emerald-400">{uploadStatus}</p>
                  <div className="bg-slate-900 p-4 rounded-lg flex items-center justify-between border border-slate-700">
                    <span className="text-2xl font-mono font-bold tracking-widest text-white">{uploadCode}</span>
                    <button onClick={copyToClipboard} className="p-2 hover:bg-slate-700 rounded-full transition">{copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-400" />}</button>
                  </div>
                  <div className="p-4 bg-white rounded-lg inline-block border-4 border-slate-700"><QRCodeCanvas value={downloadUrl} size={160} /></div>
                  <p className="text-xs text-slate-500">Share this code with the shop owner.</p>
                  <button onClick={resetUpload} className="text-emerald-500 text-sm hover:underline">Upload more files</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {printResult === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <Check className="w-16 h-16 text-emerald-500 bg-emerald-500/10 rounded-full p-4 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Print Complete!</h3>
                  <p className="text-slate-400 text-sm mb-6 px-4">All documents have been sent to the printer and permanently scrubbed from the server.</p>
                  <button onClick={() => { setPrintResult(null); setDownloadStatus(''); setBatchInfo(null); }} className="w-full py-3 bg-emerald-500 text-slate-900 rounded-lg font-bold">Print Next Batch</button>
                </div>
              ) : previewUrl ? (
                /* ---- File Preview ---- */
                <div className="space-y-6 flex flex-col items-center">
                  <button
                    onClick={() => { setPreviewUrl(''); setSelectedFileIndex(null); setDownloadStatus(''); setIsViewing(false); }}
                    className="self-start flex items-center gap-1 text-sm text-emerald-500 hover:underline"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to file list
                  </button>

                  {batchInfo && selectedFileIndex !== null && (
                    <p className="text-sm text-slate-400">
                      Previewing: <span className="text-white font-medium">{batchInfo.files[selectedFileIndex]?.name}</span>
                    </p>
                  )}

                  <div className="w-full h-[500px] bg-white rounded-lg overflow-hidden border-4 border-slate-700 shadow-inner relative select-none">
                    {/* Show "Hold to Reveal" only for encrypted files */}
                    {batchInfo?.files[selectedFileIndex]?.encrypted && !isViewing ? (
                      <div
                        className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-40 text-emerald-500 cursor-pointer"
                        onPointerDown={() => setIsViewing(true)}
                      >
                        <Eye className="w-12 h-12 mb-3 text-emerald-500/80" />
                        <h3 className="text-lg font-bold text-white">Hold to Reveal</h3>
                        <p className="text-slate-400 text-[10px]">Security active: Hold here to preview document.</p>
                      </div>
                    ) : isSecureBlanked && batchInfo?.files[selectedFileIndex]?.encrypted ? (
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 text-emerald-400">
                        <ShieldAlert className="w-12 h-12 mb-2" />
                        <p className="font-bold">PREVIEW LOCKED</p>
                      </div>
                    ) : null}

                    <div
                      className={`w-full h-full transition-opacity duration-75 ${(batchInfo?.files[selectedFileIndex]?.encrypted && (!isViewing || isSecureBlanked)) ? 'opacity-0' : 'opacity-100'}`}
                      onPointerUp={() => { if (batchInfo?.files[selectedFileIndex]?.encrypted) setIsViewing(false); }}
                      onPointerLeave={() => { if (batchInfo?.files[selectedFileIndex]?.encrypted) setIsViewing(false); }}
                    >
                      {previewContentType.includes('image') ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                      ) : (
                        <PdfCanvasViewer url={previewUrl} />
                      )}
                    </div>
                  </div>
                </div>
              ) : batchInfo ? (
                /* ---- Batch file list (receive side) ---- */
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">📁 {batchInfo.files.length} File{batchInfo.files.length !== 1 ? 's' : ''} Found</h3>

                  {batchInfo.comment && (
                    <div className="bg-slate-900/60 border border-emerald-500/30 rounded-xl p-3">
                      <p className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Message from sender:</p>
                      <p className="text-sm text-slate-300">{batchInfo.comment}</p>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {batchInfo.files.map((f) => (
                      <button
                        key={f.index}
                        onClick={() => previewFile(downloadCode, f.index, f.encrypted)}
                        className="w-full bg-slate-900/60 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 flex items-center gap-3 transition text-left group"
                      >
                        <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition">{f.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {f.encrypted ? (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Encrypted</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-full flex items-center gap-1"><Unlock className="w-2.5 h-2.5" /> Unencrypted</span>
                            )}
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
                      </button>
                    ))}
                  </div>

                  <button onClick={handlePrint} disabled={isPrinting} className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold shadow-xl shadow-emerald-500/20">
                    {isPrinting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : `Print All ${batchInfo.files.length} File${batchInfo.files.length !== 1 ? 's' : ''} Now`}
                  </button>
                  <button onClick={() => { setBatchInfo(null); setDownloadCode(''); setDownloadStatus(''); }} className="text-emerald-500 text-sm hover:underline w-full text-center">Cancel</button>

                  {downloadStatus && <p className="text-xs text-center text-slate-500">{downloadStatus}</p>}
                </div>
              ) : (
                /* ---- Enter code screen ---- */
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Enter File Code</label>
                    <input
                      type="text"
                      value={downloadCode}
                      onChange={(e) => { setDownloadCode(e.target.value); setPrintResult(null); }}
                      placeholder="e.g. a1b2c3d4"
                      className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl outline-none font-mono text-center text-lg uppercase text-white shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => fetchBatchInfo(downloadCode)} disabled={!downloadCode} className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold shadow-xl shadow-emerald-500/10 disabled:bg-slate-700 disabled:text-slate-500">Fetch Documents</button>
                    <button onClick={() => setShowScanner(!showScanner)} className="w-full py-3 text-slate-400 font-semibold border border-slate-700 rounded-xl hover:bg-slate-700/50 transition">{showScanner ? 'Close Scanner' : 'Scan QR Code'}</button>
                  </div>
                  {downloadStatus && <p className="text-xs text-center text-slate-500">{downloadStatus}</p>}
                </>
              )}

              {showScanner && !batchInfo && (
                <div className="mt-4 p-2 bg-white rounded-xl"><QrReader constraints={{ facingMode: 'environment' }} onResult={handleScan} style={{ width: '100%' }} /></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppPage;