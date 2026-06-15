import { useState, useRef } from "react";

// ── Tone palette for output cards ──────────────────────────────────────────
const OUTPUT_TYPES = [
  { id: "tweets",     label: "Tweet thread",      icon: "ti-brand-x",          accent: "#1D9E75", accentBg: "#E1F5EE", accentText: "#085041" },
  { id: "linkedin",   label: "LinkedIn post",     icon: "ti-brand-linkedin",   accent: "#185FA5", accentBg: "#E6F1FB", accentText: "#0C447C" },
  { id: "newsletter", label: "Email newsletter",  icon: "ti-mail",             accent: "#854F0B", accentBg: "#FAEEDA", accentText: "#633806" },
  { id: "summary",    label: "TL;DR summary",     icon: "ti-align-left",       accent: "#534AB7", accentBg: "#EEEDFE", accentText: "#3C3489" },
  { id: "hooks",      label: "5 hook variations", icon: "ti-hook",             accent: "#993C1D", accentBg: "#FAECE7", accentText: "#712B13" },
  { id: "captions",   label: "Short-form captions", icon: "ti-camera",         accent: "#3B6D11", accentBg: "#EAF3DE", accentText: "#27500A" },
];

const EXAMPLES = [
  "How I grew my newsletter from 0 to 10,000 subscribers in 6 months without paid ads — I posted consistently, built a referral loop, and obsessed over the subject line.",
  "The problem with most productivity advice is it optimizes for busyness, not output. Real leverage comes from identifying the one task that makes all other tasks easier or irrelevant.",
  "We just shipped our biggest product update in two years. Here's what we learned from 18 months of user research, 3 failed prototypes, and one very honest beta cohort.",
];

function Tag({ label, bg, color }) {
  return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: bg, color, fontWeight: 500 }}>{label}</span>;
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <button onClick={copy} style={{ fontSize: 12, padding: "5px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: copied ? "#1D9E75" : "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", transition: "color 0.2s" }}>
      <i className={copied ? "ti ti-check" : "ti ti-copy"} aria-hidden="true" style={{ fontSize: 13 }} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function OutputCard({ type, content, loading }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: 8, background: type.accentBg }}>
        <i className={`ti ${type.icon}`} aria-hidden="true" style={{ fontSize: 16, color: type.accent }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: type.accentText }}>{type.label}</span>
      </div>
      <div style={{ padding: "14px 16px", flex: 1 }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[100, 85, 92, 70].map((w, i) => (
              <div key={i} style={{ height: 12, borderRadius: 6, background: "var(--color-background-secondary)", width: `${w}%`, animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : content ? (
          <>
            <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75, whiteSpace: "pre-wrap", marginBottom: 12 }}>{content}</div>
            <CopyBtn text={content} />
          </>
        ) : (
          <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Will appear here after generation</div>
        )}
      </div>
    </div>
  );
}

function HistoryItem({ item, onReload }) {
  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.input}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.types.map(t => <Tag key={t.id} label={t.label} bg={t.accentBg} color={t.accentText} />)}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6 }}>{item.time}</div>
          <button onClick={() => onReload(item)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Reload →</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("repurpose");
  const [input, setInput] = useState("");
  const [selectedTypes, setSelectedTypes] = useState(["tweets", "linkedin", "newsletter", "summary"]);
  const [outputs, setOutputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [tone, setTone] = useState("professional");
  const [toast, setToast] = useState("");
  const outputRef = useRef(null);

  const toggleType = (id) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const generate = async () => {
    if (!input.trim() || selectedTypes.length === 0) return;
    setLoading(true);
    setOutputs({});
    setView("repurpose");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    const activeTypes = OUTPUT_TYPES.filter(t => selectedTypes.includes(t.id));

    const systemPrompt = `You are an expert content strategist and copywriter. Given a piece of content, repurpose it into multiple formats for different platforms. Tone: ${tone}. Be specific, punchy, and platform-native. Never be generic.`;

    const formatInstructions = activeTypes.map(t => {
      const guides = {
        tweets:     "A 5-tweet thread. Start with a hook tweet. Number each tweet (1/5, 2/5 etc). Max 280 chars each. End with a CTA.",
        linkedin:   "A LinkedIn post. Open with a 1-line hook (no 'I' as first word). Use short paragraphs. Include 3-5 relevant hashtags at end. 150-250 words.",
        newsletter: "An email newsletter section. Subject line on line 1 (prefix: Subject: ). Then a 200-word body with one clear CTA link placeholder [CTA].",
        summary:    "A TL;DR summary in exactly 5 bullet points. Each bullet is one key insight, max 15 words.",
        hooks:      "5 different opening hook sentences for social media. Each on its own line, numbered. Vary the angle: curiosity, contrarian, story, stat, direct.",
        captions:   "3 short-form captions (Instagram/TikTok). Each under 50 words. Include relevant emojis. Separate with ---",
      };
      return `\n\n[${t.id.toUpperCase()}]\n${guides[t.id]}`;
    }).join("");

    const userMsg = `Here is the original content to repurpose:\n\n"""\n${input}\n"""\n\nGenerate the following formats. Use the exact section headers shown:\n${formatInstructions}\n\nReturn ONLY the content for each section with the headers. No preamble.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(b => b.text || "").join("") || "";

      // Parse sections by [TYPE] headers
      const parsed = {};
      activeTypes.forEach(t => {
        const regex = new RegExp(`\\[${t.id.toUpperCase()}\\]([\\s\\S]*?)(?=\\[[A-Z_]+\\]|$)`, "i");
        const match = raw.match(regex);
        parsed[t.id] = match ? match[1].trim() : "Could not parse this section. Try regenerating.";
      });
      setOutputs(parsed);

      setHistory(h => [{
        id: Date.now(),
        input: input.slice(0, 120) + (input.length > 120 ? "…" : ""),
        types: activeTypes,
        outputs: parsed,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tone,
      }, ...h].slice(0, 30));
    } catch (e) {
      showToast("Error: " + e.message);
    }
    setLoading(false);
  };

  const reloadFromHistory = (item) => {
    setInput(item.input);
    setSelectedTypes(item.types.map(t => t.id));
    setOutputs(item.outputs);
    setTone(item.tone || "professional");
    setView("repurpose");
  };

  const exportAll = () => {
    const text = OUTPUT_TYPES.filter(t => outputs[t.id]).map(t => `## ${t.label}\n\n${outputs[t.id]}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "repurposed-content.txt"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported!");
  };

  const nav = [
    { id: "repurpose", icon: "ti-repeat", label: "Repurpose" },
    { id: "history",   icon: "ti-history",   label: "History" },
  ];

  const hasOutputs = Object.keys(outputs).length > 0;
  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div style={{ fontFamily: "var(--font-sans)", minHeight: "100vh", background: "var(--color-background-tertiary)", display: "grid", gridTemplateColumns: "200px 1fr" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        textarea:focus { outline: none; border-color: #7F77DD !important; }
        input:focus { outline: none; border-color: #7F77DD !important; }
        button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--color-border-secondary); border-radius: 4px; }
      `}</style>

      {/* Sidebar */}
      <div style={{ background: "var(--color-background-primary)", borderRight: "0.5px solid var(--color-border-tertiary)", display: "flex", flexDirection: "column", padding: "0 0 20px" }}>
        <div style={{ padding: "22px 16px 18px", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: "var(--color-text-primary)", letterSpacing: "-0.3px" }}>
            <span style={{ color: "#7F77DD" }}>re</span>cast
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>AI content repurposer</div>
        </div>
        {nav.map(n => (
          <div key={n.id} onClick={() => setView(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", fontSize: 13, color: view === n.id ? "#3C3489" : "var(--color-text-secondary)", background: view === n.id ? "#EEEDFE" : "transparent", cursor: "pointer", fontWeight: view === n.id ? 500 : 400, borderLeft: view === n.id ? "2px solid #7F77DD" : "2px solid transparent" }}>
            <i className={`ti ${n.icon}`} aria-hidden="true" style={{ fontSize: 16 }} />
            {n.label}
            {n.id === "history" && history.length > 0 && <span style={{ marginLeft: "auto", fontSize: 11, background: "#EEEDFE", color: "#534AB7", borderRadius: 20, padding: "1px 7px", fontWeight: 500 }}>{history.length}</span>}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)", fontSize: 12 }}>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 6 }}>Free plan</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 4, background: "var(--color-background-secondary)" }}>
              <div style={{ width: `${Math.min(history.length / 10 * 100, 100)}%`, height: "100%", borderRadius: 4, background: "#7F77DD" }} />
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{history.length}/10</span>
          </div>
          <div style={{ color: "#534AB7", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Upgrade to Pro →</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* Topbar */}
        <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>{view === "repurpose" ? "Repurpose content" : "History"}</div>
          {hasOutputs && view === "repurpose" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={exportAll} style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-primary)", cursor: "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 6 }}>
                <i className="ti ti-download" aria-hidden="true" style={{ fontSize: 13 }} />Export all
              </button>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: "absolute", top: 16, right: 24, background: "#1D9E75", color: "#fff", fontSize: 13, padding: "8px 16px", borderRadius: 8, zIndex: 100, fontWeight: 500 }}>{toast}</div>
        )}

        <div style={{ padding: 24, flex: 1 }}>

          {view === "repurpose" && (
            <>
              {/* Input area */}
              <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "20px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Your content</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setInput(ex)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                        Example {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Paste a blog post, transcript, tweet, idea, or any text you want to repurpose across platforms…"
                  style={{ width: "100%", minHeight: 140, fontSize: 14, padding: "12px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", lineHeight: 1.7, resize: "vertical", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{wordCount} words · {charCount} chars</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Tone</span>
                      {["professional", "casual", "bold"].map(t => (
                        <button key={t} onClick={() => setTone(t)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, border: `0.5px solid ${tone === t ? "#AFA9EC" : "var(--color-border-secondary)"}`, background: tone === t ? "#EEEDFE" : "transparent", color: tone === t ? "#3C3489" : "var(--color-text-secondary)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: tone === t ? 500 : 400 }}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Format picker */}
              <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Formats to generate</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {OUTPUT_TYPES.map(t => {
                    const on = selectedTypes.includes(t.id);
                    return (
                      <div key={t.id} onClick={() => toggleType(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `${on ? "2px" : "0.5px"} solid ${on ? t.accent : "var(--color-border-tertiary)"}`, background: on ? t.accentBg : "var(--color-background-primary)", cursor: "pointer", transition: "all 0.15s" }}>
                        <i className={`ti ${t.icon}`} aria-hidden="true" style={{ fontSize: 16, color: on ? t.accent : "var(--color-text-tertiary)" }} />
                        <span style={{ fontSize: 13, color: on ? t.accentText : "var(--color-text-secondary)", fontWeight: on ? 500 : 400 }}>{t.label}</span>
                        {on && <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 13, color: t.accent, marginLeft: "auto" }} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={generate}
                    disabled={loading || !input.trim() || selectedTypes.length === 0}
                    style={{ fontSize: 14, padding: "10px 28px", borderRadius: 8, border: "none", background: loading || !input.trim() ? "var(--color-background-secondary)" : "#7F77DD", color: loading || !input.trim() ? "var(--color-text-tertiary)" : "#fff", cursor: loading || !input.trim() ? "default" : "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {loading ? <><i className="ti ti-loader" aria-hidden="true" style={{ fontSize: 15 }} />Generating…</> : <><i className="ti ti-sparkles" aria-hidden="true" style={{ fontSize: 15 }} />Generate {selectedTypes.length} format{selectedTypes.length !== 1 ? "s" : ""}</>}
                  </button>
                </div>
              </div>

              {/* Outputs */}
              {(loading || hasOutputs) && (
                <div ref={outputRef}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Generated content</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {OUTPUT_TYPES.filter(t => selectedTypes.includes(t.id)).map(t => (
                      <OutputCard key={t.id} type={t} content={outputs[t.id]} loading={loading} />
                    ))}
                  </div>
                </div>
              )}

              {!loading && !hasOutputs && (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-tertiary)" }}>
                  <i className="ti ti-repeat" aria-hidden="true" style={{ fontSize: 36, display: "block", marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>Paste content above, pick your formats, and hit Generate.</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Try one of the examples to see it in action.</div>
                </div>
              )}
            </>
          )}

          {view === "history" && (
            <>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-tertiary)" }}>
                  <i className="ti ti-history" aria-hidden="true" style={{ fontSize: 36, display: "block", marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>No runs yet. Head to Repurpose and generate your first batch.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{history.length} run{history.length !== 1 ? "s" : ""}</div>
                  {history.map(item => <HistoryItem key={item.id} item={item} onReload={reloadFromHistory} />)}
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
