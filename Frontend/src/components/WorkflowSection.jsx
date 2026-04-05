import React, { useRef, useState } from 'react';
import { Shield, Printer, Lock, CheckCircle, Upload, QrCode, Smartphone, ScanLine, Trash2, FileCheck, User, Store } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

/* Scroll-triggered wrapper (duplicated locally for self-containment) */
const ScrollReveal = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ============================================================
   WORKFLOW DATA
   ============================================================ */
const userSteps = [
  {
    icon: Upload,
    title: 'Select Your File',
    desc: 'Pick any document — Aadhaar, PAN card, assignment, resume. Drag & drop or browse from your phone.',
    detail: 'Supports PDF, images & docs up to 100MB',
  },
  {
    icon: Lock,
    title: 'Upload & Encrypt',
    desc: 'Your file is encrypted and uploaded to our secure server. No account needed — completely anonymous.',
    detail: 'AES-256 encryption + randomized filename',
  },
  {
    icon: QrCode,
    title: 'Get QR Code & Unique Code',
    desc: 'Instantly receive a one-time QR code and a short alphanumeric code. This is your file\'s only key.',
    detail: 'Code expires after single use',
  },
  {
    icon: Smartphone,
    title: 'Share with Print Shop',
    desc: 'Show the QR on your phone or share the code verbally. No WhatsApp login, no email needed.',
    detail: 'Zero digital trail on shop\'s device',
  },
];

const ownerSteps = [
  {
    icon: ScanLine,
    title: 'Scan QR or Enter Code',
    desc: 'Customer shows a QR code or tells you a short code. Enter it into the SafePrint shop — takes 2 seconds.',
    detail: 'Works in any browser, no app install',
  },
  {
    icon: FileCheck,
    title: 'Preview the Document',
    desc: 'See a secure preview of the document right in the browser. Verify the correct file before printing.',
    detail: 'Preview rendered in isolated sandbox',
  },
  {
    icon: Printer,
    title: 'Print Securely',
    desc: 'Hit "Print" and the document goes straight to your connected printer. No file is saved to disk.',
    detail: 'Direct memory-to-printer pipeline',
  },
  {
    icon: Trash2,
    title: 'Auto-Destruct',
    desc: 'The moment the print job completes, the file is permanently purged from the server. Gone forever.',
    detail: 'fs.unlink — irrecoverable deletion',
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
const WorkflowSection = () => {
  const [role, setRole] = useState('user');
  const isUser = role === 'user';
  const steps = isUser ? userSteps : ownerSteps;
  const accent = isUser ? 'emerald' : 'cyan';

  const accentStyles = {
    emerald: {
      dot: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/20',
      badge: 'bg-emerald-500 text-slate-950',
      card: 'border-emerald-500/15 hover:border-emerald-500/40 hover:shadow-emerald-500/10',
      tag: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20',
      line: 'linear-gradient(180deg, transparent 0%, #10b981 15%, #10b981 85%, transparent 100%)',
      result: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      toggleActive: 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25',
    },
    cyan: {
      dot: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-cyan-500/20',
      badge: 'bg-cyan-500 text-slate-950',
      card: 'border-cyan-500/15 hover:border-cyan-500/40 hover:shadow-cyan-500/10',
      tag: 'bg-cyan-500/10 text-cyan-400/80 border-cyan-500/20',
      line: 'linear-gradient(180deg, transparent 0%, #06b6d4 15%, #06b6d4 85%, transparent 100%)',
      result: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      toggleActive: 'bg-gradient-to-r from-cyan-500 to-blue-400 text-slate-950 shadow-lg shadow-cyan-500/25',
    },
  };

  const s = accentStyles[accent];

  return (
    <section id="workflow" className="py-16 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-5">
              Workflow
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">How It Works</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
              Two simple roles. One seamless, secure flow.
            </p>

            {/* Role Toggle */}
            <div className="inline-flex items-center bg-slate-900/80 backdrop-blur-md rounded-2xl p-1.5 border border-slate-700/50 shadow-lg">
              <motion.button
                onClick={() => setRole('user')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  isUser ? accentStyles.emerald.toggleActive : 'text-slate-400 hover:text-white'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <User size={16} />
                I'm a User
              </motion.button>
              <motion.button
                onClick={() => setRole('owner')}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  !isUser ? accentStyles.cyan.toggleActive : 'text-slate-400 hover:text-white'
                }`}
                whileTap={{ scale: 0.97 }}
              >
                <Store size={16} />
                I'm a Shop Owner
              </motion.button>
            </div>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.45 }}
            className="relative"
          >
            {/* Vertical connector line */}
            <div className="absolute left-6 md:left-1/2 md:-translate-x-[1px] top-0 bottom-0 w-[2px]">
              <motion.div
                className="w-full h-full rounded-full"
                style={{ background: s.line, transformOrigin: 'top' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, delay: 0.15 }}
              />
            </div>

            {/* Steps */}
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLeft = i % 2 === 0;

              return (
                <ScrollReveal key={`${role}-${i}`} delay={i * 0.12}>
                  <div
                    className={`relative flex items-start gap-6 mb-8 last:mb-0 ${
                      isLeft ? 'md:flex-row md:text-left' : 'md:flex-row-reverse md:text-right'
                    }`}
                  >
                    {/* Dot on the line */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${s.dot}`}
                        style={{ backdropFilter: 'blur(8px)' }}
                        whileInView={{ scale: [0.5, 1.15, 1] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.12 }}
                      >
                        <Icon size={22} />
                      </motion.div>
                      {/* Number badge */}
                      <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${s.badge}`}>
                        {i + 1}
                      </div>
                    </div>

                    {/* Content card */}
                    <div
                      className={`ml-20 md:ml-0 md:w-[calc(50%-40px)] ${
                        isLeft ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                      }`}
                    >
                      <motion.div
                        className={`p-6 rounded-2xl border backdrop-blur-md bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 ${s.card}`}
                        whileHover={{ scale: 1.02 }}
                      >
                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">{step.desc}</p>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium border ${s.tag}`}
                        >
                          <CheckCircle size={10} />
                          {step.detail}
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}

            {/* Result badge */}
            <ScrollReveal delay={0.6}>
              <div className="flex justify-center mt-4">
                <motion.div
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl border backdrop-blur-md ${s.result}`}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Shield size={20} />
                  <span className="font-bold text-sm">
                    {isUser
                      ? 'File printed securely — zero trace left behind'
                      : 'Document printed & auto-destroyed from server'}
                  </span>
                </motion.div>
              </div>
            </ScrollReveal>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default WorkflowSection;
