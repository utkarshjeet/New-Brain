"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, RefreshCcw, Sparkles, AlertCircle, FileText, CalendarDays, Plus, Tag } from "lucide-react";

export default function Dashboard() {
  const [thoughts, setThoughts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  
  // Filter state
  const [filter, setFilter] = useState("All");

  // New Thought Form State
  const [newThought, setNewThought] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchThoughts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/thoughts");
      const data = await res.json();
      if (data.thoughts) setThoughts(data.thoughts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThoughts();
  }, []);

  const handleProcess = async () => {
    setProcessing(true);
    setStatus("Analyzing with Gemini...");
    try {
      const res = await fetch("/api/process", { method: "POST" });
      const data = await res.json();
      if (data.count > 0) {
        setStatus(`Successfully clarified ${data.count} new thought(s)!`);
        await fetchThoughts();
      } else {
        setStatus("Everything is up to date! Nothing new to process.");
      }
    } catch (error) {
      setStatus("Failed to process thoughts.");
    } finally {
      setProcessing(false);
      setTimeout(() => setStatus(""), 4000);
    }
  };

  const handlePostThought = async () => {
    if (!newThought.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/thoughts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawThought: newThought, category: newCategory }),
      });
      if (res.ok) {
        setNewThought("");
        setNewCategory("");
        await fetchThoughts();
        // Automatically process standardizes experience
        handleProcess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPosting(false);
    }
  };

  // Derive categories for filter
  const categoriesMap = new Set(thoughts.map(t => t.category).filter(Boolean));
  const categories = ["All", ...Array.from(categoriesMap)];

  const filteredThoughts = filter === "All" ? thoughts : thoughts.filter(t => t.category === filter);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-400">
                <BrainCircuit size={28} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                Second Brain
              </h1>
            </div>
            <p className="text-neutral-400 ml-1">Your raw confusion, converted into clear wisdom.</p>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {processing ? (
              <RefreshCcw className="animate-spin" size={18} />
            ) : (
              <Sparkles size={18} className="text-indigo-600" />
            )}
            {processing ? "Processing..." : "Run AI Clarity"}
          </button>
        </div>

        {status && (
          <div className="mb-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-indigo-300 animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={20} />
            <p className="font-medium">{status}</p>
          </div>
        )}

        {/* Add New Thought Form */}
        <div className="mb-12 bg-neutral-900 border border-white/10 rounded-2xl p-6 focus-within:border-indigo-500/50 transition-colors">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-indigo-400" />
            Capture New Thought
          </h2>
          <div className="space-y-4">
            <textarea
              className="w-full bg-neutral-950 border border-white/10 rounded-xl p-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              rows={3}
              placeholder="What's on your mind? Don't worry about structuring it perfectly..."
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Category (optional)"
                  className="bg-neutral-950 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <button
                onClick={handlePostThought}
                disabled={isPosting || !newThought.trim()}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPosting ? <RefreshCcw className="animate-spin" size={16} /> : "Save & Clarify"}
              </button>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        {!loading && categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat as string}
                onClick={() => setFilter(cat as string)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === cat
                    ? "bg-white text-neutral-950"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Box */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-48 border border-white/5" />
            ))}
          </div>
        ) : filteredThoughts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <FileText size={48} className="mx-auto text-neutral-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No thoughts found</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {filter === "All" ? "Start by adding a new thought above." : `No thoughts found in "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredThoughts.map((thought) => (
              <div
                key={thought.id}
                className="group relative bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-lg"
              >
                {/* Status Bar */}
                {thought.aiRewrite ? (
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                ) : (
                  <div className="h-1 w-full bg-neutral-800" />
                )}

                <div className="p-6 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-white/5 text-xs font-medium uppercase tracking-wider text-neutral-300 rounded-full border border-white/10">
                        {thought.category || "Uncategorized"}
                      </span>
                      <div className="flex items-center text-xs text-neutral-500 gap-1.5">
                        <CalendarDays size={14} />
                        {thought.date}
                      </div>
                    </div>
                    {thought.aiRewrite ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                        <Sparkles size={12} /> Clarified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                        <RefreshCcw size={12} /> Pending AI
                      </span>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Raw Input */}
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-500 mb-3 uppercase tracking-wider">Raw Thought</h4>
                      <p className="text-neutral-300 leading-relaxed font-serif italic text-lg opacity-80 decoration-white/10 underline-offset-4">
                        "{thought.rawThought}"
                      </p>
                    </div>

                    {/* AI Output */}
                    <div className="relative">
                      {!thought.aiRewrite ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm rounded-xl border border-white/5">
                          <p className="text-sm font-medium text-neutral-400 flex flex-col items-center gap-2">
                            <BrainCircuit className="opacity-50" size={24} />
                            Awaiting processing
                          </p>
                        </div>
                      ) : null}

                      <div className={!thought.aiRewrite ? 'opacity-20 pointer-events-none' : ''}>
                        <h4 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                          <Sparkles size={14} /> Refined Wisdom
                        </h4>
                        
                        <p className="text-neutral-100 text-lg leading-relaxed mb-6 font-medium">
                          {thought.aiRewrite || "Pending..."}
                        </p>
                        
                        <div className="mt-4 p-4 rounded-xl bg-neutral-950 border border-white/5 border-l-2 border-l-indigo-500">
                           <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Core Summary</h5>
                           <p className="text-sm font-medium text-neutral-300">{thought.summary}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
