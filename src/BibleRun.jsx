import { useState, useEffect, useRef, useCallback } from "react";
import { Crown, BookOpen, Timer, Trophy, LogOut, Check, X, Medal, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Globe2, ChevronRight } from "lucide-react";

const SUPABASE_URL = "https://mhgnikriicjamwmxdjdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_qZQ3fm0Xs6uFGEMYg-RoSg_g-PktFsf";
const QUESTION_SECONDS = 30;
// Testläge: enkel klientkod som lås för admin-panelen tills riktig adminroll/inloggning byggs.
// Denna kod syns i källkoden och är INTE säker - måste ersättas med riktig serverbaserad
// adminautentisering innan appen går skarpt.
const ADMIN_PASSCODE = "biblerun-admin-2026";

async function generateWithClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`AI-anropet misslyckades (${res.status})`);
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return text;
}

function parseGeneratedQuestions(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Kunde inte tolka AI-svaret som en frågelista.");
  const jsonSlice = cleaned.slice(start, end + 1);
  const parsed = JSON.parse(jsonSlice);
  if (!Array.isArray(parsed)) throw new Error("AI-svaret var inte en lista.");
  const required = ["question", "option_a", "option_b", "option_c", "option_d", "correct_option"];
  return parsed.filter((q) => required.every((k) => typeof q[k] === "string" && q[k].trim().length > 0));
}


const BG_IMAGE = "data:image/jpeg;base64,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";

const COUNTRIES = [
  { code: "SE", name: "Sverige", flag: "🇸🇪" },
  { code: "NO", name: "Norge", flag: "🇳🇴" },
  { code: "DK", name: "Danmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Något gick fel (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function LockViewport() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    const hadMeta = Boolean(meta);
    const prevContent = meta?.getAttribute("content") || null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
    );

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;
    const prevOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";

    function preventPinchZoom(e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }
    let lastTouchEnd = 0;
    function preventDoubleTapZoom(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    }
    document.addEventListener("touchmove", preventPinchZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      if (hadMeta) meta.setAttribute("content", prevContent || "");
      else meta.remove();
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.height = prevHtmlHeight;
      body.style.height = prevBodyHeight;
      body.style.overscrollBehavior = prevOverscroll;
      document.removeEventListener("touchmove", preventPinchZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);
  return null;
}

function GoogleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}



function Backdrop({ children, showPhoto }) {
  return (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden text-amber-50"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <LockViewport />
      {showPhoto ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundColor: "#020711" }}
          />
          <div className="absolute inset-0 bg-slate-950/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-950" />
      )}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">{children}</div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-600/70" />
      <div className="h-1.5 w-1.5 rotate-45 bg-amber-500" />
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-600/70" />
    </div>
  );
}

function GoldButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 py-3 font-serif text-lg font-bold text-slate-950 shadow-lg shadow-amber-900/40 transition hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div
        className={`max-h-[85vh] w-full ${wide ? "max-w-2xl" : "max-w-[560px]"} overflow-y-auto rounded-2xl border border-amber-700/40 bg-slate-950 p-6 font-sans text-amber-50 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-amber-200">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Stäng" className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FooterNav({ onSelect }) {
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-sans text-xs text-amber-300/70">
      <button type="button" onClick={() => onSelect("about")} className="hover:text-amber-200 hover:underline">Om oss</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("donate")} className="hover:text-amber-200 hover:underline">Skicka en gåva</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("contact")} className="hover:text-amber-200 hover:underline">Kontakta oss</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("admin")} className="hover:text-amber-200 hover:underline">Admin</button>
    </nav>
  );
}

export default function BibleRun() {
  const [screen, setScreen] = useState("auth");
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("SE");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [player, setPlayer] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const timerRef = useRef(null);

  const [oauthLoading, setOauthLoading] = useState(false);

  const [footerModal, setFooterModal] = useState(null); // null | 'about' | 'donate' | 'contact' | 'admin'
  const [activeQuestionCount, setActiveQuestionCount] = useState(null);
  const [shareStatus, setShareStatus] = useState("");
  const [readyError, setReadyError] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState("");

  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminTab, setAdminTab] = useState("generate"); // generate | pending | published
  const [adminStats, setAdminStats] = useState({ pending: 0, approved: 0, active: 0, total: 0 });
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [publishedQuestions, setPublishedQuestions] = useState([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [genError, setGenError] = useState("");
  const [genRounds, setGenRounds] = useState(6);
  const genStopRef = useRef(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function startOAuth(provider) {
    const redirectTo = window.location.href.split("#")[0];
    const url = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.href = url;
  }

  const handleOAuthCallback = useCallback(async (accessToken) => {
    setOauthLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Kunde inte hämta kontoinformation från inloggningen.");
      const oauthUser = await res.json();

      const upserted = await sb("rpc/oauth_upsert_player", {
        method: "POST",
        body: JSON.stringify({
          p_id: oauthUser.id,
          p_display_name: oauthUser.user_metadata?.full_name || oauthUser.user_metadata?.name || oauthUser.email?.split("@")[0] || "Spelare",
          p_email: oauthUser.email || null,
          p_country_code: "SE",
        }),
      });
      const playerRow = upserted[0];
      setPlayer(playerRow);
      setScreen("ready");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (err) {
      setAuthError(err.message || "Inloggningen misslyckades. Försök igen.");
    } finally {
      setOauthLoading(false);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) handleOAuthCallback(accessToken);
    }
  }, [handleOAuthCallback]);

  async function handleAuthSubmit(e) {
    e?.preventDefault?.();
    setAuthError("");
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailValid) return setAuthError("Skriv en giltig e-postadress.");
    if (authMode === "signup" && cleanName.length < 2) return setAuthError("Skriv ditt namn (minst 2 tecken).");
    if (password.length < 4) return setAuthError("Lösenordet måste vara minst 4 tecken.");

    setAuthLoading(true);
    try {
      const hash = await sha256Hex(password);
      if (authMode === "signup") {
        try {
          const created = await sb("rpc/signup_player", {
            method: "POST",
            body: JSON.stringify({ p_display_name: cleanName, p_email: cleanEmail, p_country_code: country, p_password_hash: hash }),
          });
          setPlayer(created[0]);
          setScreen("ready");
        } catch (err) {
          if (err.message.includes("email_taken")) {
            setAuthError("Det finns redan ett konto med den e-postadressen. Logga in istället.");
          } else if (err.message.includes("name_taken")) {
            setAuthError("Namnet är redan taget. Välj ett annat.");
          } else {
            throw err;
          }
        }
      } else {
        const rows = await sb("rpc/login_player", {
          method: "POST",
          body: JSON.stringify({ p_email: cleanEmail, p_password_hash: hash }),
        });
        if (rows.length === 0) {
          setAuthError("Fel e-post eller lösenord.");
          setAuthLoading(false);
          return;
        }
        setPlayer(rows[0]);
        setScreen("ready");
      }
    } catch (err) {
      setAuthError(err.message || "Något gick fel. Försök igen.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResetSubmit(e) {
    e?.preventDefault?.();
    setResetError("");
    const cleanEmail = resetEmail.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailValid) return setResetError("Skriv en giltig e-postadress.");
    if (resetNewPassword.length < 4) return setResetError("Nya lösenordet måste vara minst 4 tecken.");

    setResetLoading(true);
    try {
      const hash = await sha256Hex(resetNewPassword);
      const updated = await sb("rpc/reset_player_password", {
        method: "POST",
        body: JSON.stringify({ p_email: cleanEmail, p_new_password_hash: hash }),
      });
      if (!updated) {
        setResetError("Hittade inget konto med den e-postadressen.");
        setResetLoading(false);
        return;
      }
      setResetSuccess(true);
    } catch (err) {
      setResetError(err.message || "Något gick fel. Försök igen.");
    } finally {
      setResetLoading(false);
    }
  }

  function backToLogin() {
    setResetMode(false);
    setResetSuccess(false);
    setResetEmail("");
    setResetNewPassword("");
    setResetError("");
    setAuthMode("login");
  }

  function logout() {
    setPlayer(null);
    setName("");
    setEmail("");
    setPassword("");
    setAuthMode("login");
    setResetMode(false);
    setResetSuccess(false);
    setScreen("auth");
  }

  async function startGame() {
    setLoadingQuiz(true);
    setReadyError("");
    try {
      const qs = await sb("questions?status=eq.approved&is_active=eq.true&order=sort_order.asc&select=*");
      if (qs.length === 0) {
        setReadyError("Inga frågor är publicerade just nu. Försök igen senare.");
        setLoadingQuiz(false);
        return;
      }
      setQuestions(qs);
      setQIndex(0);
      setScore(0);
      setCorrectCount(0);
      setSelected(null);
      setLocked(false);
      setTimeLeft(QUESTION_SECONDS);
      setScreen("quiz");
    } catch (err) {
      setReadyError(err.message || "Kunde inte hämta frågor. Försök igen.");
    } finally {
      setLoadingQuiz(false);
    }
  }

  const handleAnswer = useCallback(
    (optionKey) => {
      if (locked) return;
      setLocked(true);
      clearTimeout(timerRef.current);
      const q = questions[qIndex];
      const isCorrect = optionKey === q.correct_option;
      const gained = isCorrect ? 100 + timeLeft * 3 : 0;
      const newScore = score + gained;
      const newCorrect = correctCount + (isCorrect ? 1 : 0);
      setSelected(optionKey);
      setScore(newScore);
      if (isCorrect) setCorrectCount(newCorrect);

      setTimeout(() => {
        if (qIndex + 1 < questions.length) {
          setQIndex((i) => i + 1);
          setSelected(null);
          setLocked(false);
          setTimeLeft(QUESTION_SECONDS);
        } else {
          finishGame(newScore, newCorrect);
        }
      }, 1400);
    },
    [locked, questions, qIndex, timeLeft, score, correctCount]
  );

  async function finishGame(finalScore, finalCorrect) {
    setScreen("result");
    try {
      await sb("game_sessions", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({
          player_id: player.id,
          score: finalScore,
          correct_count: finalCorrect,
          total_questions: questions.length,
        }),
      });
    } catch {
      // Resultatet visas ändå i UI:t även om sparningen mot databasen skulle strula.
    }
  }

  useEffect(() => {
    if (screen !== "quiz" || locked) return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [screen, timeLeft, locked, handleAnswer]);

  async function openLeaderboard() {
    setScreen("leaderboard");
    setLeaderboardLoading(true);
    try {
      const rows = await sb("leaderboard?select=*&order=best_score.desc&limit=10");
      setLeaderboard(rows);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }

  useEffect(() => {
    if (screen !== "ready") return;
    sb("questions?status=eq.approved&is_active=eq.true&select=id")
      .then((rows) => setActiveQuestionCount(rows.length))
      .catch(() => setActiveQuestionCount(null));
  }, [screen]);

  async function submitContactForm(e) {
    e?.preventDefault?.();
    setContactError("");
    const cleanEmail = contactEmail.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailValid) return setContactError("Skriv en giltig e-postadress.");
    if (contactMessage.trim().length < 5) return setContactError("Skriv ett meddelande.");
    setContactSending(true);
    try {
      await sb("contact_messages", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ name: contactName.trim() || null, email: cleanEmail, message: contactMessage.trim() }),
      });
      setContactSent(true);
    } catch (err) {
      setContactError(err.message || "Kunde inte skicka meddelandet. Försök igen.");
    } finally {
      setContactSending(false);
    }
  }

  function openFooterModal(key) {
    setFooterModal(key);
    if (key === "admin" && adminAuthed) loadAdminData();
  }

  async function shareResult() {
    const text = `Jag fick ${score} poäng (${correctCount}/${questions.length} rätt) i Bible Run! Klarar du bättre?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bible Run", text, url: window.location.href.split("#")[0] });
        return;
      } catch {
        // användaren avbröt delningen - faller igenom till kopiera-länk nedan
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${window.location.href.split("#")[0]}`);
      setShareStatus("Kopierat! Klistra in var du vill dela det.");
    } catch {
      setShareStatus(text);
    }
    setTimeout(() => setShareStatus(""), 4000);
  }


  function closeFooterModal() {
    setFooterModal(null);
    setContactSent(false);
    setContactError("");
    setAdminError("");
    setGenError("");
  }

  function handleAdminLogin(e) {
    e?.preventDefault?.();
    if (adminPasscodeInput.trim() === ADMIN_PASSCODE) {
      setAdminAuthed(true);
      setAdminError("");
      loadAdminData();
    } else {
      setAdminError("Fel kod.");
    }
  }

  async function loadAdminData() {
    setAdminListLoading(true);
    try {
      const [pending, published, allQ] = await Promise.all([
        sb("questions?status=eq.pending&order=created_at.desc&select=*"),
        sb("questions?status=eq.approved&order=sort_order.asc&select=*"),
        sb("questions?select=id,status,is_active"),
      ]);
      setPendingQuestions(pending);
      setPublishedQuestions(published);
      setAdminStats({
        pending: allQ.filter((r) => r.status === "pending").length,
        approved: allQ.filter((r) => r.status === "approved").length,
        active: allQ.filter((r) => r.status === "approved" && r.is_active).length,
        total: allQ.length,
      });
    } catch (err) {
      setAdminError(err.message || "Kunde inte hämta frågor.");
    } finally {
      setAdminListLoading(false);
    }
  }

  async function generateQuestionBatch() {
    setGenLoading(true);
    setGenError("");
    setGenProgress("Förbereder…");
    genStopRef.current = false;
    try {
      const existingRows = await sb("questions?select=question&limit=400&order=created_at.desc");
      const existingTitles = existingRows.map((r) => r.question);
      const categories = ["Nya testamentet"];
      let totalInserted = 0;
      const ROUNDS = Math.min(40, Math.max(1, genRounds));
      for (let i = 0; i < ROUNDS; i++) {
        if (genStopRef.current) {
          setGenProgress(`Stoppat. ${totalInserted} nya frågor väntar på godkännande.`);
          break;
        }
        setGenProgress(`Genererar omgång ${i + 1} av ${ROUNDS} (${totalInserted} sparade hittills)…`);
        const focusCategory = categories[i % categories.length];
        const avoidList = existingTitles.slice(0, 60).join(" | ").slice(0, 1800);
        const prompt = `Du är redaktör för ett bibelkunskaps-quiz. Generera exakt 5 nya flervalsfrågor på svenska om Bibeln.

STRIKT KÄLLREGEL - detta är obligatoriskt:
- Använd ENDAST innehåll från Nya testamentet, baserat på King James Version, Douay-Rheims, Eastern Orthodox Bible eller Reformationsbibeln (de fyra Nya testamentet-översättningar som är godkända källor för det här quizet)
- Gamla testamentet är HELT FÖRBJUDET - inga frågor om Moses, Noa, David, Abraham, Adam och Eva, Josef, Jona, Simson, Jeriko, eller något annat ur Gamla testamentet
- Gissa aldrig fram bibelfakta du är osäker på - hoppa hellre över en fråga än att riskera fel information

Regler:
- Fyra svarsalternativ (option_a till option_d), endast ett rätt (correct_option: "A"/"B"/"C"/"D")
- "category" ska alltid vara "Nya testamentet"
- "difficulty" ska vara "Grundnivå" eller "Medel"
- "source" ska vara en verklig bok/kapitel-referens ur Nya testamentet, t.ex. "Matteus 5:3-12"
- "original_text" FÅR ENDAST fyllas i med ett kort ordagrant citat om källan är King James Version eller Douay-Rheims (public domain-översättningar). Annars ska den vara null.
- "translation" anges bara om original_text finns (t.ex. "King James Version")
- Variera gärna vinkeln - flera frågor kan utgå från samma person/händelse men fråga om olika saker (vem, var, hur många, vad hände sedan)
- Undvik dessa redan existerande frågor: ${avoidList}

Svara ENDAST med giltig JSON (ingen markdown, inga kommentarer): en array med exakt 5 objekt som har fälten question, option_a, option_b, option_c, option_d, correct_option, category, difficulty, context, correct_explanation, source, translation, original_text, source_url (translation/original_text/source_url kan vara null).`;

        const raw = await generateWithClaude(prompt);
        const items = parseGeneratedQuestions(raw).filter((q) => q.category !== "Gamla testamentet");
        const newOnes = items.filter((q) => !existingTitles.includes(q.question));
        for (const q of newOnes) {
          try {
            await sb("questions", {
              method: "POST",
              prefer: "return=minimal",
              body: JSON.stringify({
                question: q.question,
                option_a: q.option_a,
                option_b: q.option_b,
                option_c: q.option_c,
                option_d: q.option_d,
                correct_option: q.correct_option,
                category: q.category || focusCategory,
                difficulty: q.difficulty || "Grundnivå",
                context: q.context || null,
                correct_explanation: q.correct_explanation || null,
                source: q.source || null,
                translation: q.translation || null,
                original_text: q.original_text || null,
                source_url: q.source_url || null,
                status: "pending",
                is_active: false,
                generated_note: "AI-genererad, väntar på godkännande",
              }),
            });
            existingTitles.push(q.question);
            totalInserted++;
          } catch {
            // hoppa över enskilda rader som inte gick att spara, fortsätt med resten
          }
        }
      }
      if (!genStopRef.current) setGenProgress(`Klart! ${totalInserted} nya frågor väntar på godkännande.`);
      await loadAdminData();
    } catch (err) {
      setGenError(err.message || "Kunde inte generera frågor.");
      setGenProgress("");
    } finally {
      setGenLoading(false);
    }
  }

  function stopGeneration() {
    genStopRef.current = true;
  }

  function startEditing(q) {
    setEditingId(q.id);
    setEditDraft({ ...q });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    try {
      await sb(`questions?id=eq.${editDraft.id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({
          question: editDraft.question,
          option_a: editDraft.option_a,
          option_b: editDraft.option_b,
          option_c: editDraft.option_c,
          option_d: editDraft.option_d,
          correct_option: editDraft.correct_option,
          category: editDraft.category,
          difficulty: editDraft.difficulty,
          context: editDraft.context,
          correct_explanation: editDraft.correct_explanation,
          source: editDraft.source,
        }),
      });
      cancelEditing();
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte spara ändringen.");
    }
  }

  async function approveQuestion(id) {
    try {
      const maxRows = await sb("questions?select=sort_order&order=sort_order.desc&limit=1");
      const nextOrder = (maxRows[0]?.sort_order || 0) + 1;
      await sb(`questions?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ status: "approved", is_active: true, sort_order: nextOrder }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte godkänna frågan.");
    }
  }

  async function rejectQuestion(id) {
    try {
      await sb(`questions?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ status: "rejected", is_active: false }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte avvisa frågan.");
    }
  }

  async function toggleActive(id, current) {
    try {
      await sb(`questions?id=eq.${id}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ is_active: !current }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte uppdatera frågan.");
    }
  }

  const q = questions[qIndex];
  const progressPct = questions.length ? Math.round((qIndex / questions.length) * 100) : 0;
  const playerCountry = COUNTRIES.find((c) => c.code === player?.country_code);
  const options = q ? [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]] : [];
  const correctOption = q ? options.find(([k]) => k === q.correct_option) : null;

  return (
    <Backdrop showPhoto={screen === "auth"}>
      <div className="mx-auto flex max-h-screen w-full max-w-2xl flex-col justify-center overflow-y-auto px-5 py-6">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <Crown className="h-9 w-9 text-amber-400" />
          </div>
          <h1 className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-5xl font-bold tracking-wide text-transparent">
            BIBLE RUN
          </h1>
        </div>

        {screen === "auth" && !resetMode && (
          <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-amber-700/40 bg-slate-950/96 shadow-2xl">
            <div className="px-7 pt-7">
              <h2 className="text-center font-serif text-lg font-semibold text-amber-50">
                {authMode === "signup" ? "Skapa ditt konto" : "Välkommen tillbaka"}
              </h2>
              <p className="mt-1 text-center font-sans text-xs text-slate-400">
                {authMode === "signup" ? "Registrera dig för att börja spela" : "Logga in för att fortsätta spela"}
              </p>

              <div className="mt-5 flex rounded-lg border border-amber-700/40 bg-slate-900/40 p-1 text-sm">
                <button type="button"
                  className={`flex-1 rounded-md py-1.5 font-sans transition ${authMode === "login" ? "bg-amber-500 text-slate-950 font-semibold shadow" : "text-amber-200 hover:text-amber-100"}`}
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                >
                  Logga in
                </button>
                <button type="button"
                  className={`flex-1 rounded-md py-1.5 font-sans transition ${authMode === "signup" ? "bg-amber-500 text-slate-950 font-semibold shadow" : "text-amber-200 hover:text-amber-100"}`}
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                >
                  Nytt konto
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">E-post</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@epost.se"
                      className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-3 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Ditt namn</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Skriv ditt namn"
                        className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-3 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                        maxLength={40}
                      />
                    </div>
                  </div>
                )}

                {authMode === "signup" && (
                  <div>
                    <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Välj land</label>
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-11 w-full appearance-none rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-3 font-sans text-sm text-amber-50 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Lösenord</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => { setResetMode(true); setResetError(""); setResetSuccess(false); setResetEmail(email); }}
                        className="font-sans text-[11px] text-amber-300/80 hover:text-amber-200"
                      >
                        Glömt lösenord?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAuthSubmit(e)}
                      placeholder="Minst 4 tecken"
                      className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-10 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Dölj lösenord" : "Visa lösenord"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-amber-400/80 hover:text-amber-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 font-sans text-xs text-red-400">
                    {authError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAuthSubmit}
                  disabled={authLoading}
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 font-sans text-sm font-bold text-slate-950 shadow-lg shadow-amber-900/40 transition hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {authLoading ? "Ett ögonblick…" : authMode === "signup" ? "Skapa konto" : "Logga in"}
                  {!authLoading && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-amber-700/30" />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-slate-500">eller fortsätt med</span>
                <div className="h-px flex-1 bg-amber-700/30" />
              </div>

              <div className="space-y-2.5 font-sans text-sm">
                <button
                  type="button"
                  onClick={() => startOAuth("google")}
                  disabled={oauthLoading}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-amber-700/40 bg-slate-900/50 font-medium text-amber-100 transition hover:border-amber-400 hover:bg-slate-900/80 disabled:opacity-50"
                >
                  <GoogleIcon className="h-[18px] w-[18px] flex-none" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => startOAuth("facebook")}
                  disabled={oauthLoading}
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-amber-700/40 bg-slate-900/50 font-medium text-amber-100 transition hover:border-amber-400 hover:bg-slate-900/80 disabled:opacity-50"
                >
                  <FacebookIcon className="h-[18px] w-[18px] flex-none" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 border-t border-amber-800/25 bg-slate-900/40 px-7 py-3.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500/70" />
              <p className="font-sans text-[11px] leading-relaxed text-slate-400">
                Testläge: lösenordet sparas i databasen men utan extra säkerhetslager än. Byts till riktig autentisering när admin-delen byggs.
              </p>
            </div>
          </div>
        )}
        {screen === "auth" && !resetMode && <FooterNav onSelect={openFooterModal} />}

        {screen === "auth" && resetMode && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 shadow-2xl">
            <h2 className="mb-1 text-center font-serif text-lg font-bold">Återställ lösenord</h2>
            {!resetSuccess ? (
              <>
                <p className="mb-4 text-center font-sans text-xs text-slate-400">
                  Testläge: du kan sätta ett nytt lösenord direkt genom att ange e-postadressen för kontot. Det här stängs igen när riktig autentisering kopplas på.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-sans uppercase tracking-wide text-amber-300/80">E-post</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="din@epost.se"
                      className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-3 py-2 font-sans text-amber-50 placeholder-slate-500 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-sans uppercase tracking-wide text-amber-300/80">Nytt lösenord</label>
                    <div className="relative">
                      <input
                        type={resetShowPassword ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleResetSubmit(e)}
                        placeholder="Minst 4 tecken"
                        className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-3 py-2 pr-10 font-sans text-amber-50 placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((s) => !s)}
                        aria-label={resetShowPassword ? "Dölj lösenord" : "Visa lösenord"}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-amber-400/80 hover:text-amber-300"
                      >
                        {resetShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {resetError && <p className="font-sans text-sm text-red-400">{resetError}</p>}

                  <GoldButton type="button" onClick={handleResetSubmit} disabled={resetLoading}>
                    {resetLoading ? "Ett ögonblick…" : "Sätt nytt lösenord"}
                  </GoldButton>
                </div>
                <button type="button"
                  onClick={backToLogin}
                  className="mt-3 w-full text-center font-sans text-xs text-amber-300/80 hover:text-amber-200"
                >
                  Tillbaka till inloggning
                </button>
              </>
            ) : (
              <>
                <p className="mb-4 text-center font-sans text-sm text-green-400">
                  Lösenordet är uppdaterat! Du kan nu logga in med det nya lösenordet.
                </p>
                <GoldButton onClick={backToLogin}>Till inloggning</GoldButton>
              </>
            )}
          </div>
        )}

        {screen === "ready" && player && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 text-center shadow-2xl">
            <p className="font-sans text-sm text-amber-300">Välkommen, {player.display_name} {playerCountry?.flag}</p>
            <Divider />
            <h2 className="mb-4 font-serif text-xl font-bold">Redo att ge dig ut?</h2>
            <div className="mb-6 flex justify-center gap-6 font-sans text-xs text-amber-200">
              <div className="flex flex-col items-center gap-1">
                <BookOpen className="h-5 w-5 text-amber-400" />
                {activeQuestionCount ?? "…"} frågor
              </div>
              <div className="flex flex-col items-center gap-1">
                <Timer className="h-5 w-5 text-amber-400" />
                30 sek/fråga
              </div>
              <div className="flex flex-col items-center gap-1">
                <Crown className="h-5 w-5 text-amber-400" />
                Klättra i rang
              </div>
            </div>
            <GoldButton onClick={startGame} disabled={loadingQuiz || activeQuestionCount === 0}>
              {loadingQuiz ? "Laddar frågor…" : activeQuestionCount === 0 ? "Inga frågor publicerade än" : "Starta spelet"}
            </GoldButton>
            {readyError && (
              <p className="mt-2 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 font-sans text-xs text-red-400">
                {readyError}
              </p>
            )}
            <div className="mt-4 flex justify-center gap-4 font-sans text-xs">
              <button type="button" onClick={openLeaderboard} className="flex items-center gap-1 text-amber-300 hover:text-amber-200">
                <Trophy className="h-3.5 w-3.5" /> Topplista
              </button>
              <button type="button" onClick={logout} className="flex items-center gap-1 text-slate-300 hover:text-slate-200">
                <LogOut className="h-3.5 w-3.5" /> Logga ut
              </button>
            </div>
          </div>
        )}
        {screen === "ready" && <FooterNav onSelect={openFooterModal} />}

        {screen === "quiz" && q && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border-2 border-amber-600/70 bg-slate-950/92 p-6 shadow-2xl">
            <div className="mb-3 flex items-start justify-between border-b border-amber-700/40 pb-3">
              <div>
                <p className="font-sans text-xs font-bold tracking-widest text-amber-400">
                  FRÅGA {qIndex + 1} AV {questions.length}
                </p>
                <p className="mt-1 font-sans text-xs text-slate-400">{q.category} · {q.difficulty}</p>
              </div>
              <div
                className={`grid h-14 w-14 flex-none place-content-center rounded-full border-2 text-center ${timeLeft <= 10 ? "border-red-400" : "border-amber-400"}`}
              >
                <strong className={`font-sans text-xl leading-none ${timeLeft <= 10 ? "text-red-400" : "text-amber-300"}`}>
                  {timeLeft}
                </strong>
                <span className="font-sans text-[9px] tracking-widest text-slate-400">SEK</span>
              </div>
            </div>

            <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            {q.context && (
              <div className="mt-3 rounded-r-md border-l-2 border-amber-500 bg-slate-900/70 px-3 py-2">
                <span className="font-sans text-[10px] font-bold tracking-widest text-amber-400">KONTEXT</span>
                <p className="mt-1 font-sans text-xs leading-relaxed text-slate-300">{q.context}</p>
              </div>
            )}

            <h3 className="my-4 text-center font-serif text-lg font-semibold leading-snug">{q.question}</h3>

            <div className="grid grid-cols-1 gap-2 font-sans sm:grid-cols-2">
              {options.map(([key, text]) => {
                const isSelected = selected === key;
                const isCorrectOption = q.correct_option === key;
                let cls = "border-amber-700/40 bg-slate-900/60 hover:border-amber-400";
                if (locked && isCorrectOption) cls = "border-green-500 bg-green-950/50";
                else if (locked && isSelected && !isCorrectOption) cls = "border-red-500 bg-red-950/50";
                return (
                  <button type="button"
                    key={key}
                    disabled={locked}
                    onClick={() => handleAnswer(key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${cls}`}
                  >
                    <span className="grid h-6 w-6 flex-none place-content-center rounded-full border border-amber-500/60 text-xs text-amber-300">
                      {key}
                    </span>
                    <span className="flex-1">{text}</span>
                    {locked && isCorrectOption && <Check className="h-4 w-4 flex-none text-green-400" />}
                    {locked && isSelected && !isCorrectOption && <X className="h-4 w-4 flex-none text-red-400" />}
                  </button>
                );
              })}
            </div>

            <p
              className={`mt-3 min-h-[1.4em] text-center font-sans text-xs font-semibold ${
                selected === q.correct_option ? "text-green-400" : selected || timeLeft === 0 ? "text-red-400" : "text-slate-400"
              }`}
              role="status"
              aria-live="polite"
            >
              {selected === q.correct_option
                ? `Rätt! ${q.correct_explanation || ""}`
                : selected
                ? `Inte riktigt. Rätt svar är ${correctOption?.[1]}.`
                : locked
                ? `Tiden är slut. Rätt svar är ${correctOption?.[1]}.`
                : "Välj ett svar innan tiden tar slut."}
            </p>

            {locked && q.source && (
              <div className="mt-3 border-t border-amber-700/30 pt-2 font-sans text-[10px] text-slate-400">
                <p>
                  <span className="font-bold text-amber-400">KÄLLA </span>
                  {q.source}{q.translation ? ` · ${q.translation}` : ""}
                </p>
                {q.original_text && <p className="mt-1 italic text-slate-500">”{q.original_text}”</p>}
                {q.source_url && (
                  <a href={q.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-amber-400 underline">
                    Läs hela texten
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {screen === "result" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 text-center shadow-2xl">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <h2 className="font-serif text-xl font-bold">Bra kämpat, {player?.display_name}!</h2>
            <p className="mt-1 font-sans text-sm text-amber-200">
              {correctCount} av {questions.length} rätt
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-amber-400">{score} p</p>
            <Divider />
            <div className="space-y-2">
              <GoldButton onClick={() => setScreen("ready")}>Spela igen</GoldButton>
              <button type="button"
                onClick={shareResult}
                className="w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
              >
                Dela ditt resultat
              </button>
              <button type="button"
                onClick={openLeaderboard}
                className="w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
              >
                Se topplistan
              </button>
            </div>
            {shareStatus && <p className="mt-2 font-sans text-xs text-amber-300">{shareStatus}</p>}
          </div>
        )}

        {screen === "leaderboard" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 shadow-2xl">
            <h2 className="mb-1 text-center font-serif text-lg font-bold tracking-wide">
              <Medal className="mr-1 inline h-5 w-5 text-amber-400" /> SEGRARLISTAN
            </h2>
            <Divider />
            {leaderboardLoading && <p className="text-center font-sans text-sm text-slate-400">Hämtar…</p>}
            {!leaderboardLoading && leaderboard.length === 0 && (
              <p className="text-center font-sans text-sm text-slate-400">Ingen har spelat än. Bli den första!</p>
            )}
            <ol className="space-y-2 font-sans text-sm">
              {leaderboard.map((row, i) => {
                const c = COUNTRIES.find((c) => c.code === row.country_code);
                return (
                  <li key={row.player_id} className="flex items-center justify-between rounded-md border border-amber-800/30 bg-slate-900/50 px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span className="w-4 text-amber-400">{i + 1}</span>
                      <span>{c?.flag}</span>
                      <span className={row.player_id === player?.id ? "font-bold text-amber-300" : ""}>{row.display_name}</span>
                    </span>
                    <span className="text-amber-400">{row.best_score} p</span>
                  </li>
                );
              })}
            </ol>
            <button type="button"
              onClick={() => setScreen(player ? "ready" : "auth")}
              className="mt-4 w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
            >
              Tillbaka
            </button>
          </div>
        )}
      </div>

      {footerModal === "about" && (
        <Modal title="Om Bible Run" onClose={closeFooterModal}>
          <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-300">
            <p>
              Bible Run är ett bibelkunskaps-quiz där du tävlar mot klockan och mot andra spelare från hela världen.
              Varje fråga bygger på verkliga bibeltexter, med källhänvisning och sammanhang så att du lär dig något
              på vägen - inte bara gissar.
            </p>
            <p>
              Alla frågor granskas och godkänns manuellt innan de publiceras, för att hålla en hög kvalitet på
              innehållet.
            </p>
          </div>
        </Modal>
      )}

      {footerModal === "donate" && (
        <Modal title="Skicka en gåva" onClose={closeFooterModal}>
          <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-300">
            <p>
              Bible Run drivs ideellt. Vill du stötta driften och fortsatt utveckling är vi tacksamma för det.
            </p>
            <div className="rounded-lg border border-amber-700/40 bg-slate-900/50 p-4 text-amber-200">
              <p className="font-semibold">Betalningsuppgifter är inte ikopplade ännu.</p>
              <p className="mt-1 text-xs text-slate-400">
                Den här rutan är en platshållare - ingen betalning kan tas emot här idag. Hör av dig via
                "Kontakta oss" så ordnar vi ett riktigt gåvo-flöde (t.ex. Swish eller kort) tillsammans.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {footerModal === "contact" && (
        <Modal title="Kontakta oss" onClose={closeFooterModal}>
          {!contactSent ? (
            <div className="space-y-3 font-sans text-sm">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">Namn (valfritt)</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">E-post</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">Meddelande</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 py-2 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              {contactError && <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{contactError}</p>}
              <GoldButton type="button" onClick={submitContactForm} disabled={contactSending}>
                {contactSending ? "Skickar…" : "Skicka meddelande"}
              </GoldButton>
            </div>
          ) : (
            <p className="font-sans text-sm text-green-400">Tack! Meddelandet är sparat och vi återkommer till dig.</p>
          )}
        </Modal>
      )}

      {footerModal === "admin" && (
        <Modal title="Admin - frågehantering" onClose={closeFooterModal} wide>
          {!adminAuthed ? (
            <div className="space-y-3 font-sans text-sm">
              <p className="text-xs text-slate-400">
                Testläge: enkel kodlås i klientkoden. Byts till riktig adminroll senare.
              </p>
              <div className="relative">
                <input
                  type={showAdminPasscode ? "text" : "password"}
                  value={adminPasscodeInput}
                  onChange={(e) => setAdminPasscodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin(e)}
                  placeholder="Adminkod"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="h-10 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 pr-10 text-amber-50 outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode((s) => !s)}
                  aria-label={showAdminPasscode ? "Dölj adminkod" : "Visa adminkod"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-amber-400/80 hover:text-amber-300"
                >
                  {showAdminPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {adminError && <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{adminError}</p>}
              <GoldButton type="button" onClick={handleAdminLogin}>Lås upp</GoldButton>
            </div>
          ) : (
            <div className="font-sans text-sm">
              <div className="mb-4 grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg border border-amber-700/30 bg-slate-900/50 py-2">
                  <p className="text-lg font-bold text-amber-300">{adminStats.total}</p>
                  <p className="text-slate-400">Totalt</p>
                </div>
                <div className="rounded-lg border border-amber-700/30 bg-slate-900/50 py-2">
                  <p className="text-lg font-bold text-yellow-400">{adminStats.pending}</p>
                  <p className="text-slate-400">Väntar</p>
                </div>
                <div className="rounded-lg border border-amber-700/30 bg-slate-900/50 py-2">
                  <p className="text-lg font-bold text-green-400">{adminStats.approved}</p>
                  <p className="text-slate-400">Godkända</p>
                </div>
                <div className="rounded-lg border border-amber-700/30 bg-slate-900/50 py-2">
                  <p className="text-lg font-bold text-amber-400">{adminStats.active}</p>
                  <p className="text-slate-400">Aktiva</p>
                </div>
              </div>

              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span>Mål: 2000 frågor</span>
                  <span>{Math.min(100, Math.round((adminStats.total / 2000) * 100))}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (adminStats.total / 2000) * 100)}%` }} />
                </div>
              </div>

              <div className="mb-4 flex rounded-lg border border-amber-700/40 p-1 text-xs">
                <button type="button" onClick={() => setAdminTab("generate")} className={`flex-1 rounded-md py-1.5 ${adminTab === "generate" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Generera</button>
                <button type="button" onClick={() => setAdminTab("pending")} className={`flex-1 rounded-md py-1.5 ${adminTab === "pending" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Att granska ({adminStats.pending})</button>
                <button type="button" onClick={() => setAdminTab("published")} className={`flex-1 rounded-md py-1.5 ${adminTab === "published" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Publicerade ({adminStats.approved})</button>
              </div>

              {adminTab === "generate" && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-400">
                    Genererar nya frågor med AI baserat på KJV, Douay-Rheims, Eastern Orthodox Bible och
                    Reformationsbibeln. Frågorna hamnar i "Att granska" och publiceras inte förrän du godkänner dem.
                    Varje omgång ger ~5 frågor. Kör gärna flera omgångar i rad och avbryt när du vill.
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-amber-300/80">Antal omgångar:</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={genRounds}
                      onChange={(e) => setGenRounds(Number(e.target.value) || 1)}
                      disabled={genLoading}
                      className="h-9 w-20 rounded-lg border border-amber-700/50 bg-slate-900/60 px-2 text-center text-amber-50 outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-500">≈ {genRounds * 5} frågor</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <GoldButton onClick={generateQuestionBatch} disabled={genLoading}>
                        {genLoading ? "Genererar…" : "Generera fler frågor"}
                      </GoldButton>
                    </div>
                    {genLoading && (
                      <button type="button"
                        onClick={stopGeneration}
                        className="rounded-lg border border-red-700/50 px-4 text-sm text-red-400 hover:bg-red-950/30"
                      >
                        Stoppa
                      </button>
                    )}
                  </div>
                  {genProgress && <p className="text-center text-xs text-amber-300">{genProgress}</p>}
                  {genError && <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{genError}</p>}
                </div>
              )}

              {adminTab === "pending" && (
                <div className="max-h-[50vh] space-y-3 overflow-y-auto">
                  {adminListLoading && <p className="text-center text-xs text-slate-400">Laddar…</p>}
                  {!adminListLoading && pendingQuestions.length === 0 && (
                    <p className="text-center text-xs text-slate-400">Inga frågor väntar på granskning.</p>
                  )}
                  {pendingQuestions.map((pq) => (
                    <div key={pq.id} className="rounded-lg border border-amber-700/30 bg-slate-900/50 p-3">
                      {editingId === pq.id ? (
                        <div className="space-y-2">
                          <input className="h-9 w-full rounded border border-amber-700/50 bg-slate-950/70 px-2 text-xs text-amber-50" value={editDraft.question} onChange={(e) => setEditDraft({ ...editDraft, question: e.target.value })} />
                          {["option_a", "option_b", "option_c", "option_d"].map((k) => (
                            <input key={k} className="h-9 w-full rounded border border-amber-700/50 bg-slate-950/70 px-2 text-xs text-amber-50" value={editDraft[k]} onChange={(e) => setEditDraft({ ...editDraft, [k]: e.target.value })} />
                          ))}
                          <select className="h-9 w-full rounded border border-amber-700/50 bg-slate-950/70 px-2 text-xs text-amber-50" value={editDraft.correct_option} onChange={(e) => setEditDraft({ ...editDraft, correct_option: e.target.value })}>
                            <option value="A">A rätt</option>
                            <option value="B">B rätt</option>
                            <option value="C">C rätt</option>
                            <option value="D">D rätt</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="button" onClick={saveEdit} className="flex-1 rounded bg-amber-500 py-1.5 text-xs font-semibold text-slate-950">Spara</button>
                            <button type="button" onClick={cancelEditing} className="flex-1 rounded border border-slate-600 py-1.5 text-xs text-slate-300">Avbryt</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-amber-400">{pq.category} · {pq.difficulty} · {pq.source}</p>
                          <p className="mt-1 font-serif text-sm font-semibold">{pq.question}</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-slate-400">
                            {["A", "B", "C", "D"].map((k) => (
                              <li key={k} className={pq.correct_option === k ? "font-semibold text-green-400" : ""}>
                                {k}: {pq[`option_${k.toLowerCase()}`]}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex gap-2 text-xs">
                            <button type="button" onClick={() => approveQuestion(pq.id)} className="flex-1 rounded bg-green-600 py-1.5 font-semibold text-white">Godkänn</button>
                            <button type="button" onClick={() => startEditing(pq)} className="flex-1 rounded border border-amber-600/50 py-1.5 text-amber-200">Redigera</button>
                            <button type="button" onClick={() => rejectQuestion(pq.id)} className="flex-1 rounded border border-red-700/50 py-1.5 text-red-400">Avvisa</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {adminTab === "published" && (
                <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                  {adminListLoading && <p className="text-center text-xs text-slate-400">Laddar…</p>}
                  {publishedQuestions.map((pq) => (
                    <div key={pq.id} className="flex items-center justify-between rounded-lg border border-amber-700/30 bg-slate-900/50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-amber-400">{pq.category} · {pq.difficulty}</p>
                        <p className="truncate font-serif text-sm">{pq.question}</p>
                      </div>
                      <button type="button"
                        onClick={() => toggleActive(pq.id, pq.is_active)}
                        className={`ml-3 flex-none rounded-full px-3 py-1 text-xs font-semibold ${pq.is_active ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"}`}
                      >
                        {pq.is_active ? "Aktiv" : "Inaktiv"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {adminError && <p className="mt-3 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{adminError}</p>}
            </div>
          )}
        </Modal>
      )}
    </Backdrop>
  );
}
