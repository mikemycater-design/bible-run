import { useState, useEffect, useRef, useCallback } from "react";
import { Crown, BookOpen, Timer, Trophy, LogOut, Check, X, Medal, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Globe2, ChevronRight } from "lucide-react";

const SUPABASE_URL = "https://mhgnikriicjamwmxdjdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_qZQ3fm0Xs6uFGEMYg-RoSg_g-PktFsf";
const QUESTION_SECONDS = 30;

const COUNTRIES = [
  { code: "SE", name: "Sverige", flag: "🇸🇪" },
  { code: "NO", name: "Norge", flag: "🇳🇴" },
  { code: "DK", name: "Danmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
];

const LANG_KEY = "bible_run_lang";

const LANGUAGES = [
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

const TRANSLATIONS = {
  sv: {
    "auth.title.login": "Välkommen tillbaka",
    "auth.title.signup": "Skapa ditt konto",
    "auth.subtitle.login": "Logga in för att fortsätta spela",
    "auth.subtitle.signup": "Registrera dig för att börja spela",
    "auth.tab.login": "Logga in",
    "auth.tab.signup": "Nytt konto",
    "auth.label.email": "E-post",
    "auth.placeholder.email": "din@epost.se",
    "auth.label.name": "Ditt namn",
    "auth.placeholder.name": "Skriv ditt namn",
    "auth.label.country": "Välj land",
    "auth.label.password": "Lösenord",
    "auth.forgot": "Glömt lösenord?",
    "auth.placeholder.password": "Minst 8 tecken",
    "auth.submit.login": "Logga in",
    "auth.submit.signup": "Skapa konto",
    "auth.submit.loading": "Ett ögonblick…",
    "auth.or": "eller fortsätt med",
    "auth.security_note": "Ditt lösenord hashas och sparas säkert i databasen. Vi ser aldrig ditt lösenord i klartext.",
    "auth.show_password": "Visa lösenord",
    "auth.hide_password": "Dölj lösenord",
    "err.email_invalid": "Skriv en giltig e-postadress.",
    "err.name_short": "Skriv ditt namn (minst 2 tecken).",
    "err.password_short": "Lösenordet måste vara minst 8 tecken.",
    "err.email_taken": "Det finns redan ett konto med den e-postadressen. Logga in istället.",
    "err.login_failed": "Fel e-post eller lösenord.",
    "err.generic": "Något gick fel. Försök igen.",
    "err.oauth_failed": "Inloggningen misslyckades. Försök igen.",
    "forgot.title": "Återställ lösenord",
    "forgot.desc": "Skriv din e-postadress så skickar vi en länk för att sätta ett nytt lösenord.",
    "forgot.submit": "Skicka återställningslänk",
    "forgot.sending": "Skickar…",
    "forgot.success": "Om ett konto finns med den adressen har vi skickat en länk dit. Kolla din inkorg (och skräppost).",
    "forgot.back": "Tillbaka till inloggning",
    "reset.title": "Sätt nytt lösenord",
    "reset.desc": "Välj ett nytt lösenord för ditt konto.",
    "reset.label": "Nytt lösenord",
    "reset.submit": "Sätt nytt lösenord",
    "reset.saving": "Sparar…",
    "reset.success": "Lösenordet är uppdaterat! Du kan nu logga in med det nya lösenordet.",
    "reset.to_login": "Till inloggning",
    "reset.expired": "Länken har gått ut eller är redan använd. Begär en ny återställningslänk.",
    "ready.welcome": "Välkommen, {name}",
    "ready.title": "Redo att ge dig ut?",
    "ready.questions_count": "{count} frågor",
    "ready.seconds_per_q": "30 sek/fråga",
    "ready.climb": "Klättra i rang",
    "ready.start": "Starta spelet",
    "ready.loading": "Laddar frågor…",
    "ready.no_questions": "Inga frågor publicerade än",
    "ready.leaderboard_link": "Topplista",
    "ready.logout": "Logga ut",
    "ready.err_no_questions": "Inga frågor är publicerade just nu. Försök igen senare.",
    "ready.err_fetch": "Kunde inte hämta frågor. Försök igen.",
    "quiz.question_of": "FRÅGA {current} AV {total}",
    "quiz.context_label": "KONTEXT",
    "quiz.status.correct": "Rätt! {explanation}",
    "quiz.status.wrong": "Inte riktigt. Rätt svar är {answer}.",
    "quiz.status.timeout": "Tiden är slut. Rätt svar är {answer}.",
    "quiz.status.prompt": "Välj ett svar innan tiden tar slut.",
    "quiz.source_label": "KÄLLA",
    "quiz.read_more": "Läs hela texten",
    "quiz.seconds_short": "SEK",
    "result.title": "Bra kämpat, {name}!",
    "result.score_summary": "{correct} av {total} rätt",
    "result.points_suffix": "p",
    "result.play_again": "Spela igen",
    "result.share": "Dela ditt resultat",
    "result.view_leaderboard": "Se topplistan",
    "result.share_copied": "Kopierat! Klistra in var du vill dela det.",
    "result.share_text": "Jag fick {score} poäng ({correct}/{total} rätt) i Bible Run! Klarar du bättre?",
    "lb.title": "SEGRARLISTAN",
    "lb.loading": "Hämtar…",
    "lb.empty": "Ingen har spelat än. Bli den första!",
    "lb.leading": "I täten",
    "lb.back": "Tillbaka",
    "footer.about": "Om oss",
    "footer.donate": "Skicka en gåva",
    "footer.contact": "Kontakta oss",
    "footer.admin": "Admin",
    "about.title": "Om Bible Run",
    "about.p1": "Bible Run är ett bibelkunskaps-quiz där du tävlar mot klockan och mot andra spelare från hela världen. Varje fråga bygger på verkliga bibeltexter, med källhänvisning och sammanhang så att du lär dig något på vägen - inte bara gissar.",
    "about.p2": "Alla frågor granskas och godkänns manuellt innan de publiceras, för att hålla en hög kvalitet på innehållet.",
    "donate.title": "Skicka en gåva",
    "donate.p1": "Bible Run drivs ideellt. Vill du stötta driften och fortsatt utveckling är vi tacksamma för det.",
    "donate.placeholder_title": "Betalningsuppgifter är inte ikopplade ännu.",
    "donate.placeholder_body": "Den här rutan är en platshållare - ingen betalning kan tas emot här idag. Hör av dig via \"Kontakta oss\" så ordnar vi ett riktigt gåvo-flöde (t.ex. Swish eller kort) tillsammans.",
    "contact.title": "Kontakta oss",
    "contact.label.name": "Namn (valfritt)",
    "contact.label.email": "E-post",
    "contact.label.message": "Meddelande",
    "contact.submit": "Skicka meddelande",
    "contact.sending": "Skickar…",
    "contact.sent": "Tack! Meddelandet är sparat och vi återkommer till dig.",
    "contact.err_message": "Skriv ett meddelande.",
    "contact.err_generic": "Kunde inte skicka meddelandet. Försök igen.",
  },
  en: {
    "auth.title.login": "Welcome back",
    "auth.title.signup": "Create your account",
    "auth.subtitle.login": "Log in to keep playing",
    "auth.subtitle.signup": "Sign up to start playing",
    "auth.tab.login": "Log in",
    "auth.tab.signup": "New account",
    "auth.label.email": "Email",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "Your name",
    "auth.placeholder.name": "Enter your name",
    "auth.label.country": "Choose country",
    "auth.label.password": "Password",
    "auth.forgot": "Forgot password?",
    "auth.placeholder.password": "At least 8 characters",
    "auth.submit.login": "Log in",
    "auth.submit.signup": "Create account",
    "auth.submit.loading": "One moment…",
    "auth.or": "or continue with",
    "auth.security_note": "Your password is hashed and stored securely in the database. We never see your password in plain text.",
    "auth.show_password": "Show password",
    "auth.hide_password": "Hide password",
    "err.email_invalid": "Enter a valid email address.",
    "err.name_short": "Enter your name (at least 2 characters).",
    "err.password_short": "Password must be at least 8 characters.",
    "err.email_taken": "An account with that email already exists. Log in instead.",
    "err.login_failed": "Incorrect email or password.",
    "err.generic": "Something went wrong. Please try again.",
    "err.oauth_failed": "Login failed. Please try again.",
    "forgot.title": "Reset password",
    "forgot.desc": "Enter your email and we'll send you a link to set a new password.",
    "forgot.submit": "Send reset link",
    "forgot.sending": "Sending…",
    "forgot.success": "If an account exists with that address, we've sent a link there. Check your inbox (and spam folder).",
    "forgot.back": "Back to login",
    "reset.title": "Set new password",
    "reset.desc": "Choose a new password for your account.",
    "reset.label": "New password",
    "reset.submit": "Set new password",
    "reset.saving": "Saving…",
    "reset.success": "Password updated! You can now log in with your new password.",
    "reset.to_login": "Go to login",
    "reset.expired": "This link has expired or was already used. Request a new reset link.",
    "ready.welcome": "Welcome, {name}",
    "ready.title": "Ready to set out?",
    "ready.questions_count": "{count} questions",
    "ready.seconds_per_q": "30 sec/question",
    "ready.climb": "Climb the ranks",
    "ready.start": "Start the game",
    "ready.loading": "Loading questions…",
    "ready.no_questions": "No questions published yet",
    "ready.leaderboard_link": "Leaderboard",
    "ready.logout": "Log out",
    "ready.err_no_questions": "No questions are published right now. Try again later.",
    "ready.err_fetch": "Couldn't load questions. Please try again.",
    "quiz.question_of": "QUESTION {current} OF {total}",
    "quiz.context_label": "CONTEXT",
    "quiz.status.correct": "Correct! {explanation}",
    "quiz.status.wrong": "Not quite. The correct answer is {answer}.",
    "quiz.status.timeout": "Time's up. The correct answer is {answer}.",
    "quiz.status.prompt": "Pick an answer before time runs out.",
    "quiz.source_label": "SOURCE",
    "quiz.read_more": "Read the full text",
    "quiz.seconds_short": "SEC",
    "result.title": "Well played, {name}!",
    "result.score_summary": "{correct} of {total} correct",
    "result.points_suffix": "pts",
    "result.play_again": "Play again",
    "result.share": "Share your result",
    "result.view_leaderboard": "View the leaderboard",
    "result.share_copied": "Copied! Paste it wherever you'd like to share it.",
    "result.share_text": "I scored {score} points ({correct}/{total} correct) in Bible Run! Can you beat that?",
    "lb.title": "LEADERBOARD",
    "lb.loading": "Loading…",
    "lb.empty": "Nobody has played yet. Be the first!",
    "lb.leading": "In the lead",
    "lb.back": "Back",
    "footer.about": "About us",
    "footer.donate": "Send a gift",
    "footer.contact": "Contact us",
    "footer.admin": "Admin",
    "about.title": "About Bible Run",
    "about.p1": "Bible Run is a Bible knowledge quiz where you race the clock and compete against players from around the world. Every question is grounded in real Bible text, with sourcing and context so you learn something along the way - not just guess.",
    "about.p2": "Every question is manually reviewed and approved before it's published, to keep the content quality high.",
    "donate.title": "Send a gift",
    "donate.p1": "Bible Run is run as a non-profit. If you'd like to support its operation and continued development, we'd be grateful.",
    "donate.placeholder_title": "Payment isn't connected yet.",
    "donate.placeholder_body": "This box is a placeholder - no payment can be received here today. Reach out via \"Contact us\" and we'll set up a real donation flow (e.g. card or bank transfer) together.",
    "contact.title": "Contact us",
    "contact.label.name": "Name (optional)",
    "contact.label.email": "Email",
    "contact.label.message": "Message",
    "contact.submit": "Send message",
    "contact.sending": "Sending…",
    "contact.sent": "Thanks! Your message has been saved and we'll get back to you.",
    "contact.err_message": "Please write a message.",
    "contact.err_generic": "Couldn't send the message. Please try again.",
  },
};

function translate(lang, key, vars) {
  let text = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.sv[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}

function loadLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && TRANSLATIONS[stored]) return stored;
  } catch {
    // localStorage otillgängligt - kör standardspråk
  }
  return "sv";
}

const PLAYER_SESSION_KEY = "bible_run_player";

function loadPlayerSession() {
  try {
    const raw = localStorage.getItem(PLAYER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePlayerSession(player) {
  try {
    localStorage.setItem(PLAYER_SESSION_KEY, JSON.stringify(player));
  } catch {
    // localStorage kan vara otillgängligt (privat läge etc.) - spelet fungerar ändå, bara utan att komma ihåg inloggningen.
  }
}

function clearPlayerSession() {
  try {
    localStorage.removeItem(PLAYER_SESSION_KEY);
  } catch {
    // se kommentar i savePlayerSession
  }
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



function Backdrop({ children }) {
  return (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden text-amber-50"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      <LockViewport />
      {/* Ren, kodbaserad tema-bakgrund - mörk himmel, stjärnor, varmt guldsken.
          Inget foto, så ingen oskärpa behövs och ingen inbakad text kan läcka igenom. */}
      <div className="absolute inset-0 bg-slate-950" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 85% 100%, rgba(217,158,52,0.16), transparent 60%), radial-gradient(ellipse 60% 40% at 15% 0%, rgba(217,158,52,0.08), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 22%, white, transparent), radial-gradient(1px 1px at 68% 14%, white, transparent), radial-gradient(1.5px 1.5px at 32% 48%, white, transparent), radial-gradient(1px 1px at 88% 62%, white, transparent), radial-gradient(1px 1px at 6% 70%, white, transparent), radial-gradient(1.5px 1.5px at 55% 8%, white, transparent), radial-gradient(1px 1px at 78% 36%, white, transparent), radial-gradient(1px 1px at 22% 88%, white, transparent), radial-gradient(1.5px 1.5px at 92% 18%, white, transparent), radial-gradient(1px 1px at 44% 62%, white, transparent)",
          backgroundRepeat: "repeat",
          backgroundSize: "420px 420px",
        }}
      />
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

function FooterNav({ onSelect, t }) {
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-sans text-xs text-amber-300/70">
      <button type="button" onClick={() => onSelect("about")} className="hover:text-amber-200 hover:underline">{t("footer.about")}</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("donate")} className="hover:text-amber-200 hover:underline">{t("footer.donate")}</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("contact")} className="hover:text-amber-200 hover:underline">{t("footer.contact")}</button>
      <span className="text-amber-800">·</span>
      <button type="button" onClick={() => onSelect("admin")} className="hover:text-amber-200 hover:underline">{t("footer.admin")}</button>
    </nav>
  );
}

function getResetTokenFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("reset_token");
}

export default function BibleRun() {
  const [screen, setScreen] = useState(() => {
    if (getResetTokenFromUrl()) return "resetPassword";
    return loadPlayerSession() ? "ready" : "auth";
  });
  const [authMode, setAuthMode] = useState("login"); // login | signup | forgot
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("SE");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const [resetToken] = useState(getResetTokenFromUrl);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetConfirmLoading, setResetConfirmLoading] = useState(false);
  const [resetConfirmError, setResetConfirmError] = useState("");
  const [resetConfirmSuccess, setResetConfirmSuccess] = useState(false);

  const [player, setPlayer] = useState(loadPlayerSession);
  const [lang, setLang] = useState(loadLang);
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  function changeLang(code) {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      // se kommentar i savePlayerSession
    }
  }

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
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminPasscodeInput, setAdminPasscodeInput] = useState("");
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminTab, setAdminTab] = useState("pending"); // pending | published | messages | outreach
  const [adminStats, setAdminStats] = useState({ pending: 0, approved: 0, active: 0, total: 0 });
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [publishedQuestions, setPublishedQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [adminListLoading, setAdminListLoading] = useState(false);
  const [outreachSegments, setOutreachSegments] = useState([]);
  const [outreachDomains, setOutreachDomains] = useState([]);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState("");
  const [outreachLoaded, setOutreachLoaded] = useState(false);
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
      savePlayerSession(playerRow);
      setScreen("ready");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (err) {
      setAuthError(err.message || t("err.oauth_failed"));
    } finally {
      setOauthLoading(false);
    }
  }, [t]);

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
    if (!emailValid) return setAuthError(t("err.email_invalid"));
    if (authMode === "signup" && cleanName.length < 2) return setAuthError(t("err.name_short"));
    if (password.length < 8) return setAuthError(t("err.password_short"));

    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        try {
          const created = await sb("rpc/signup_player", {
            method: "POST",
            body: JSON.stringify({ p_display_name: cleanName, p_email: cleanEmail, p_country_code: country, p_password: password }),
          });
          setPlayer(created[0]);
          savePlayerSession(created[0]);
          setScreen("ready");
        } catch (err) {
          if (err.message.includes("email_taken")) {
            setAuthError(t("err.email_taken"));
          } else if (err.message.includes("password_too_short")) {
            setAuthError(t("err.password_short"));
          } else {
            throw err;
          }
        }
      } else {
        const rows = await sb("rpc/login_player", {
          method: "POST",
          body: JSON.stringify({ p_email: cleanEmail, p_password: password }),
        });
        if (rows.length === 0) {
          setAuthError(t("err.login_failed"));
          setAuthLoading(false);
          return;
        }
        setPlayer(rows[0]);
        savePlayerSession(rows[0]);
        setScreen("ready");
      }
    } catch (err) {
      setAuthError(err.message || t("err.generic"));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleForgotSubmit(e) {
    e?.preventDefault?.();
    setForgotError("");
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailValid) return setForgotError(t("err.email_invalid"));
    setForgotLoading(true);
    try {
      await sb("rpc/request_password_reset", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ p_email: cleanEmail }),
      });
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message || t("err.generic"));
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetConfirm(e) {
    e?.preventDefault?.();
    setResetConfirmError("");
    if (resetNewPassword.length < 8) return setResetConfirmError(t("err.password_short"));
    setResetConfirmLoading(true);
    try {
      const ok = await sb("rpc/complete_password_reset", {
        method: "POST",
        body: JSON.stringify({ p_token: resetToken, p_new_password: resetNewPassword }),
      });
      if (!ok) {
        setResetConfirmError(t("reset.expired"));
        return;
      }
      setResetConfirmSuccess(true);
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) {
      setResetConfirmError(err.message || t("err.generic"));
    } finally {
      setResetConfirmLoading(false);
    }
  }

  function logout() {
    clearPlayerSession();
    setPlayer(null);
    setName("");
    setEmail("");
    setPassword("");
    setAuthMode("login");
    setScreen("auth");
  }

  async function startGame() {
    setLoadingQuiz(true);
    setReadyError("");
    try {
      const qs = await sb("questions?status=eq.approved&is_active=eq.true&order=sort_order.asc&select=*");
      if (qs.length === 0) {
        setReadyError(t("ready.err_no_questions"));
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
      setReadyError(err.message || t("ready.err_fetch"));
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
      await sb("rpc/submit_game_result", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({
          p_player_id: player.id,
          p_score: finalScore,
          p_correct_count: finalCorrect,
          p_total_questions: questions.length,
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
    if (!emailValid) return setContactError(t("err.email_invalid"));
    if (contactMessage.trim().length < 5) return setContactError(t("contact.err_message"));
    setContactSending(true);
    try {
      await sb("contact_messages", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ name: contactName.trim() || null, email: cleanEmail, message: contactMessage.trim() }),
      });
      setContactSent(true);
    } catch (err) {
      setContactError(err.message || t("contact.err_generic"));
    } finally {
      setContactSending(false);
    }
  }

  function openFooterModal(key) {
    setFooterModal(key);
    if (key === "admin" && adminAuthed) loadAdminData();
  }

  async function shareResult() {
    const text = t("result.share_text", { score, correct: correctCount, total: questions.length });
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
      setShareStatus(t("result.share_copied"));
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
  }

  async function handleAdminLogin(e) {
    e?.preventDefault?.();
    const code = adminPasscodeInput.trim();
    setAdminLoginLoading(true);
    setAdminError("");
    try {
      const stats = await sb("rpc/admin_get_stats", {
        method: "POST",
        body: JSON.stringify({ p_passcode: code }),
      });
      setAdminAuthed(true);
      setAdminPasscode(code);
      setAdminStats(stats[0] || { pending: 0, approved: 0, active: 0, total: 0 });
      await loadAdminData(code);
    } catch {
      setAdminError("Fel kod.");
    } finally {
      setAdminLoginLoading(false);
    }
  }

  async function loadAdminData(codeOverride) {
    const code = codeOverride || adminPasscode;
    setAdminListLoading(true);
    try {
      const [pending, published, stats, msgs] = await Promise.all([
        sb("rpc/admin_list_pending", { method: "POST", body: JSON.stringify({ p_passcode: code }) }),
        sb("rpc/admin_list_published", { method: "POST", body: JSON.stringify({ p_passcode: code }) }),
        sb("rpc/admin_get_stats", { method: "POST", body: JSON.stringify({ p_passcode: code }) }),
        sb("rpc/admin_list_messages", { method: "POST", body: JSON.stringify({ p_passcode: code }) }),
      ]);
      setPendingQuestions(pending);
      setPublishedQuestions(published);
      setAdminStats(stats[0] || { pending: 0, approved: 0, active: 0, total: 0 });
      setMessages(msgs);
    } catch (err) {
      setAdminError(err.message || "Kunde inte hämta frågor.");
    } finally {
      setAdminListLoading(false);
    }
  }

  async function loadOutreachData() {
    setOutreachLoading(true);
    setOutreachError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ passcode: adminPasscode }),
      });
      if (!res.ok) throw new Error(`Kunde inte hämta kyrko-kontakter (${res.status})`);
      const data = await res.json();
      setOutreachSegments(data.segments || []);
      setOutreachDomains(data.domains || []);
      setOutreachLoaded(true);
    } catch (err) {
      setOutreachError(err.message || "Kunde inte hämta kyrko-kontakter.");
    } finally {
      setOutreachLoading(false);
    }
  }

  function openOutreachTab() {
    setAdminTab("outreach");
    if (!outreachLoaded) loadOutreachData();
  }

  async function toggleMessageHandled(id, current) {
    try {
      await sb("rpc/admin_mark_message_handled", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ p_passcode: adminPasscode, p_id: id, p_handled: !current }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte uppdatera meddelandet.");
    }
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
      await sb("rpc/admin_update_question", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({
          p_passcode: adminPasscode,
          p_id: editDraft.id,
          p_question: editDraft.question,
          p_option_a: editDraft.option_a,
          p_option_b: editDraft.option_b,
          p_option_c: editDraft.option_c,
          p_option_d: editDraft.option_d,
          p_correct_option: editDraft.correct_option,
          p_category: editDraft.category,
          p_difficulty: editDraft.difficulty,
          p_context: editDraft.context,
          p_correct_explanation: editDraft.correct_explanation,
          p_source: editDraft.source,
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
      await sb("rpc/admin_approve_question", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ p_passcode: adminPasscode, p_id: id }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte godkänna frågan.");
    }
  }

  async function rejectQuestion(id) {
    try {
      await sb("rpc/admin_reject_question", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ p_passcode: adminPasscode, p_id: id }),
      });
      await loadAdminData();
    } catch (err) {
      setAdminError(err.message || "Kunde inte avvisa frågan.");
    }
  }

  async function toggleActive(id, current) {
    try {
      await sb("rpc/admin_toggle_active", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify({ p_passcode: adminPasscode, p_id: id, p_active: !current }),
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
    <Backdrop>
      <div className="mx-auto flex max-h-screen w-full max-w-2xl flex-col justify-center overflow-y-auto px-5 py-6">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <Crown className="h-9 w-9 text-amber-400" />
          </div>
          <h1 className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-5xl font-bold tracking-wide text-transparent">
            BIBLE RUN
          </h1>
          <div className="mt-2 flex justify-center gap-1.5 font-sans text-xs">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => changeLang(l.code)}
                aria-pressed={lang === l.code}
                className={`rounded-full border px-2.5 py-1 transition ${lang === l.code ? "border-amber-400 bg-amber-500/20 text-amber-200" : "border-amber-800/40 text-amber-300/60 hover:text-amber-200"}`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </div>

        {screen === "resetPassword" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 shadow-2xl">
            <h2 className="mb-1 text-center font-serif text-lg font-bold">{t("reset.title")}</h2>
            {!resetConfirmSuccess ? (
              <>
                <p className="mb-4 text-center font-sans text-xs text-slate-400">
                  {t("reset.desc")}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-sans uppercase tracking-wide text-amber-300/80">{t("reset.label")}</label>
                    <div className="relative">
                      <input
                        type={resetShowPassword ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleResetConfirm(e)}
                        placeholder={t("auth.placeholder.password")}
                        className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-3 py-2 pr-10 font-sans text-amber-50 placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((s) => !s)}
                        aria-label={resetShowPassword ? t("auth.hide_password") : t("auth.show_password")}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-amber-400/80 hover:text-amber-300"
                      >
                        {resetShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {resetConfirmError && <p className="font-sans text-sm text-red-400">{resetConfirmError}</p>}
                  <GoldButton type="button" onClick={handleResetConfirm} disabled={resetConfirmLoading}>
                    {resetConfirmLoading ? t("reset.saving") : t("reset.submit")}
                  </GoldButton>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-center font-sans text-sm text-green-400">
                  {t("reset.success")}
                </p>
                <GoldButton onClick={() => { setScreen("auth"); setAuthMode("login"); }}>{t("reset.to_login")}</GoldButton>
              </>
            )}
          </div>
        )}

        {screen === "auth" && authMode === "forgot" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 shadow-2xl">
            <h2 className="mb-1 text-center font-serif text-lg font-bold">{t("forgot.title")}</h2>
            {!forgotSent ? (
              <>
                <p className="mb-4 text-center font-sans text-xs text-slate-400">
                  {t("forgot.desc")}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-sans uppercase tracking-wide text-amber-300/80">{t("auth.label.email")}</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleForgotSubmit(e)}
                      placeholder={t("auth.placeholder.email")}
                      className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-3 py-2 font-sans text-amber-50 placeholder-slate-500 outline-none focus:border-amber-400"
                    />
                  </div>
                  {forgotError && <p className="font-sans text-sm text-red-400">{forgotError}</p>}
                  <GoldButton type="button" onClick={handleForgotSubmit} disabled={forgotLoading}>
                    {forgotLoading ? t("forgot.sending") : t("forgot.submit")}
                  </GoldButton>
                </div>
              </>
            ) : (
              <p className="text-center font-sans text-sm text-green-400">
                {t("forgot.success")}
              </p>
            )}
            <button type="button"
              onClick={() => { setAuthMode("login"); setForgotSent(false); setForgotError(""); }}
              className="mt-3 w-full text-center font-sans text-xs text-amber-300/80 hover:text-amber-200"
            >
              {t("forgot.back")}
            </button>
          </div>
        )}

        {screen === "auth" && authMode !== "forgot" && (
          <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-amber-700/40 bg-slate-950/96 shadow-2xl">
            <div className="px-7 pt-7">
              <h2 className="text-center font-serif text-lg font-semibold text-amber-50">
                {authMode === "signup" ? t("auth.title.signup") : t("auth.title.login")}
              </h2>
              <p className="mt-1 text-center font-sans text-xs text-slate-400">
                {authMode === "signup" ? t("auth.subtitle.signup") : t("auth.subtitle.login")}
              </p>

              <div className="mt-5 flex rounded-lg border border-amber-700/40 bg-slate-900/40 p-1 text-sm">
                <button type="button"
                  className={`flex-1 rounded-md py-1.5 font-sans transition ${authMode === "login" ? "bg-amber-500 text-slate-950 font-semibold shadow" : "text-amber-200 hover:text-amber-100"}`}
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                >
                  {t("auth.tab.login")}
                </button>
                <button type="button"
                  className={`flex-1 rounded-md py-1.5 font-sans transition ${authMode === "signup" ? "bg-amber-500 text-slate-950 font-semibold shadow" : "text-amber-200 hover:text-amber-100"}`}
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                >
                  {t("auth.tab.signup")}
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">{t("auth.label.email")}</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.placeholder.email")}
                      className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-3 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {authMode === "signup" && (
                  <div>
                    <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">{t("auth.label.name")}</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500/70" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("auth.placeholder.name")}
                        className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-3 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                        maxLength={40}
                      />
                    </div>
                  </div>
                )}

                {authMode === "signup" && (
                  <div>
                    <label className="mb-1.5 block font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">{t("auth.label.country")}</label>
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
                    <label className="font-sans text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">{t("auth.label.password")}</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode("forgot"); setForgotEmail(email); setForgotError(""); setForgotSent(false); }}
                        className="font-sans text-[11px] text-amber-300/80 hover:text-amber-200"
                      >
                        {t("auth.forgot")}
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
                      placeholder={t("auth.placeholder.password")}
                      className="h-11 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 pl-10 pr-10 font-sans text-sm text-amber-50 placeholder-slate-500 outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
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
                  {authLoading ? t("auth.submit.loading") : authMode === "signup" ? t("auth.submit.signup") : t("auth.submit.login")}
                  {!authLoading && <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-amber-700/30" />
                <span className="font-sans text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("auth.or")}</span>
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
                {t("auth.security_note")}
              </p>
            </div>
          </div>
        )}
        {screen === "auth" && <FooterNav onSelect={openFooterModal} t={t} />}

        {screen === "ready" && player && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 text-center shadow-2xl">
            <p className="font-sans text-sm text-amber-300">{t("ready.welcome", { name: player.display_name })} {playerCountry?.flag}</p>
            <Divider />
            <h2 className="mb-4 font-serif text-xl font-bold">{t("ready.title")}</h2>
            <div className="mb-6 flex justify-center gap-6 font-sans text-xs text-amber-200">
              <div className="flex flex-col items-center gap-1">
                <BookOpen className="h-5 w-5 text-amber-400" />
                {t("ready.questions_count", { count: activeQuestionCount ?? "…" })}
              </div>
              <div className="flex flex-col items-center gap-1">
                <Timer className="h-5 w-5 text-amber-400" />
                {t("ready.seconds_per_q")}
              </div>
              <div className="flex flex-col items-center gap-1">
                <Crown className="h-5 w-5 text-amber-400" />
                {t("ready.climb")}
              </div>
            </div>
            <GoldButton onClick={startGame} disabled={loadingQuiz || activeQuestionCount === 0}>
              {loadingQuiz ? t("ready.loading") : activeQuestionCount === 0 ? t("ready.no_questions") : t("ready.start")}
            </GoldButton>
            {readyError && (
              <p className="mt-2 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 font-sans text-xs text-red-400">
                {readyError}
              </p>
            )}
            <div className="mt-4 flex justify-center gap-4 font-sans text-xs">
              <button type="button" onClick={openLeaderboard} className="flex items-center gap-1 text-amber-300 hover:text-amber-200">
                <Trophy className="h-3.5 w-3.5" /> {t("ready.leaderboard_link")}
              </button>
              <button type="button" onClick={logout} className="flex items-center gap-1 text-slate-300 hover:text-slate-200">
                <LogOut className="h-3.5 w-3.5" /> {t("ready.logout")}
              </button>
            </div>
          </div>
        )}
        {screen === "ready" && <FooterNav onSelect={openFooterModal} t={t} />}

        {screen === "quiz" && q && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border-2 border-amber-600/70 bg-slate-950/92 p-6 shadow-2xl">
            <div className="mb-3 flex items-start justify-between border-b border-amber-700/40 pb-3">
              <div>
                <p className="font-sans text-xs font-bold tracking-widest text-amber-400">
                  {t("quiz.question_of", { current: qIndex + 1, total: questions.length })}
                </p>
                <p className="mt-1 font-sans text-xs text-slate-400">{q.category} · {q.difficulty}</p>
              </div>
              <div
                className={`grid h-14 w-14 flex-none place-content-center rounded-full border-2 text-center ${timeLeft <= 10 ? "border-red-400" : "border-amber-400"}`}
              >
                <strong className={`font-sans text-xl leading-none ${timeLeft <= 10 ? "text-red-400" : "text-amber-300"}`}>
                  {timeLeft}
                </strong>
                <span className="font-sans text-[9px] tracking-widest text-slate-400">{t("quiz.seconds_short")}</span>
              </div>
            </div>

            <div className="mb-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-amber-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>

            {q.context && (
              <div className="mt-3 rounded-r-md border-l-2 border-amber-500 bg-slate-900/70 px-3 py-2">
                <span className="font-sans text-[10px] font-bold tracking-widest text-amber-400">{t("quiz.context_label")}</span>
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
                ? t("quiz.status.correct", { explanation: q.correct_explanation || "" })
                : selected
                ? t("quiz.status.wrong", { answer: correctOption?.[1] })
                : locked
                ? t("quiz.status.timeout", { answer: correctOption?.[1] })
                : t("quiz.status.prompt")}
            </p>

            {locked && q.source && (
              <div className="mt-3 border-t border-amber-700/30 pt-2 font-sans text-[10px] text-slate-400">
                <p>
                  <span className="font-bold text-amber-400">{t("quiz.source_label")} </span>
                  {q.source}{q.translation ? ` · ${q.translation}` : ""}
                </p>
                {q.original_text && <p className="mt-1 italic text-slate-500">”{q.original_text}”</p>}
                {q.source_url && (
                  <a href={q.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-amber-400 underline">
                    {t("quiz.read_more")}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {screen === "result" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 text-center shadow-2xl">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <h2 className="font-serif text-xl font-bold">{t("result.title", { name: player?.display_name })}</h2>
            <p className="mt-1 font-sans text-sm text-amber-200">
              {t("result.score_summary", { correct: correctCount, total: questions.length })}
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-amber-400">{score} {t("result.points_suffix")}</p>
            <Divider />
            <div className="space-y-2">
              <GoldButton onClick={() => setScreen("ready")}>{t("result.play_again")}</GoldButton>
              <button type="button"
                onClick={shareResult}
                className="w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
              >
                {t("result.share")}
              </button>
              <button type="button"
                onClick={openLeaderboard}
                className="w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
              >
                {t("result.view_leaderboard")}
              </button>
            </div>
            {shareStatus && <p className="mt-2 font-sans text-xs text-amber-300">{shareStatus}</p>}
          </div>
        )}

        {screen === "leaderboard" && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 shadow-2xl">
            <h2 className="mb-1 text-center font-serif text-lg font-bold tracking-wide">
              <Medal className="mr-1 inline h-5 w-5 text-amber-400" /> {t("lb.title")}
            </h2>
            <Divider />
            {leaderboardLoading && <p className="text-center font-sans text-sm text-slate-400">{t("lb.loading")}</p>}
            {!leaderboardLoading && leaderboard.length === 0 && (
              <p className="text-center font-sans text-sm text-slate-400">{t("lb.empty")}</p>
            )}

            {!leaderboardLoading && leaderboard.length > 0 && (() => {
              const leader = leaderboard[0];
              const leaderFlag = COUNTRIES.find((c) => c.code === leader.country_code)?.flag;
              return (
                <div className="mb-4 flex flex-col items-center gap-1 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/60 to-slate-900/60 px-4 py-4 text-center shadow-lg shadow-amber-900/30">
                  <Crown className="h-7 w-7 text-amber-300" />
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-amber-400">{t("lb.leading")}</p>
                  <p className="font-serif text-lg font-bold text-amber-100">{leaderFlag} {leader.display_name}</p>
                  <p className="font-serif text-2xl font-bold text-amber-400">{leader.best_score} {t("result.points_suffix")}</p>
                </div>
              );
            })()}

            <ol className="space-y-2 font-sans text-sm">
              {leaderboard.map((row, i) => {
                const c = COUNTRIES.find((c) => c.code === row.country_code);
                const rank = i + 1;
                const medalStyle =
                  rank === 1 ? "border-amber-300 bg-amber-400 text-slate-950"
                  : rank === 2 ? "border-slate-300 bg-slate-300/90 text-slate-950"
                  : rank === 3 ? "border-orange-700 bg-orange-700/80 text-white"
                  : "border-amber-800/30 bg-slate-800 text-amber-300";
                return (
                  <li key={row.player_id} className={`flex items-center justify-between rounded-md border px-3 py-2 ${rank <= 3 ? "border-amber-500/40 bg-slate-900/70" : "border-amber-800/30 bg-slate-900/50"}`}>
                    <span className="flex items-center gap-2">
                      <span className={`grid h-6 w-6 flex-none place-content-center rounded-full border text-xs font-bold ${medalStyle}`}>
                        {rank}
                      </span>
                      <span>{c?.flag}</span>
                      <span className={row.player_id === player?.id ? "font-bold text-amber-300" : ""}>{row.display_name}</span>
                    </span>
                    <span className="text-amber-400">{row.best_score} {t("result.points_suffix")}</span>
                  </li>
                );
              })}
            </ol>
            <button type="button"
              onClick={() => setScreen(player ? "ready" : "auth")}
              className="mt-4 w-full rounded-lg border border-amber-600/50 py-2.5 font-sans text-sm text-amber-200 hover:bg-amber-900/20"
            >
              {t("lb.back")}
            </button>
          </div>
        )}
      </div>

      {footerModal === "about" && (
        <Modal title={t("about.title")} onClose={closeFooterModal}>
          <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-300">
            <p>{t("about.p1")}</p>
            <p>{t("about.p2")}</p>
          </div>
        </Modal>
      )}

      {footerModal === "donate" && (
        <Modal title={t("donate.title")} onClose={closeFooterModal}>
          <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-300">
            <p>{t("donate.p1")}</p>
            <div className="rounded-lg border border-amber-700/40 bg-slate-900/50 p-4 text-amber-200">
              <p className="font-semibold">{t("donate.placeholder_title")}</p>
              <p className="mt-1 text-xs text-slate-400">{t("donate.placeholder_body")}</p>
            </div>
          </div>
        </Modal>
      )}

      {footerModal === "contact" && (
        <Modal title={t("contact.title")} onClose={closeFooterModal}>
          {!contactSent ? (
            <div className="space-y-3 font-sans text-sm">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">{t("contact.label.name")}</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">{t("contact.label.email")}</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="h-10 w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-amber-300/80">{t("contact.label.message")}</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-amber-700/50 bg-slate-900/60 px-3 py-2 text-amber-50 outline-none focus:border-amber-400"
                />
              </div>
              {contactError && <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{contactError}</p>}
              <GoldButton type="button" onClick={submitContactForm} disabled={contactSending}>
                {contactSending ? t("contact.sending") : t("contact.submit")}
              </GoldButton>
            </div>
          ) : (
            <p className="font-sans text-sm text-green-400">{t("contact.sent")}</p>
          )}
        </Modal>
      )}

      {footerModal === "admin" && (
        <Modal title="Admin - frågehantering" onClose={closeFooterModal} wide>
          {!adminAuthed ? (
            <div className="space-y-3 font-sans text-sm">
              <p className="text-xs text-slate-400">
                Adminkoden verifieras mot databasen, inte i klientkoden.
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
              <GoldButton type="button" onClick={handleAdminLogin} disabled={adminLoginLoading}>
                {adminLoginLoading ? "Kontrollerar…" : "Lås upp"}
              </GoldButton>
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

              <div className="mb-3 rounded-lg border border-amber-700/30 bg-slate-900/40 p-3 text-xs leading-relaxed text-slate-400">
                Automatisk AI-frågegenerering är avstängd tills en riktig AI-nyckel kopplas på via en säker
                serverfunktion. Lägg till nya frågor manuellt genom att skriva dem direkt i Supabase tills vidare.
              </div>

              <div className="mb-4 flex rounded-lg border border-amber-700/40 p-1 text-xs">
                <button type="button" onClick={() => setAdminTab("pending")} className={`flex-1 rounded-md py-1.5 ${adminTab === "pending" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Att granska ({adminStats.pending})</button>
                <button type="button" onClick={() => setAdminTab("published")} className={`flex-1 rounded-md py-1.5 ${adminTab === "published" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Publicerade ({adminStats.approved})</button>
                <button type="button" onClick={() => setAdminTab("messages")} className={`flex-1 rounded-md py-1.5 ${adminTab === "messages" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Meddelanden ({messages.filter((m) => !m.handled).length})</button>
                <button type="button" onClick={openOutreachTab} className={`flex-1 rounded-md py-1.5 ${adminTab === "outreach" ? "bg-amber-500 font-semibold text-slate-950" : "text-amber-200"}`}>Kyrko-agent</button>
              </div>

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

              {adminTab === "messages" && (
                <div className="max-h-[50vh] space-y-3 overflow-y-auto">
                  {adminListLoading && <p className="text-center text-xs text-slate-400">Laddar…</p>}
                  {!adminListLoading && messages.length === 0 && (
                    <p className="text-center text-xs text-slate-400">Inga meddelanden ännu.</p>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={`rounded-lg border p-3 ${m.handled ? "border-slate-700/40 bg-slate-900/30 opacity-70" : "border-amber-700/30 bg-slate-900/50"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-amber-300">{m.name || "(inget namn angivet)"}</p>
                          <p className="text-xs text-slate-400">{m.email}</p>
                        </div>
                        <button type="button"
                          onClick={() => toggleMessageHandled(m.id, m.handled)}
                          className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${m.handled ? "bg-slate-700 text-slate-300" : "bg-green-600 text-white"}`}
                        >
                          {m.handled ? "Hanterat" : "Markera hanterat"}
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap font-serif text-sm">{m.message}</p>
                      <p className="mt-2 text-[10px] text-slate-500">{new Date(m.created_at).toLocaleString("sv-SE")}</p>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === "outreach" && (
                <div className="max-h-[50vh] space-y-4 overflow-y-auto">
                  <div className="rounded-lg border border-amber-700/30 bg-slate-900/40 p-3 text-xs leading-relaxed text-slate-400">
                    Kyrko-kontakter och avsändardomäner hämtas live från Resend. <strong className="text-amber-300">Inget skickas härifrån</strong> —
                    detta är bara en översikt. Utskick kräver att du godkänner mejltexten och uttryckligen säger "skicka nu" i en separat chatt.
                  </div>

                  {outreachLoading && <p className="text-center text-xs text-slate-400">Hämtar från Resend…</p>}
                  {outreachError && <p className="rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">{outreachError}</p>}

                  {!outreachLoading && outreachDomains.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">Avsändardomäner i Resend</p>
                      <div className="flex flex-wrap gap-2">
                        {outreachDomains.map((d) => (
                          <span key={d.name} className={`rounded-full px-2.5 py-1 text-xs ${d.status === "verified" ? "bg-green-900/40 text-green-300" : "bg-slate-700/60 text-slate-300"}`}>
                            {d.name} · {d.status}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500">
                        biblerun.se är inte med i listan än - inga mejl kan skickas från en @biblerun.se-adress förrän domänen verifieras hos Resend (DNS hos Loopia).
                      </p>
                    </div>
                  )}

                  {!outreachLoading && outreachSegments.map((seg) => (
                    <div key={seg.id}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">{seg.name} ({seg.contacts.length})</p>
                      <div className="space-y-1">
                        {seg.contacts.map((c) => (
                          <div key={c.email} className="flex items-center justify-between rounded-md border border-amber-800/20 bg-slate-900/40 px-3 py-1.5 text-xs">
                            <span className="text-amber-100">{c.name || "(namnlös)"}</span>
                            <span className="text-slate-400">{c.email}</span>
                          </div>
                        ))}
                      </div>
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
