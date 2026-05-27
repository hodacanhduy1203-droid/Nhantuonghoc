import { useState, useRef } from "react";
import { Upload, ScanFace, Sparkles, AlertCircle, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ReadingCategory = "all" | "face" | "hand" | "body";

export default function App() {
  const [readingCategory, setReadingCategory] = useState<ReadingCategory>("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Vui lòng tải lên một tệp hình ảnh hợp lệ.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      setResult(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageParams: {
            mimeType,
            data: base64Data,
          },
          category: readingCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi phân tích.");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2C2420] font-serif selection:bg-[#8B2622]/20 selection:text-[#2C2420]">
      {/* Header */}
      <header className="border-b border-[#2C2420]/10 bg-[#FDFCF8]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.3em] uppercase opacity-60 mb-1 font-sans">Kinh Điển Nhân Tướng Học</span>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter uppercase">
              Ma Y Thần Tướng
            </h1>
          </div>
          {/* Subtle Navigation/Indicator to match editorial aesthetic */}
          <nav className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest font-sans font-bold">
            {(['all', 'face', 'hand', 'body'] as const).map((cat) => {
              const labels = {
                all: "Toàn Diện",
                face: "Diện Tướng",
                hand: "Thủ Tướng",
                body: "Cốt Cách",
              };
              return (
                <button
                  key={cat}
                  onClick={() => setReadingCategory(cat)}
                  className={cn(
                    "pb-1 border-b-2 transition-all",
                    readingCategory === cat ? "border-[#8B2622] text-[#8B2622]" : "border-transparent opacity-40 hover:opacity-100"
                  )}
                >
                  {labels[cat]}
                </button>
              );
            })}
          </nav>
          
          <div className="hidden sm:flex items-center gap-3">
             <div className="w-10 h-10 border border-[#2C2420] rounded-full flex items-center justify-center italic font-serif">
                {readingCategory === 'all' ? 'I' : readingCategory === 'face' ? 'II' : readingCategory === 'hand' ? 'III' : 'IV'}
             </div>
             <span className="text-xs leading-tight font-serif uppercase tracking-wider text-[10px]">
                Quyển {readingCategory === 'all' ? 'I' : readingCategory === 'face' ? 'II' : readingCategory === 'hand' ? 'III' : 'IV'}:<br/>
                <span className="font-bold text-[#8B2622]">
                  {readingCategory === 'all' ? 'Tổng Quan' : readingCategory === 'face' ? 'Diện Tướng' : readingCategory === 'hand' ? 'Thủ Tướng' : 'Thân Hình'}
                </span>
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 pb-24 flex-1">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4 relative">
          <h2 className="text-3xl font-bold tracking-tight">Huyền Bí Nhân Tướng</h2>
          <p className="text-[#2C2420]/70 leading-relaxed font-serif text-lg">
            Tải lên bức ảnh rõ nét để nhận luận đoán chuyên sâu về ngũ quan, 
            cốt tướng, bàn tay và vận mệnh chiêm nghiệm từ cổ thư Ma Y Thần Tướng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
          {/* Left Column: Upload & Actions */}
          <div className={cn("md:col-span-12 transition-all duration-700 ease-in-out", result ? "md:col-span-4" : "md:col-span-8 md:col-start-3")}>
            <div className="bg-[#F7F3EA] border border-[#2C2420]/10 p-2 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#8B2622]/30 m-3"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#8B2622]/30 m-3"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-[#8B2622]/30 m-3"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#8B2622]/30 m-3"></div>

              <div className="relative rounded-none p-6 sm:p-10 flex flex-col items-center justify-center min-h-[400px]">
                <AnimatePresence mode="wait">
                  {!imagePreview ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center w-full"
                    >
                      <button
                        onClick={handleUploadClick}
                        className="w-24 h-24 rounded-full border border-[dashed] border-[#2C2420]/30 flex items-center justify-center text-[#2C2420] hover:bg-[#8B2622]/5 hover:border-[#8B2622]/50 hover:text-[#8B2622] hover:scale-105 transition-all duration-300 bg-[#FDFCF8]"
                      >
                        <Upload className="w-8 h-8" strokeWidth={1} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="mt-8 text-center">
                        <p className="text-[#2C2420] font-bold mb-2 text-lg">Tải lên ảnh cần phân tích</p>
                        <p className="text-[#2C2420]/50 text-sm font-sans">Định dạng JPG, PNG. Chụp rõ nét phần cần xem.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="relative w-full max-w-sm overflow-hidden ring-1 shadow-xl bg-[#FDFCF8] ring-[#2C2420]/10 p-2">
                        <img 
                          src={imagePreview} 
                          alt="Face Preview" 
                          className="w-full h-auto object-cover aspect-[3/4]"
                        />
                        {loading && (
                          <div className="absolute inset-0 bg-[#FDFCF8]/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-[#8B2622]/20 m-2">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <div className="absolute inset-0 border-t-2 border-[#8B2622] rounded-full animate-spin"></div>
                              <ScanFace className="w-6 h-6 text-[#8B2622] animate-pulse" strokeWidth={1.5} />
                            </div>
                            <p className="text-[#8B2622] mt-4 font-sans font-bold uppercase tracking-widest text-xs">Đang xem tướng...</p>
                          </div>
                        )}
                      </div>

                      {!loading && !result && (
                         <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                          <button
                            onClick={handleAnalyze}
                            className="flex-1 bg-[#2C2420] hover:bg-[#4A3B35] text-white font-sans font-bold uppercase tracking-widest text-xs py-4 px-6 flex items-center justify-center gap-2 transition-colors shadow-lg"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Luận Giải</span>
                          </button>
                          <button
                            onClick={handleReset}
                            className="w-14 h-[52px] border border-[#2C2420] hover:bg-[#2C2420]/5 text-[#2C2420] rounded-none flex items-center justify-center transition-colors"
                            aria-label="Chọn ảnh khác"
                          >
                            <RefreshCcw className="w-5 h-5" strokeWidth={1.5} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {error && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-6 bg-[#8B2622]/5 border-l-2 border-[#8B2622] text-[#8B2622] px-5 py-4 flex items-start gap-3 shadow-sm"
               >
                 <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                 <p className="text-sm leading-relaxed">{error}</p>
               </motion.div>
            )}
          </div>

          {/* Right Column: Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="md:col-span-8"
              >
                <div className="border border-[#2C2420]/10 bg-[#FDFCF8] p-8 sm:p-12 shadow-xl relative min-h-[400px]">
                  
                  <div className="flex items-center gap-3 mb-8 border-b border-[#2C2420]/10 pb-6">
                    <span className="text-[#8B2622] uppercase font-sans font-bold tracking-widest text-xs opacity-60">Luận Giải</span>
                    <h3 className="text-3xl font-bold tracking-tighter ml-auto">KẾT QUẢ</h3>
                  </div>

                  <div className="prose prose-stone max-w-none">
                     <div className="markdown-body text-[#2C2420] leading-relaxed space-y-6">
                        <ReactMarkdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold text-[#8B2622] font-serif border-b border-[#2C2420]/10 pb-2 mt-8 mb-4 uppercase" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold text-[#2C2420] font-serif mt-8 mb-4 tracking-tight" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold text-[#2C2420] font-serif" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-[#8B2622] font-bold" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-none pl-0 space-y-4" {...props} />,
                            li: ({node, ...props}) => (
                               <li className="pl-4 border-l-2 border-[#2C2420]/10 relative before:content-[''] before:absolute before:left-[-2px] before:top-2 before:h-2 before:w-[2px] hover:before:bg-[#8B2622] transition-colors" {...props} />
                            ),
                            p: ({node, ...props}) => <p className="mb-4 last:mb-0 text-base" {...props} />
                          }}
                        >
                          {result}
                        </ReactMarkdown>
                     </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-[#2C2420]/10 flex justify-end">
                    <button
                      onClick={handleReset}
                      className="text-[10px] uppercase font-sans tracking-widest font-bold text-[#2C2420]/60 hover:text-[#8B2622] transition-colors flex items-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" strokeWidth={1.5} />
                      Xem Tướng Mới
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer Bar */}
      <footer className="mt-auto h-16 border-t border-[#2C2420]/10 flex items-center max-w-5xl px-6 w-full mx-auto justify-between text-[10px] uppercase tracking-widest opacity-50 font-sans">
        <span>© 2026 Ma Y Thần Tướng • Digital Edition</span>
        <div className="hidden sm:flex gap-6">
          <span>Tài liệu tham khảo: Trần Đoàn Hi Di</span>
          <span>Phiên bản 1.0.4</span>
        </div>
      </footer>
    </div>
  );
}

// Helper to convert File to base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = reader.result?.toString().replace(/^data:(.*,)?/, "");
      if (encoded && encoded.length % 4 > 0) {
        encoded += "=".repeat(4 - (encoded.length % 4));
      }
      resolve(encoded || "");
    };
    reader.onerror = (error) => reject(error);
  });
}
