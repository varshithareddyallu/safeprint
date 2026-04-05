import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import { Printer, Loader2, CheckCircle2, IndianRupee } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL } from '../config';
import PdfCanvasViewer from '../components/PdfCanvasViewer';

const PrintPage = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printResult, setPrintResult] = useState(null); // null | 'success' | 'error'
  
  // -- NEW BATCH STATE --
  const [batchInfo, setBatchInfo] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);

  const handleFetchInfo = async () => {
    if (!code.trim()) {
      setStatus('Please enter a code.');
      return;
    }

    try {
      setStatus('Fetching file info...');
      setPrintResult(null);
      const response = await axios.get(`${API_BASE_URL}/info/${code}`);
      setBatchInfo(response.data);
      setStatus('✅ Info loaded. Ready to print.');
    } catch (error) {
      console.error(error);
      setStatus('❌ Invalid code or files have been deleted.');
      setBatchInfo(null);
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      setPrintResult(null);
      setStatus('Sending all files to printer...');
      
      const shopSessionStr = localStorage.getItem('safeprint_shop_session');
      const shopSession = shopSessionStr ? JSON.parse(shopSessionStr) : null;
      const shopId = shopSession ? shopSession.id : 'mock-shop-123'; // fallback for demo

      const response = await axios.post(`${API_BASE_URL}/print/${code}`, { shopId });
      
      if (response.data.checkoutData) {
        setCheckoutData(response.data.checkoutData);
      } else {
        // Fallback safety
        setCheckoutData({
          amount: "0.00",
          upiLink: "upi://pay?pa=partner@upi",
          pages: 0,
          surgeInfo: "Legacy Calculation"
        });
      }

      setStatus('✅ Documents sent to printer. Awaiting customer payment.');
      setPrintResult('success');
      setCode('');
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to print. Please try again.';
      setStatus(`❌ ${msg}`);
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
      setCode(extractedCode);
      setStatus('');
      setPrintResult(null);
      setShowScanner(false);
      // Auto-fetch info on scan
      setTimeout(() => {
         // Because setState is async, we pass the code directly down or rely on effect.
         // Easiest is to just call a modified fetch with the extracted Code.
         fetchInfoDirect(extractedCode);
      }, 100);
    }
    if (!!error) console.warn(error);
  };

  const fetchInfoDirect = async (c) => {
    try {
      setStatus('Fetching file info...');
      setPrintResult(null);
      const response = await axios.get(`${API_BASE_URL}/info/${c}`);
      setBatchInfo(response.data);
      setStatus('✅ Info loaded. Ready to print.');
    } catch (error) {
      console.error(error);
      setStatus('❌ Invalid code or files have been deleted.');
      setBatchInfo(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 to-indigo-300 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 text-indigo-700">Print Section</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter or scan the unique code to securely print the file.
        </p>

        {!batchInfo ? (
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Enter unique code"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center text-xl font-mono uppercase"
              value={code}
              onChange={(e) => { setCode(e.target.value); setPrintResult(null); setStatus(''); }}
            />

            {status && (
              <div className={`mb-4 flex items-center justify-center gap-2 text-sm p-3 rounded-lg ${
                printResult === 'error' ? 'bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {status}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleFetchInfo}
                disabled={!code || isPrinting}
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300"
              >
                Fetch Documents
              </button>

              <button
                onClick={() => setShowScanner(!showScanner)}
                className="w-full bg-gray-200 text-indigo-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                {showScanner ? 'Close Scanner' : 'Scan QR Code'}
              </button>
            </div>

            {showScanner && (
              <div className="mt-4 border-2 border-indigo-100 rounded-lg overflow-hidden">
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={handleScan}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className={`w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg ${
              printResult === 'success' ? 'bg-green-100 text-green-700' :
              printResult === 'error'   ? 'bg-red-100 text-red-700' :
              'bg-indigo-50 text-indigo-700'
            }`}>
              {isPrinting && <Loader2 className="w-4 h-4 animate-spin" />}
              {status}
            </div>

            {checkoutData ? (
              /* --- POINT OF SALE PAYMENT UI --- */
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Print Successful</h2>
                <p className="text-slate-500 text-sm mb-8">Please ask the customer to scan to pay.</p>

                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white border-4 border-emerald-100 rounded-3xl shadow-sm">
                    <QRCodeSVG 
                      value={checkoutData.upiLink} 
                      size={200}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-500 text-sm font-medium">Est. Pages Printed</span>
                     <span className="text-slate-800 font-bold">{checkoutData.pages}</span>
                   </div>
                   <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-3">
                     <span className="text-slate-500 text-sm font-medium">Pricing Status</span>
                     <span className="text-purple-600 font-bold text-xs bg-purple-100 px-2 py-0.5 rounded">{checkoutData.surgeInfo}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-slate-500 font-bold uppercase tracking-wide">Total Amount</span>
                     <span className="text-3xl font-extrabold text-emerald-600 flex items-center gap-1">
                       <IndianRupee className="w-6 h-6" />{checkoutData.amount}
                     </span>
                   </div>
                </div>

                <button
                  onClick={() => { setCheckoutData(null); setBatchInfo(null); setStatus(''); setPrintResult(null); }}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg"
                >
                  Complete Transaction & Return
                </button>
              </div>
            ) : (
              /* --- BATCH REVIEW UI --- */
              <>
                <div className="w-full text-left bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-inner">
                   <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                      {batchInfo.files.length} Document{batchInfo.files.length !== 1 ? 's' : ''} Ready for Print
                   </h3>
                   
                   {batchInfo.comment && (
                     <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Message from Customer:</p>
                        <p className="text-sm text-yellow-900 whitespace-pre-wrap">{batchInfo.comment}</p>
                     </div>
                   )}

                   <ul className="space-y-2 mb-2 max-h-60 overflow-y-auto pr-2">
                     {batchInfo.files.map((f, i) => (
                       <li key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div className="flex-1 truncate text-sm font-medium text-gray-700">{f.name}</div>
                          {f.encrypted && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">Encrypted</span>}
                       </li>
                     ))}
                   </ul>
                </div>

                <div className="w-full flex flex-col gap-3 max-w-md">
                  <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition duration-200 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isPrinting
                      ? <><Loader2 className="w-6 h-6 animate-spin" /> Printing...</>
                      : <><Printer className="w-6 h-6" /> Print Document Now</>}
                  </button>
                  
                  <button
                    onClick={() => { setBatchInfo(null); setStatus(''); }}
                    className="w-full bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-center text-gray-400 mt-8">
          🔒 For your security, the document is permanently deleted from our servers immediately after printing.
        </p>
      </div>
    </div>
  );
};

export default PrintPage;