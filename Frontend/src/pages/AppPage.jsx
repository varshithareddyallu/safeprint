import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { QrReader } from 'react-qr-reader';
import { Upload, Printer, Copy, Check, Loader2, ShieldAlert, Eye } from 'lucide-react';
import { API_BASE_URL } from '../config';
import PdfCanvasViewer from '../components/PdfCanvasViewer';

const AppPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname === '/print' ? 'download' : 'upload');

  // --- Upload State ---
  const [file, setFile] = useState(null);
  const [uploadCode, setUploadCode] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [filePassword, setFilePassword] = useState('');

  // --- Download State ---
  const [downloadCode, setDownloadCode] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResult, setPrintResult] = useState(null); // null | 'success' | 'error'
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewContentType, setPreviewContentType] = useState('');

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
      fetchPreview(codeFromUrl);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file.');
      return;
    }
    if (isPasswordProtected && !filePassword) {
      setUploadStatus('Please enter the file password.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (isPasswordProtected) formData.append('password', filePassword);

    try {
      setIsUploading(true);
      setUploadStatus('Uploading...');
      const res = await axios.post(`${API_BASE_URL}/upload`, formData);
      setUploadCode(res.data.code);
      const baseUrl = window.location.origin;
      setDownloadUrl(`${baseUrl}/print?code=${res.data.code}`);
      setUploadStatus('✅ File uploaded successfully.');
    } catch (err) {
      console.error(err);
      setUploadStatus('❌ Something went wrong during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchPreview = async (code) => {
    try {
      setDownloadStatus('Fetching preview...');
      setPrintResult(null);
      const response = await axios.get(`${API_BASE_URL}/download/${code}`);
      setPreviewUrl(`${API_BASE_URL}/download/${code}`);
      setPreviewContentType(response.headers['content-type'] || 'application/pdf');
      setDownloadStatus('✅ Preview loaded. Hold to reveal.');
    } catch (error) {
      console.error(error);
      setDownloadStatus('❌ Invalid code or file has been deleted.');
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setDownloadStatus('Sending to printer...');
      setPrintResult(null);
      await axios.post(`${API_BASE_URL}/print/${downloadCode}`);
      setDownloadStatus('✅ Document printed & permanently deleted.');
      setPrintResult('success');
      setPreviewUrl('');
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
      const extractedCode = scannedText.split('/').pop();
      setDownloadCode(extractedCode);
      fetchPreview(extractedCode);
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
    setFile(null);
    setUploadCode('');
    setUploadStatus('');
    setDownloadUrl('');
    setIsPasswordProtected(false);
    setFilePassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans selection:bg-emerald-500/30">
      <div className="bg-slate-800 shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-md text-slate-200 border border-slate-700 relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500" />

        <div className="flex bg-slate-900/50 p-1">
          <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-center font-bold transition rounded-lg text-sm ${activeTab === 'upload' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50'}`}>Send File</button>
          <button onClick={() => setActiveTab('download')} className={`flex-1 py-3 text-center font-bold transition rounded-lg text-sm ${activeTab === 'download' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:bg-slate-700/50'}`}>Receive File</button>
        </div>

        <div className="p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {!uploadCode ? (
                <>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Select a single document. The file is encrypted and will <span className="text-emerald-400 font-bold">self-destruct</span> after one print.
                  </p>

                  <div className="space-y-4 mb-6">
                    <label className="block w-full border-2 border-dashed border-slate-700 bg-slate-800/30 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition relative overflow-hidden group">
                      <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                      <Upload className="mx-auto mb-4 text-emerald-500 group-hover:scale-110 transition-transform" size={40} />
                      <p className="text-white font-bold">{file ? file.name : "Click to select a file"}</p>
                      <p className="text-slate-500 text-xs mt-1">PDF, JPG, PNG, DOCX (Max 1 file)</p>
                    </label>

                    {file && (
                      <div className="flex flex-col gap-3 mt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500" 
                            checked={isPasswordProtected}
                            onChange={(e) => {
                              setIsPasswordProtected(e.target.checked);
                              if (!e.target.checked) setFilePassword('');
                            }}
                          />
                          File is password protected
                        </label>
                        {isPasswordProtected && (
                          <input 
                            type="password"
                            placeholder="File password"
                            value={filePassword}
                            onChange={(e) => setFilePassword(e.target.value)}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg outline-none text-white text-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleUpload} 
                    disabled={!file || isUploading} 
                    className="w-full py-4 rounded-2xl text-slate-900 font-bold bg-emerald-500 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Generate Secure Code'}
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
                  <button onClick={resetUpload} className="text-emerald-500 text-sm hover:underline">Upload another file</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {printResult === 'success' ? (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <Check className="w-16 h-16 text-emerald-500 bg-emerald-500/10 rounded-full p-4 mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Print Complete!</h3>
                  <p className="text-slate-400 text-sm mb-6 px-4">Your document has been sent to the printer and permanently scrubbed from the server.</p>
                  <button onClick={() => { setPrintResult(null); setDownloadStatus(''); }} className="w-full py-3 bg-emerald-500 text-slate-900 rounded-lg font-bold">Print Next File</button>
                </div>
              ) : !previewUrl ? (
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
                    <button onClick={() => fetchPreview(downloadCode)} disabled={!downloadCode} className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold shadow-xl shadow-emerald-500/10 disabled:bg-slate-700 disabled:text-slate-500">Fetch Document</button>
                    <button onClick={() => setShowScanner(!showScanner)} className="w-full py-3 text-slate-400 font-semibold border border-slate-700 rounded-xl hover:bg-slate-700/50 transition">{showScanner ? 'Close Scanner' : 'Scan QR Code'}</button>
                  </div>
                  {downloadStatus && <p className="text-xs text-center text-slate-500">{downloadStatus}</p>}
                </>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <div className="w-full h-[500px] bg-white rounded-lg overflow-hidden border-4 border-slate-700 shadow-inner relative select-none">
                    {!isViewing ? (
                      <div 
                        className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center z-40 text-emerald-500 cursor-pointer"
                        onPointerDown={() => setIsViewing(true)}
                      >
                        <Eye className="w-12 h-12 mb-3 text-emerald-500/80" />
                        <h3 className="text-lg font-bold text-white">Hold to Reveal</h3>
                        <p className="text-slate-400 text-[10px]">Security active: Hold here to preview document.</p>
                      </div>
                    ) : isSecureBlanked ? (
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 text-emerald-400">
                        <ShieldAlert className="w-12 h-12 mb-2" />
                        <p className="font-bold">PREVIEW LOCKED</p>
                      </div>
                    ) : null}
                    
                    <div 
                      className={`w-full h-full transition-opacity duration-75 ${(!isViewing || isSecureBlanked) ? 'opacity-0' : 'opacity-100'}`}
                      onPointerUp={() => setIsViewing(false)}
                      onPointerLeave={() => setIsViewing(false)}
                    >
                      {previewContentType.includes('image') ? (
                         <img src={previewUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none" />
                      ) : (
                         <PdfCanvasViewer url={previewUrl} />
                      )}
                    </div>
                  </div>
                  <button onClick={handlePrint} disabled={isPrinting} className="w-full py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold shadow-xl shadow-emerald-500/20">{isPrinting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Print Document Now'}</button>
                  <button onClick={() => { setPreviewUrl(''); setDownloadStatus(''); }} className="text-emerald-500 text-sm hover:underline">Cancel</button>
                </div>
              )}

              {showScanner && !previewUrl && (
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