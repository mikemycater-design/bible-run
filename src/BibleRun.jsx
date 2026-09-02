import { useState, useEffect, useRef, useCallback } from "react";
import { Crown, BookOpen, Timer, Trophy, LogOut, Check, X, Medal, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Globe2, ChevronRight } from "lucide-react";

const SUPABASE_URL = "https://mhgnikriicjamwmxdjdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_qZQ3fm0Xs6uFGEMYg-RoSg_g-PktFsf";
const QUESTION_SECONDS = 30;
const REVEAL_SECONDS = 6;
const QUIZ_LENGTH = 12;
const DIFFICULTY_ORDER = { Grundnivå: 0, Medel: 1, Svår: 2 };

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Bygger en omgång som blir gradvis svårare: drar frågor jämnt ur varje
// svårighetsnivå (slumpat inom nivån för variation mellan omgångar) och
// sorterar sedan Grundnivå -> Medel -> Svår.
function buildQuizSet(pool, size) {
  const tiers = {};
  for (const q of pool) {
    const key = q.difficulty in DIFFICULTY_ORDER ? q.difficulty : "Övrigt";
    (tiers[key] ??= []).push(q);
  }
  const tierNames = Object.keys(tiers).sort(
    (a, b) => (DIFFICULTY_ORDER[a] ?? 99) - (DIFFICULTY_ORDER[b] ?? 99)
  );
  const shuffledTiers = tierNames.map((name) => shuffled(tiers[name]));
  const perTier = Math.max(1, Math.ceil(size / tierNames.length));
  let selection = shuffledTiers.flatMap((arr) => arr.slice(0, perTier)).slice(0, size);
  if (selection.length < Math.min(size, pool.length)) {
    const used = new Set(selection.map((q) => q.id));
    const leftovers = shuffledTiers.flat().filter((q) => !used.has(q.id));
    selection = selection.concat(leftovers).slice(0, size);
  }
  return selection.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99));
}

const COUNTRIES = [
  { code: "SE", name: "Sverige", flag: "🇸🇪" },
  { code: "NO", name: "Norge", flag: "🇳🇴" },
  { code: "DK", name: "Danmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "OTHER", name: "Annat land / Other", flag: "🌍" },
];

// Windows renderar inte flagg-emoji (visar bara landskoden som text), så vi använder
// riktiga flaggbilder istället för att flaggan ska synas på alla plattformar.
function FlagIcon({ code, className = "" }) {
  if (!code || code === "OTHER") {
    return <span className={className}>🌍</span>;
  }
  return (
    <img
      src={`https://flagcdn.com/24x18/${code.toLowerCase()}.png`}
      width={20}
      height={15}
      alt={code}
      className={`inline-block flex-none rounded-[2px] align-middle ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

const LANG_TO_COUNTRY = {
  en: "gb", sv: "se", no: "no", da: "dk", fi: "fi", es: "es",
  pt: "pt", fr: "fr", de: "de", tl: "ph", ko: "kr", th: "th",
  it: "it", nl: "nl", pl: "pl", ru: "ru", ar: "eg", zh: "cn",
  hi: "in", vi: "vn", id: "id", tr: "tr", el: "gr", sw: "ke",
};

const RTL_LANGS = new Set(["ar"]);

const LEVEL_SCORE_STEP = 500;

function levelFromScore(totalScore) {
  return Math.floor((totalScore || 0) / LEVEL_SCORE_STEP) + 1;
}

const LANG_KEY = "bible_run_lang";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "fi", label: "Suomi" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "hi", label: "हिन्दी" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "tr", label: "Türkçe" },
  { code: "el", label: "Ελληνικά" },
  { code: "sw", label: "Kiswahili" },
  { code: "tl", label: "Filipino" },
  { code: "ko", label: "한국어" },
  { code: "th", label: "ไทย" },
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
    "err.too_many_attempts": "För många försök. Vänta 15 minuter och försök igen.",
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
    "ready.questions_count_one": "{count} fråga",
    "ready.questions_count": "{count} frågor",
    "ready.seconds_per_q": "30 sek/fråga",
    "ready.climb": "Klättra i rang",
    "ready.level": "Nivå {level}",
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
    "quiz.next_in": "Nästa fråga om {seconds}s…",
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
    "err.too_many_attempts": "Too many attempts. Wait 15 minutes and try again.",
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
    "ready.questions_count_one": "{count} question",
    "ready.questions_count": "{count} questions",
    "ready.seconds_per_q": "30 sec/question",
    "ready.climb": "Climb the ranks",
    "ready.level": "Level {level}",
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
    "quiz.next_in": "Next question in {seconds}s…",
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
  no: {
    "auth.title.login": "Velkommen tilbake",
    "auth.title.signup": "Opprett din konto",
    "auth.subtitle.login": "Logg inn for å fortsette å spille",
    "auth.subtitle.signup": "Registrer deg for å begynne å spille",
    "auth.tab.login": "Logg inn",
    "auth.tab.signup": "Ny konto",
    "auth.label.email": "E-post",
    "auth.placeholder.email": "din@epost.no",
    "auth.label.name": "Ditt navn",
    "auth.placeholder.name": "Skriv navnet ditt",
    "auth.label.country": "Velg land",
    "auth.label.password": "Passord",
    "auth.forgot": "Glemt passord?",
    "auth.placeholder.password": "Minst 8 tegn",
    "auth.submit.login": "Logg inn",
    "auth.submit.signup": "Opprett konto",
    "auth.submit.loading": "Et øyeblikk…",
    "auth.or": "eller fortsett med",
    "auth.security_note": "Passordet ditt hashes og lagres sikkert i databasen. Vi ser aldri passordet ditt i klartekst.",
    "auth.show_password": "Vis passord",
    "auth.hide_password": "Skjul passord",
    "err.email_invalid": "Skriv en gyldig e-postadresse.",
    "err.name_short": "Skriv navnet ditt (minst 2 tegn).",
    "err.password_short": "Passordet må være minst 8 tegn.",
    "err.email_taken": "Det finnes allerede en konto med den e-postadressen. Logg inn i stedet.",
    "err.login_failed": "Feil e-post eller passord.",
    "err.too_many_attempts": "For mange forsøk. Vent 15 minutter og prøv igjen.",
    "err.generic": "Noe gikk galt. Prøv igjen.",
    "err.oauth_failed": "Innloggingen mislyktes. Prøv igjen.",
    "forgot.title": "Tilbakestill passord",
    "forgot.desc": "Skriv e-postadressen din, så sender vi deg en lenke for å angi et nytt passord.",
    "forgot.submit": "Send tilbakestillingslenke",
    "forgot.sending": "Sender…",
    "forgot.success": "Hvis det finnes en konto med den adressen, har vi sendt en lenke dit. Sjekk innboksen (og søppelpost).",
    "forgot.back": "Tilbake til innlogging",
    "reset.title": "Angi nytt passord",
    "reset.desc": "Velg et nytt passord for kontoen din.",
    "reset.label": "Nytt passord",
    "reset.submit": "Angi nytt passord",
    "reset.saving": "Lagrer…",
    "reset.success": "Passordet er oppdatert! Du kan nå logge inn med det nye passordet.",
    "reset.to_login": "Til innlogging",
    "reset.expired": "Lenken har utløpt eller er allerede brukt. Be om en ny tilbakestillingslenke.",
    "ready.welcome": "Velkommen, {name}",
    "ready.title": "Klar til å gi deg ut?",
    "ready.questions_count": "{count} spørsmål",
    "ready.seconds_per_q": "30 sek/spørsmål",
    "ready.climb": "Klatre i rang",
    "ready.level": "Nivå {level}",
    "ready.start": "Start spillet",
    "ready.loading": "Laster spørsmål…",
    "ready.no_questions": "Ingen spørsmål publisert ennå",
    "ready.leaderboard_link": "Poengliste",
    "ready.logout": "Logg ut",
    "ready.err_no_questions": "Ingen spørsmål er publisert akkurat nå. Prøv igjen senere.",
    "ready.err_fetch": "Kunne ikke hente spørsmål. Prøv igjen.",
    "quiz.question_of": "SPØRSMÅL {current} AV {total}",
    "quiz.context_label": "KONTEKST",
    "quiz.status.correct": "Riktig! {explanation}",
    "quiz.status.wrong": "Ikke helt. Riktig svar er {answer}.",
    "quiz.status.timeout": "Tiden er ute. Riktig svar er {answer}.",
    "quiz.status.prompt": "Velg et svar før tiden går ut.",
    "quiz.source_label": "KILDE",
    "quiz.read_more": "Les hele teksten",
    "quiz.next_in": "Neste spørsmål om {seconds}s…",
    "quiz.seconds_short": "SEK",
    "result.title": "Godt kjempet, {name}!",
    "result.score_summary": "{correct} av {total} riktige",
    "result.points_suffix": "p",
    "result.play_again": "Spill igjen",
    "result.share": "Del resultatet ditt",
    "result.view_leaderboard": "Se poenglisten",
    "result.share_copied": "Kopiert! Lim inn der du vil dele det.",
    "result.share_text": "Jeg fikk {score} poeng ({correct}/{total} riktige) i Bible Run! Klarer du bedre?",
    "lb.title": "POENGLISTEN",
    "lb.loading": "Henter…",
    "lb.empty": "Ingen har spilt ennå. Bli den første!",
    "lb.leading": "I ledelsen",
    "lb.back": "Tilbake",
    "footer.about": "Om oss",
    "footer.donate": "Send en gave",
    "footer.contact": "Kontakt oss",
    "footer.admin": "Admin",
    "about.title": "Om Bible Run",
    "about.p1": "Bible Run er en bibelkunnskapsquiz der du kappes mot klokken og mot andre spillere fra hele verden. Hvert spørsmål er basert på ekte bibeltekster, med kildehenvisning og kontekst, slik at du lærer noe underveis - ikke bare gjetter.",
    "about.p2": "Alle spørsmål blir gjennomgått og godkjent manuelt før de publiseres, for å holde høy kvalitet på innholdet.",
    "donate.title": "Send en gave",
    "donate.p1": "Bible Run drives ideelt. Vil du støtte driften og videre utvikling, setter vi stor pris på det.",
    "donate.placeholder_title": "Betaling er ikke koblet til ennå.",
    "donate.placeholder_body": "Denne boksen er en plassholder - ingen betaling kan mottas her i dag. Ta kontakt via \"Kontakt oss\" så ordner vi en ekte donasjonsflyt (f.eks. kort) sammen.",
    "contact.title": "Kontakt oss",
    "contact.label.name": "Navn (valgfritt)",
    "contact.label.email": "E-post",
    "contact.label.message": "Melding",
    "contact.submit": "Send melding",
    "contact.sending": "Sender…",
    "contact.sent": "Takk! Meldingen er lagret, og vi kommer tilbake til deg.",
    "contact.err_message": "Skriv en melding.",
    "contact.err_generic": "Kunne ikke sende meldingen. Prøv igjen.",
  },
  da: {
    "auth.title.login": "Velkommen tilbage",
    "auth.title.signup": "Opret din konto",
    "auth.subtitle.login": "Log ind for at fortsætte med at spille",
    "auth.subtitle.signup": "Tilmeld dig for at begynde at spille",
    "auth.tab.login": "Log ind",
    "auth.tab.signup": "Ny konto",
    "auth.label.email": "E-mail",
    "auth.placeholder.email": "din@email.dk",
    "auth.label.name": "Dit navn",
    "auth.placeholder.name": "Skriv dit navn",
    "auth.label.country": "Vælg land",
    "auth.label.password": "Adgangskode",
    "auth.forgot": "Glemt adgangskode?",
    "auth.placeholder.password": "Mindst 8 tegn",
    "auth.submit.login": "Log ind",
    "auth.submit.signup": "Opret konto",
    "auth.submit.loading": "Et øjeblik…",
    "auth.or": "eller fortsæt med",
    "auth.security_note": "Din adgangskode hashes og gemmes sikkert i databasen. Vi ser aldrig din adgangskode i klartekst.",
    "auth.show_password": "Vis adgangskode",
    "auth.hide_password": "Skjul adgangskode",
    "err.email_invalid": "Skriv en gyldig e-mailadresse.",
    "err.name_short": "Skriv dit navn (mindst 2 tegn).",
    "err.password_short": "Adgangskoden skal være mindst 8 tegn.",
    "err.email_taken": "Der findes allerede en konto med den e-mailadresse. Log ind i stedet.",
    "err.login_failed": "Forkert e-mail eller adgangskode.",
    "err.too_many_attempts": "For mange forsøg. Vent 15 minutter, og prøv igen.",
    "err.generic": "Noget gik galt. Prøv igen.",
    "err.oauth_failed": "Login mislykkedes. Prøv igen.",
    "forgot.title": "Nulstil adgangskode",
    "forgot.desc": "Skriv din e-mailadresse, så sender vi dig et link til at angive en ny adgangskode.",
    "forgot.submit": "Send nulstillingslink",
    "forgot.sending": "Sender…",
    "forgot.success": "Hvis der findes en konto med den adresse, har vi sendt et link dertil. Tjek din indbakke (og spam).",
    "forgot.back": "Tilbage til login",
    "reset.title": "Angiv ny adgangskode",
    "reset.desc": "Vælg en ny adgangskode til din konto.",
    "reset.label": "Ny adgangskode",
    "reset.submit": "Angiv ny adgangskode",
    "reset.saving": "Gemmer…",
    "reset.success": "Adgangskoden er opdateret! Du kan nu logge ind med den nye adgangskode.",
    "reset.to_login": "Til login",
    "reset.expired": "Linket er udløbet eller allerede brugt. Anmod om et nyt nulstillingslink.",
    "ready.welcome": "Velkommen, {name}",
    "ready.title": "Klar til at give dig i kast?",
    "ready.questions_count": "{count} spørgsmål",
    "ready.seconds_per_q": "30 sek/spørgsmål",
    "ready.climb": "Klatre i rang",
    "ready.level": "Niveau {level}",
    "ready.start": "Start spillet",
    "ready.loading": "Indlæser spørgsmål…",
    "ready.no_questions": "Ingen spørgsmål udgivet endnu",
    "ready.leaderboard_link": "Resultatliste",
    "ready.logout": "Log ud",
    "ready.err_no_questions": "Ingen spørgsmål er udgivet lige nu. Prøv igen senere.",
    "ready.err_fetch": "Kunne ikke hente spørgsmål. Prøv igen.",
    "quiz.question_of": "SPØRGSMÅL {current} AF {total}",
    "quiz.context_label": "KONTEKST",
    "quiz.status.correct": "Rigtigt! {explanation}",
    "quiz.status.wrong": "Ikke helt. Det rigtige svar er {answer}.",
    "quiz.status.timeout": "Tiden er gået. Det rigtige svar er {answer}.",
    "quiz.status.prompt": "Vælg et svar, før tiden løber ud.",
    "quiz.source_label": "KILDE",
    "quiz.read_more": "Læs hele teksten",
    "quiz.next_in": "Næste spørgsmål om {seconds}s…",
    "quiz.seconds_short": "SEK",
    "result.title": "Flot kæmpet, {name}!",
    "result.score_summary": "{correct} af {total} rigtige",
    "result.points_suffix": "p",
    "result.play_again": "Spil igen",
    "result.share": "Del dit resultat",
    "result.view_leaderboard": "Se resultatlisten",
    "result.share_copied": "Kopieret! Indsæt det, hvor du vil dele det.",
    "result.share_text": "Jeg fik {score} point ({correct}/{total} rigtige) i Bible Run! Kan du klare det bedre?",
    "lb.title": "RESULTATLISTEN",
    "lb.loading": "Henter…",
    "lb.empty": "Ingen har spillet endnu. Bliv den første!",
    "lb.leading": "Fører",
    "lb.back": "Tilbage",
    "footer.about": "Om os",
    "footer.donate": "Send en gave",
    "footer.contact": "Kontakt os",
    "footer.admin": "Admin",
    "about.title": "Om Bible Run",
    "about.p1": "Bible Run er en bibelvidenquiz, hvor du konkurrerer mod uret og mod andre spillere fra hele verden. Hvert spørgsmål bygger på virkelige bibeltekster, med kildehenvisning og kontekst, så du lærer noget undervejs - ikke bare gætter.",
    "about.p2": "Alle spørgsmål gennemgås og godkendes manuelt, før de udgives, for at holde en høj kvalitet i indholdet.",
    "donate.title": "Send en gave",
    "donate.p1": "Bible Run drives non-profit. Hvis du vil støtte driften og den fortsatte udvikling, er vi taknemmelige.",
    "donate.placeholder_title": "Betaling er ikke tilsluttet endnu.",
    "donate.placeholder_body": "Denne boks er en pladsholder - ingen betaling kan modtages her i dag. Kontakt os via \"Kontakt os\", så ordner vi en rigtig donationsflow (f.eks. kort) sammen.",
    "contact.title": "Kontakt os",
    "contact.label.name": "Navn (valgfrit)",
    "contact.label.email": "E-mail",
    "contact.label.message": "Besked",
    "contact.submit": "Send besked",
    "contact.sending": "Sender…",
    "contact.sent": "Tak! Din besked er gemt, og vi vender tilbage til dig.",
    "contact.err_message": "Skriv en besked.",
    "contact.err_generic": "Kunne ikke sende beskeden. Prøv igen.",
  },
  fi: {
    "auth.title.login": "Tervetuloa takaisin",
    "auth.title.signup": "Luo tili",
    "auth.subtitle.login": "Kirjaudu sisään jatkaaksesi pelaamista",
    "auth.subtitle.signup": "Rekisteröidy aloittaaksesi pelaamisen",
    "auth.tab.login": "Kirjaudu sisään",
    "auth.tab.signup": "Uusi tili",
    "auth.label.email": "Sähköposti",
    "auth.placeholder.email": "sina@esimerkki.fi",
    "auth.label.name": "Nimesi",
    "auth.placeholder.name": "Kirjoita nimesi",
    "auth.label.country": "Valitse maa",
    "auth.label.password": "Salasana",
    "auth.forgot": "Unohditko salasanan?",
    "auth.placeholder.password": "Vähintään 8 merkkiä",
    "auth.submit.login": "Kirjaudu sisään",
    "auth.submit.signup": "Luo tili",
    "auth.submit.loading": "Hetki…",
    "auth.or": "tai jatka",
    "auth.security_note": "Salasanasi tiivistetään (hash) ja tallennetaan tietokantaan turvallisesti. Emme näe salasanaasi koskaan selkokielisenä.",
    "auth.show_password": "Näytä salasana",
    "auth.hide_password": "Piilota salasana",
    "err.email_invalid": "Kirjoita kelvollinen sähköpostiosoite.",
    "err.name_short": "Kirjoita nimesi (vähintään 2 merkkiä).",
    "err.password_short": "Salasanan on oltava vähintään 8 merkkiä.",
    "err.email_taken": "Tällä sähköpostiosoitteella on jo tili. Kirjaudu sisään sen sijaan.",
    "err.login_failed": "Väärä sähköposti tai salasana.",
    "err.too_many_attempts": "Liian monta yritystä. Odota 15 minuuttia ja yritä uudelleen.",
    "err.generic": "Jokin meni pieleen. Yritä uudelleen.",
    "err.oauth_failed": "Kirjautuminen epäonnistui. Yritä uudelleen.",
    "forgot.title": "Palauta salasana",
    "forgot.desc": "Kirjoita sähköpostiosoitteesi, niin lähetämme linkin uuden salasanan asettamiseksi.",
    "forgot.submit": "Lähetä palautuslinkki",
    "forgot.sending": "Lähetetään…",
    "forgot.success": "Jos tällä osoitteella on tili, olemme lähettäneet sinne linkin. Tarkista postilaatikkosi (ja roskaposti).",
    "forgot.back": "Takaisin kirjautumiseen",
    "reset.title": "Aseta uusi salasana",
    "reset.desc": "Valitse tilillesi uusi salasana.",
    "reset.label": "Uusi salasana",
    "reset.submit": "Aseta uusi salasana",
    "reset.saving": "Tallennetaan…",
    "reset.success": "Salasana on päivitetty! Voit nyt kirjautua sisään uudella salasanalla.",
    "reset.to_login": "Kirjautumiseen",
    "reset.expired": "Linkki on vanhentunut tai jo käytetty. Pyydä uusi palautuslinkki.",
    "ready.welcome": "Tervetuloa, {name}",
    "ready.title": "Valmiina lähtemään?",
    "ready.questions_count_one": "{count} kysymys",
    "ready.questions_count": "{count} kysymystä",
    "ready.seconds_per_q": "30 sek/kysymys",
    "ready.climb": "Nouse sijoituksissa",
    "ready.level": "Taso {level}",
    "ready.start": "Aloita peli",
    "ready.loading": "Ladataan kysymyksiä…",
    "ready.no_questions": "Ei vielä julkaistuja kysymyksiä",
    "ready.leaderboard_link": "Tulostaulukko",
    "ready.logout": "Kirjaudu ulos",
    "ready.err_no_questions": "Kysymyksiä ei ole juuri nyt julkaistu. Yritä myöhemmin uudelleen.",
    "ready.err_fetch": "Kysymysten hakeminen epäonnistui. Yritä uudelleen.",
    "quiz.question_of": "KYSYMYS {current}/{total}",
    "quiz.context_label": "ASIAYHTEYS",
    "quiz.status.correct": "Oikein! {explanation}",
    "quiz.status.wrong": "Ei aivan. Oikea vastaus on {answer}.",
    "quiz.status.timeout": "Aika loppui. Oikea vastaus on {answer}.",
    "quiz.status.prompt": "Valitse vastaus ennen ajan loppumista.",
    "quiz.source_label": "LÄHDE",
    "quiz.read_more": "Lue koko teksti",
    "quiz.next_in": "Seuraava kysymys {seconds}s kuluttua…",
    "quiz.seconds_short": "SEK",
    "result.title": "Hyvin taisteltu, {name}!",
    "result.score_summary": "{correct}/{total} oikein",
    "result.points_suffix": "p",
    "result.play_again": "Pelaa uudelleen",
    "result.share": "Jaa tuloksesi",
    "result.view_leaderboard": "Katso tulostaulukko",
    "result.share_copied": "Kopioitu! Liitä se minne haluat jakaa sen.",
    "result.share_text": "Sain {score} pistettä ({correct}/{total} oikein) Bible Run -pelissä! Pystytkö parempaan?",
    "lb.title": "TULOSTAULUKKO",
    "lb.loading": "Haetaan…",
    "lb.empty": "Kukaan ei ole vielä pelannut. Ole ensimmäinen!",
    "lb.leading": "Kärjessä",
    "lb.back": "Takaisin",
    "footer.about": "Tietoa meistä",
    "footer.donate": "Lähetä lahjoitus",
    "footer.contact": "Ota yhteyttä",
    "footer.admin": "Admin",
    "about.title": "Tietoa Bible Run -pelistä",
    "about.p1": "Bible Run on raamatuntuntemus-visailu, jossa kilpailet kelloa ja muita pelaajia vastaan ympäri maailmaa. Jokainen kysymys perustuu todellisiin raamatunteksteihin, lähdeviitteineen ja asiayhteyksineen, jotta opit jotain matkan varrella - et vain arvaa.",
    "about.p2": "Kaikki kysymykset tarkistetaan ja hyväksytään manuaalisesti ennen julkaisua, jotta sisällön laatu pysyy korkeana.",
    "donate.title": "Lähetä lahjoitus",
    "donate.p1": "Bible Run toimii voittoa tavoittelemattomana. Jos haluat tukea toimintaa ja jatkokehitystä, olemme kiitollisia.",
    "donate.placeholder_title": "Maksua ei ole vielä kytketty.",
    "donate.placeholder_body": "Tämä laatikko on paikkamerkki - maksuja ei voida vielä vastaanottaa täällä. Ota yhteyttä \"Ota yhteyttä\" -kohdan kautta, niin järjestämme yhdessä oikean lahjoitustavan (esim. kortti).",
    "contact.title": "Ota yhteyttä",
    "contact.label.name": "Nimi (valinnainen)",
    "contact.label.email": "Sähköposti",
    "contact.label.message": "Viesti",
    "contact.submit": "Lähetä viesti",
    "contact.sending": "Lähetetään…",
    "contact.sent": "Kiitos! Viestisi on tallennettu, ja palaamme asiaan.",
    "contact.err_message": "Kirjoita viesti.",
    "contact.err_generic": "Viestin lähettäminen epäonnistui. Yritä uudelleen.",
  },
  es: {
    "auth.title.login": "Bienvenido de nuevo",
    "auth.title.signup": "Crea tu cuenta",
    "auth.subtitle.login": "Inicia sesión para seguir jugando",
    "auth.subtitle.signup": "Regístrate para empezar a jugar",
    "auth.tab.login": "Iniciar sesión",
    "auth.tab.signup": "Cuenta nueva",
    "auth.label.email": "Correo electrónico",
    "auth.placeholder.email": "tu@correo.com",
    "auth.label.name": "Tu nombre",
    "auth.placeholder.name": "Escribe tu nombre",
    "auth.label.country": "Elige tu país",
    "auth.label.password": "Contraseña",
    "auth.forgot": "¿Olvidaste tu contraseña?",
    "auth.placeholder.password": "Mínimo 8 caracteres",
    "auth.submit.login": "Iniciar sesión",
    "auth.submit.signup": "Crear cuenta",
    "auth.submit.loading": "Un momento…",
    "auth.or": "o continúa con",
    "auth.security_note": "Tu contraseña se cifra (hash) y se guarda de forma segura en la base de datos. Nunca vemos tu contraseña en texto plano.",
    "auth.show_password": "Mostrar contraseña",
    "auth.hide_password": "Ocultar contraseña",
    "err.email_invalid": "Escribe una dirección de correo válida.",
    "err.name_short": "Escribe tu nombre (mínimo 2 caracteres).",
    "err.password_short": "La contraseña debe tener al menos 8 caracteres.",
    "err.email_taken": "Ya existe una cuenta con ese correo. Inicia sesión en su lugar.",
    "err.login_failed": "Correo o contraseña incorrectos.",
    "err.too_many_attempts": "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.",
    "err.generic": "Algo salió mal. Inténtalo de nuevo.",
    "err.oauth_failed": "El inicio de sesión falló. Inténtalo de nuevo.",
    "forgot.title": "Restablecer contraseña",
    "forgot.desc": "Escribe tu correo electrónico y te enviaremos un enlace para establecer una nueva contraseña.",
    "forgot.submit": "Enviar enlace de restablecimiento",
    "forgot.sending": "Enviando…",
    "forgot.success": "Si existe una cuenta con esa dirección, te hemos enviado un enlace. Revisa tu bandeja de entrada (y spam).",
    "forgot.back": "Volver al inicio de sesión",
    "reset.title": "Establecer nueva contraseña",
    "reset.desc": "Elige una nueva contraseña para tu cuenta.",
    "reset.label": "Nueva contraseña",
    "reset.submit": "Establecer nueva contraseña",
    "reset.saving": "Guardando…",
    "reset.success": "¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva contraseña.",
    "reset.to_login": "Ir a iniciar sesión",
    "reset.expired": "El enlace ha caducado o ya se usó. Solicita un nuevo enlace de restablecimiento.",
    "ready.welcome": "Bienvenido, {name}",
    "ready.title": "¿Listo para empezar?",
    "ready.questions_count_one": "{count} pregunta",
    "ready.questions_count": "{count} preguntas",
    "ready.seconds_per_q": "30 seg/pregunta",
    "ready.climb": "Sube de rango",
    "ready.level": "Nivel {level}",
    "ready.start": "Empezar a jugar",
    "ready.loading": "Cargando preguntas…",
    "ready.no_questions": "Aún no hay preguntas publicadas",
    "ready.leaderboard_link": "Clasificación",
    "ready.logout": "Cerrar sesión",
    "ready.err_no_questions": "No hay preguntas publicadas en este momento. Inténtalo más tarde.",
    "ready.err_fetch": "No se pudieron cargar las preguntas. Inténtalo de nuevo.",
    "quiz.question_of": "PREGUNTA {current} DE {total}",
    "quiz.context_label": "CONTEXTO",
    "quiz.status.correct": "¡Correcto! {explanation}",
    "quiz.status.wrong": "No es correcto. La respuesta correcta es {answer}.",
    "quiz.status.timeout": "Se acabó el tiempo. La respuesta correcta es {answer}.",
    "quiz.status.prompt": "Elige una respuesta antes de que se acabe el tiempo.",
    "quiz.source_label": "FUENTE",
    "quiz.read_more": "Leer el texto completo",
    "quiz.next_in": "Siguiente pregunta en {seconds}s…",
    "quiz.seconds_short": "SEG",
    "result.title": "¡Bien jugado, {name}!",
    "result.score_summary": "{correct} de {total} correctas",
    "result.points_suffix": "pts",
    "result.play_again": "Jugar de nuevo",
    "result.share": "Comparte tu resultado",
    "result.view_leaderboard": "Ver la clasificación",
    "result.share_copied": "¡Copiado! Pégalo donde quieras compartirlo.",
    "result.share_text": "¡Obtuve {score} puntos ({correct}/{total} correctas) en Bible Run! ¿Puedes superarlo?",
    "lb.title": "CLASIFICACIÓN",
    "lb.loading": "Cargando…",
    "lb.empty": "Nadie ha jugado todavía. ¡Sé el primero!",
    "lb.leading": "En primer lugar",
    "lb.back": "Volver",
    "footer.about": "Sobre nosotros",
    "footer.donate": "Enviar un donativo",
    "footer.contact": "Contáctanos",
    "footer.admin": "Admin",
    "about.title": "Sobre Bible Run",
    "about.p1": "Bible Run es un cuestionario de conocimiento bíblico en el que compites contra el reloj y contra otros jugadores de todo el mundo. Cada pregunta se basa en textos bíblicos reales, con su fuente y contexto, para que aprendas algo por el camino - no solo adivines.",
    "about.p2": "Todas las preguntas se revisan y aprueban manualmente antes de publicarse, para mantener una alta calidad en el contenido.",
    "donate.title": "Enviar un donativo",
    "donate.p1": "Bible Run funciona sin ánimo de lucro. Si quieres apoyar su funcionamiento y desarrollo continuo, te lo agradecemos.",
    "donate.placeholder_title": "El pago aún no está conectado.",
    "donate.placeholder_body": "Este recuadro es un marcador de posición - hoy no se puede recibir ningún pago aquí. Escríbenos por \"Contáctanos\" y juntos configuramos un flujo de donación real (por ejemplo, con tarjeta).",
    "contact.title": "Contáctanos",
    "contact.label.name": "Nombre (opcional)",
    "contact.label.email": "Correo electrónico",
    "contact.label.message": "Mensaje",
    "contact.submit": "Enviar mensaje",
    "contact.sending": "Enviando…",
    "contact.sent": "¡Gracias! Tu mensaje se ha guardado y te responderemos pronto.",
    "contact.err_message": "Escribe un mensaje.",
    "contact.err_generic": "No se pudo enviar el mensaje. Inténtalo de nuevo.",
  },
  pt: {
    "auth.title.login": "Bem-vindo de volta",
    "auth.title.signup": "Crie sua conta",
    "auth.subtitle.login": "Faça login para continuar jogando",
    "auth.subtitle.signup": "Cadastre-se para começar a jogar",
    "auth.tab.login": "Entrar",
    "auth.tab.signup": "Nova conta",
    "auth.label.email": "E-mail",
    "auth.placeholder.email": "voce@exemplo.com",
    "auth.label.name": "Seu nome",
    "auth.placeholder.name": "Digite seu nome",
    "auth.label.country": "Escolha o país",
    "auth.label.password": "Senha",
    "auth.forgot": "Esqueceu a senha?",
    "auth.placeholder.password": "Mínimo de 8 caracteres",
    "auth.submit.login": "Entrar",
    "auth.submit.signup": "Criar conta",
    "auth.submit.loading": "Um momento…",
    "auth.or": "ou continue com",
    "auth.security_note": "Sua senha é criptografada (hash) e armazenada com segurança no banco de dados. Nunca vemos sua senha em texto simples.",
    "auth.show_password": "Mostrar senha",
    "auth.hide_password": "Ocultar senha",
    "err.email_invalid": "Digite um endereço de e-mail válido.",
    "err.name_short": "Digite seu nome (mínimo de 2 caracteres).",
    "err.password_short": "A senha deve ter pelo menos 8 caracteres.",
    "err.email_taken": "Já existe uma conta com esse e-mail. Faça login em vez disso.",
    "err.login_failed": "E-mail ou senha incorretos.",
    "err.too_many_attempts": "Muitas tentativas. Aguarde 15 minutos e tente novamente.",
    "err.generic": "Algo deu errado. Tente novamente.",
    "err.oauth_failed": "Falha no login. Tente novamente.",
    "forgot.title": "Redefinir senha",
    "forgot.desc": "Digite seu e-mail e enviaremos um link para definir uma nova senha.",
    "forgot.submit": "Enviar link de redefinição",
    "forgot.sending": "Enviando…",
    "forgot.success": "Se existir uma conta com esse endereço, enviamos um link para ela. Verifique sua caixa de entrada (e spam).",
    "forgot.back": "Voltar ao login",
    "reset.title": "Definir nova senha",
    "reset.desc": "Escolha uma nova senha para sua conta.",
    "reset.label": "Nova senha",
    "reset.submit": "Definir nova senha",
    "reset.saving": "Salvando…",
    "reset.success": "Senha atualizada! Agora você pode entrar com a nova senha.",
    "reset.to_login": "Ir para o login",
    "reset.expired": "O link expirou ou já foi usado. Solicite um novo link de redefinição.",
    "ready.welcome": "Bem-vindo, {name}",
    "ready.title": "Pronto para começar?",
    "ready.questions_count_one": "{count} pergunta",
    "ready.questions_count": "{count} perguntas",
    "ready.seconds_per_q": "30 seg/pergunta",
    "ready.climb": "Suba no ranking",
    "ready.level": "Nível {level}",
    "ready.start": "Começar o jogo",
    "ready.loading": "Carregando perguntas…",
    "ready.no_questions": "Nenhuma pergunta publicada ainda",
    "ready.leaderboard_link": "Classificação",
    "ready.logout": "Sair",
    "ready.err_no_questions": "Nenhuma pergunta está publicada no momento. Tente novamente mais tarde.",
    "ready.err_fetch": "Não foi possível carregar as perguntas. Tente novamente.",
    "quiz.question_of": "PERGUNTA {current} DE {total}",
    "quiz.context_label": "CONTEXTO",
    "quiz.status.correct": "Correto! {explanation}",
    "quiz.status.wrong": "Não é bem isso. A resposta correta é {answer}.",
    "quiz.status.timeout": "O tempo acabou. A resposta correta é {answer}.",
    "quiz.status.prompt": "Escolha uma resposta antes que o tempo acabe.",
    "quiz.source_label": "FONTE",
    "quiz.read_more": "Ler o texto completo",
    "quiz.next_in": "Próxima pergunta em {seconds}s…",
    "quiz.seconds_short": "SEG",
    "result.title": "Muito bem, {name}!",
    "result.score_summary": "{correct} de {total} corretas",
    "result.points_suffix": "pts",
    "result.play_again": "Jogar novamente",
    "result.share": "Compartilhe seu resultado",
    "result.view_leaderboard": "Ver classificação",
    "result.share_copied": "Copiado! Cole onde quiser compartilhar.",
    "result.share_text": "Consegui {score} pontos ({correct}/{total} corretas) no Bible Run! Consegue superar isso?",
    "lb.title": "CLASSIFICAÇÃO",
    "lb.loading": "Carregando…",
    "lb.empty": "Ninguém jogou ainda. Seja o primeiro!",
    "lb.leading": "Na liderança",
    "lb.back": "Voltar",
    "footer.about": "Sobre nós",
    "footer.donate": "Enviar uma doação",
    "footer.contact": "Fale conosco",
    "footer.admin": "Admin",
    "about.title": "Sobre o Bible Run",
    "about.p1": "Bible Run é um quiz de conhecimento bíblico onde você compete contra o relógio e contra outros jogadores do mundo todo. Cada pergunta é baseada em textos bíblicos reais, com referência de fonte e contexto, para que você aprenda algo pelo caminho - não apenas adivinhe.",
    "about.p2": "Todas as perguntas são revisadas e aprovadas manualmente antes de serem publicadas, para manter alta qualidade do conteúdo.",
    "donate.title": "Enviar uma doação",
    "donate.p1": "O Bible Run é mantido sem fins lucrativos. Se quiser apoiar a operação e o desenvolvimento contínuo, ficamos gratos.",
    "donate.placeholder_title": "O pagamento ainda não está conectado.",
    "donate.placeholder_body": "Esta caixa é um espaço reservado - nenhum pagamento pode ser recebido aqui hoje. Entre em contato pelo \"Fale conosco\" e organizamos juntos um fluxo real de doação (por exemplo, cartão).",
    "contact.title": "Fale conosco",
    "contact.label.name": "Nome (opcional)",
    "contact.label.email": "E-mail",
    "contact.label.message": "Mensagem",
    "contact.submit": "Enviar mensagem",
    "contact.sending": "Enviando…",
    "contact.sent": "Obrigado! Sua mensagem foi salva e entraremos em contato em breve.",
    "contact.err_message": "Escreva uma mensagem.",
    "contact.err_generic": "Não foi possível enviar a mensagem. Tente novamente.",
  },
  fr: {
    "auth.title.login": "Content de vous revoir",
    "auth.title.signup": "Créez votre compte",
    "auth.subtitle.login": "Connectez-vous pour continuer à jouer",
    "auth.subtitle.signup": "Inscrivez-vous pour commencer à jouer",
    "auth.tab.login": "Connexion",
    "auth.tab.signup": "Nouveau compte",
    "auth.label.email": "E-mail",
    "auth.placeholder.email": "vous@exemple.com",
    "auth.label.name": "Votre nom",
    "auth.placeholder.name": "Entrez votre nom",
    "auth.label.country": "Choisissez le pays",
    "auth.label.password": "Mot de passe",
    "auth.forgot": "Mot de passe oublié ?",
    "auth.placeholder.password": "Au moins 8 caractères",
    "auth.submit.login": "Se connecter",
    "auth.submit.signup": "Créer le compte",
    "auth.submit.loading": "Un instant…",
    "auth.or": "ou continuer avec",
    "auth.security_note": "Votre mot de passe est haché et stocké en toute sécurité dans la base de données. Nous ne voyons jamais votre mot de passe en clair.",
    "auth.show_password": "Afficher le mot de passe",
    "auth.hide_password": "Masquer le mot de passe",
    "err.email_invalid": "Saisissez une adresse e-mail valide.",
    "err.name_short": "Saisissez votre nom (au moins 2 caractères).",
    "err.password_short": "Le mot de passe doit contenir au moins 8 caractères.",
    "err.email_taken": "Un compte existe déjà avec cette adresse e-mail. Connectez-vous plutôt.",
    "err.login_failed": "E-mail ou mot de passe incorrect.",
    "err.too_many_attempts": "Trop de tentatives. Attendez 15 minutes et réessayez.",
    "err.generic": "Une erreur s'est produite. Veuillez réessayer.",
    "err.oauth_failed": "La connexion a échoué. Veuillez réessayer.",
    "forgot.title": "Réinitialiser le mot de passe",
    "forgot.desc": "Saisissez votre adresse e-mail et nous vous enverrons un lien pour définir un nouveau mot de passe.",
    "forgot.submit": "Envoyer le lien de réinitialisation",
    "forgot.sending": "Envoi…",
    "forgot.success": "Si un compte existe avec cette adresse, nous y avons envoyé un lien. Vérifiez votre boîte de réception (et vos spams).",
    "forgot.back": "Retour à la connexion",
    "reset.title": "Définir un nouveau mot de passe",
    "reset.desc": "Choisissez un nouveau mot de passe pour votre compte.",
    "reset.label": "Nouveau mot de passe",
    "reset.submit": "Définir le nouveau mot de passe",
    "reset.saving": "Enregistrement…",
    "reset.success": "Mot de passe mis à jour ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    "reset.to_login": "Aller à la connexion",
    "reset.expired": "Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien de réinitialisation.",
    "ready.welcome": "Bienvenue, {name}",
    "ready.title": "Prêt à vous lancer ?",
    "ready.questions_count_one": "{count} question",
    "ready.questions_count": "{count} questions",
    "ready.seconds_per_q": "30 sec/question",
    "ready.climb": "Grimpez au classement",
    "ready.level": "Niveau {level}",
    "ready.start": "Démarrer la partie",
    "ready.loading": "Chargement des questions…",
    "ready.no_questions": "Aucune question publiée pour le moment",
    "ready.leaderboard_link": "Classement",
    "ready.logout": "Se déconnecter",
    "ready.err_no_questions": "Aucune question n'est publiée pour le moment. Réessayez plus tard.",
    "ready.err_fetch": "Impossible de charger les questions. Veuillez réessayer.",
    "quiz.question_of": "QUESTION {current} SUR {total}",
    "quiz.context_label": "CONTEXTE",
    "quiz.status.correct": "Correct ! {explanation}",
    "quiz.status.wrong": "Pas tout à fait. La bonne réponse est {answer}.",
    "quiz.status.timeout": "Temps écoulé. La bonne réponse est {answer}.",
    "quiz.status.prompt": "Choisissez une réponse avant la fin du temps imparti.",
    "quiz.source_label": "SOURCE",
    "quiz.read_more": "Lire le texte complet",
    "quiz.next_in": "Question suivante dans {seconds}s…",
    "quiz.seconds_short": "SEC",
    "result.title": "Bien joué, {name} !",
    "result.score_summary": "{correct} sur {total} correctes",
    "result.points_suffix": "pts",
    "result.play_again": "Rejouer",
    "result.share": "Partagez votre résultat",
    "result.view_leaderboard": "Voir le classement",
    "result.share_copied": "Copié ! Collez-le où vous voulez le partager.",
    "result.share_text": "J'ai obtenu {score} points ({correct}/{total} correctes) à Bible Run ! Peux-tu faire mieux ?",
    "lb.title": "CLASSEMENT",
    "lb.loading": "Chargement…",
    "lb.empty": "Personne n'a encore joué. Soyez le premier !",
    "lb.leading": "En tête",
    "lb.back": "Retour",
    "footer.about": "À propos",
    "footer.donate": "Faire un don",
    "footer.contact": "Nous contacter",
    "footer.admin": "Admin",
    "about.title": "À propos de Bible Run",
    "about.p1": "Bible Run est un quiz de connaissances bibliques où vous jouez contre la montre et contre d'autres joueurs du monde entier. Chaque question s'appuie sur de vrais textes bibliques, avec source et contexte, pour que vous appreniez quelque chose en chemin - pas seulement deviner.",
    "about.p2": "Toutes les questions sont examinées et approuvées manuellement avant publication, afin de garantir une haute qualité de contenu.",
    "donate.title": "Faire un don",
    "donate.p1": "Bible Run est géré à but non lucratif. Si vous souhaitez soutenir son fonctionnement et son développement continu, nous vous en serions reconnaissants.",
    "donate.placeholder_title": "Le paiement n'est pas encore connecté.",
    "donate.placeholder_body": "Cet encadré est un espace réservé - aucun paiement ne peut être reçu ici aujourd'hui. Contactez-nous via \"Nous contacter\" et nous mettrons en place ensemble un vrai circuit de don (carte, par exemple).",
    "contact.title": "Nous contacter",
    "contact.label.name": "Nom (facultatif)",
    "contact.label.email": "E-mail",
    "contact.label.message": "Message",
    "contact.submit": "Envoyer le message",
    "contact.sending": "Envoi…",
    "contact.sent": "Merci ! Votre message a été enregistré et nous vous répondrons bientôt.",
    "contact.err_message": "Écrivez un message.",
    "contact.err_generic": "Impossible d'envoyer le message. Veuillez réessayer.",
  },
  de: {
    "auth.title.login": "Willkommen zurück",
    "auth.title.signup": "Konto erstellen",
    "auth.subtitle.login": "Melde dich an, um weiterzuspielen",
    "auth.subtitle.signup": "Registriere dich, um zu spielen",
    "auth.tab.login": "Anmelden",
    "auth.tab.signup": "Neues Konto",
    "auth.label.email": "E-Mail",
    "auth.placeholder.email": "du@beispiel.de",
    "auth.label.name": "Dein Name",
    "auth.placeholder.name": "Gib deinen Namen ein",
    "auth.label.country": "Land wählen",
    "auth.label.password": "Passwort",
    "auth.forgot": "Passwort vergessen?",
    "auth.placeholder.password": "Mindestens 8 Zeichen",
    "auth.submit.login": "Anmelden",
    "auth.submit.signup": "Konto erstellen",
    "auth.submit.loading": "Einen Moment…",
    "auth.or": "oder weiter mit",
    "auth.security_note": "Dein Passwort wird gehasht und sicher in der Datenbank gespeichert. Wir sehen dein Passwort nie im Klartext.",
    "auth.show_password": "Passwort anzeigen",
    "auth.hide_password": "Passwort verbergen",
    "err.email_invalid": "Gib eine gültige E-Mail-Adresse ein.",
    "err.name_short": "Gib deinen Namen ein (mindestens 2 Zeichen).",
    "err.password_short": "Das Passwort muss mindestens 8 Zeichen lang sein.",
    "err.email_taken": "Es gibt bereits ein Konto mit dieser E-Mail-Adresse. Melde dich stattdessen an.",
    "err.login_failed": "Falsche E-Mail oder falsches Passwort.",
    "err.too_many_attempts": "Zu viele Versuche. Warte 15 Minuten und versuche es erneut.",
    "err.generic": "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    "err.oauth_failed": "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
    "forgot.title": "Passwort zurücksetzen",
    "forgot.desc": "Gib deine E-Mail-Adresse ein, und wir senden dir einen Link zum Festlegen eines neuen Passworts.",
    "forgot.submit": "Link zum Zurücksetzen senden",
    "forgot.sending": "Wird gesendet…",
    "forgot.success": "Falls ein Konto mit dieser Adresse existiert, haben wir einen Link dorthin gesendet. Prüfe deinen Posteingang (und Spam-Ordner).",
    "forgot.back": "Zurück zur Anmeldung",
    "reset.title": "Neues Passwort festlegen",
    "reset.desc": "Wähle ein neues Passwort für dein Konto.",
    "reset.label": "Neues Passwort",
    "reset.submit": "Neues Passwort festlegen",
    "reset.saving": "Wird gespeichert…",
    "reset.success": "Passwort aktualisiert! Du kannst dich jetzt mit deinem neuen Passwort anmelden.",
    "reset.to_login": "Zur Anmeldung",
    "reset.expired": "Der Link ist abgelaufen oder wurde bereits verwendet. Fordere einen neuen Link an.",
    "ready.welcome": "Willkommen, {name}",
    "ready.title": "Bereit loszulegen?",
    "ready.questions_count_one": "{count} Frage",
    "ready.questions_count": "{count} Fragen",
    "ready.seconds_per_q": "30 Sek./Frage",
    "ready.climb": "Im Ranking aufsteigen",
    "ready.level": "Level {level}",
    "ready.start": "Spiel starten",
    "ready.loading": "Fragen werden geladen…",
    "ready.no_questions": "Noch keine Fragen veröffentlicht",
    "ready.leaderboard_link": "Bestenliste",
    "ready.logout": "Abmelden",
    "ready.err_no_questions": "Im Moment sind keine Fragen veröffentlicht. Versuche es später erneut.",
    "ready.err_fetch": "Fragen konnten nicht geladen werden. Bitte versuche es erneut.",
    "quiz.question_of": "FRAGE {current} VON {total}",
    "quiz.context_label": "KONTEXT",
    "quiz.status.correct": "Richtig! {explanation}",
    "quiz.status.wrong": "Nicht ganz. Die richtige Antwort ist {answer}.",
    "quiz.status.timeout": "Die Zeit ist um. Die richtige Antwort ist {answer}.",
    "quiz.status.prompt": "Wähle eine Antwort, bevor die Zeit abläuft.",
    "quiz.source_label": "QUELLE",
    "quiz.read_more": "Ganzen Text lesen",
    "quiz.next_in": "Nächste Frage in {seconds}s…",
    "quiz.seconds_short": "SEK",
    "result.title": "Gut gespielt, {name}!",
    "result.score_summary": "{correct} von {total} richtig",
    "result.points_suffix": "Pkt.",
    "result.play_again": "Nochmal spielen",
    "result.share": "Ergebnis teilen",
    "result.view_leaderboard": "Bestenliste ansehen",
    "result.share_copied": "Kopiert! Füge es dort ein, wo du es teilen möchtest.",
    "result.share_text": "Ich habe {score} Punkte ({correct}/{total} richtig) bei Bible Run erzielt! Schaffst du mehr?",
    "lb.title": "BESTENLISTE",
    "lb.loading": "Wird geladen…",
    "lb.empty": "Noch niemand hat gespielt. Sei die/der Erste!",
    "lb.leading": "In Führung",
    "lb.back": "Zurück",
    "footer.about": "Über uns",
    "footer.donate": "Spende senden",
    "footer.contact": "Kontakt",
    "footer.admin": "Admin",
    "about.title": "Über Bible Run",
    "about.p1": "Bible Run ist ein Bibelwissen-Quiz, bei dem du gegen die Uhr und gegen andere Spieler aus der ganzen Welt antrittst. Jede Frage basiert auf echten Bibeltexten mit Quellenangabe und Kontext, damit du dabei etwas lernst - nicht nur rätst.",
    "about.p2": "Alle Fragen werden manuell geprüft und freigegeben, bevor sie veröffentlicht werden, um eine hohe Inhaltsqualität zu gewährleisten.",
    "donate.title": "Spende senden",
    "donate.p1": "Bible Run wird gemeinnützig betrieben. Wenn du den Betrieb und die Weiterentwicklung unterstützen möchtest, sind wir dankbar.",
    "donate.placeholder_title": "Die Bezahlung ist noch nicht angebunden.",
    "donate.placeholder_body": "Dieses Feld ist ein Platzhalter - heute kann hier keine Zahlung entgegengenommen werden. Melde dich über \"Kontakt\", dann richten wir gemeinsam einen echten Spendenweg ein (z. B. Karte).",
    "contact.title": "Kontakt",
    "contact.label.name": "Name (optional)",
    "contact.label.email": "E-Mail",
    "contact.label.message": "Nachricht",
    "contact.submit": "Nachricht senden",
    "contact.sending": "Wird gesendet…",
    "contact.sent": "Danke! Deine Nachricht wurde gespeichert, wir melden uns bei dir.",
    "contact.err_message": "Schreibe eine Nachricht.",
    "contact.err_generic": "Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.",
  },
  tl: {
    "auth.title.login": "Maligayang pagbabalik",
    "auth.title.signup": "Gumawa ng iyong account",
    "auth.subtitle.login": "Mag-log in para magpatuloy sa paglalaro",
    "auth.subtitle.signup": "Mag-sign up para magsimulang maglaro",
    "auth.tab.login": "Mag-log in",
    "auth.tab.signup": "Bagong account",
    "auth.label.email": "Email",
    "auth.placeholder.email": "ikaw@halimbawa.com",
    "auth.label.name": "Iyong pangalan",
    "auth.placeholder.name": "Isulat ang iyong pangalan",
    "auth.label.country": "Piliin ang bansa",
    "auth.label.password": "Password",
    "auth.forgot": "Nakalimutan ang password?",
    "auth.placeholder.password": "Hindi bababa sa 8 karakter",
    "auth.submit.login": "Mag-log in",
    "auth.submit.signup": "Gumawa ng account",
    "auth.submit.loading": "Sandali lang…",
    "auth.or": "o magpatuloy gamit ang",
    "auth.security_note": "Ang iyong password ay hina-hash at ligtas na nakaimbak sa database. Hindi namin makikita ang iyong password sa plain text.",
    "auth.show_password": "Ipakita ang password",
    "auth.hide_password": "Itago ang password",
    "err.email_invalid": "Maglagay ng wastong email address.",
    "err.name_short": "Isulat ang iyong pangalan (hindi bababa sa 2 karakter).",
    "err.password_short": "Ang password ay dapat hindi bababa sa 8 karakter.",
    "err.email_taken": "May account na sa email address na iyon. Mag-log in na lamang.",
    "err.login_failed": "Maling email o password.",
    "err.too_many_attempts": "Sobrang dami ng pagsubok. Maghintay ng 15 minuto at subukan muli.",
    "err.generic": "May nagkamali. Subukan muli.",
    "err.oauth_failed": "Nabigo ang pag-log in. Subukan muli.",
    "forgot.title": "I-reset ang password",
    "forgot.desc": "Isulat ang iyong email address at magpapadala kami ng link para magtakda ng bagong password.",
    "forgot.submit": "Magpadala ng reset link",
    "forgot.sending": "Ipinapadala…",
    "forgot.success": "Kung may account sa email address na iyon, nagpadala kami ng link doon. Tingnan ang iyong inbox (at spam).",
    "forgot.back": "Bumalik sa pag-log in",
    "reset.title": "Magtakda ng bagong password",
    "reset.desc": "Pumili ng bagong password para sa iyong account.",
    "reset.label": "Bagong password",
    "reset.submit": "Magtakda ng bagong password",
    "reset.saving": "Sine-save…",
    "reset.success": "Na-update na ang password! Maaari ka nang mag-log in gamit ang bagong password.",
    "reset.to_login": "Pumunta sa pag-log in",
    "reset.expired": "Nag-expire na ang link o nagamit na ito. Humiling ng bagong reset link.",
    "ready.welcome": "Maligayang pagdating, {name}",
    "ready.title": "Handa ka na bang sumabak?",
    "ready.questions_count": "{count} tanong",
    "ready.seconds_per_q": "30 seg/tanong",
    "ready.climb": "Umakyat sa ranggo",
    "ready.level": "Antas {level}",
    "ready.start": "Simulan ang laro",
    "ready.loading": "Nilo-load ang mga tanong…",
    "ready.no_questions": "Wala pang na-publish na tanong",
    "ready.leaderboard_link": "Leaderboard",
    "ready.logout": "Mag-log out",
    "ready.err_no_questions": "Walang na-publish na tanong sa ngayon. Subukan muli mamaya.",
    "ready.err_fetch": "Hindi nakuha ang mga tanong. Subukan muli.",
    "quiz.question_of": "TANONG {current} SA {total}",
    "quiz.context_label": "KONTEKSTO",
    "quiz.status.correct": "Tama! {explanation}",
    "quiz.status.wrong": "Hindi tama. Ang tamang sagot ay {answer}.",
    "quiz.status.timeout": "Naubos na ang oras. Ang tamang sagot ay {answer}.",
    "quiz.status.prompt": "Pumili ng sagot bago maubos ang oras.",
    "quiz.source_label": "PINAGMULAN",
    "quiz.read_more": "Basahin ang buong teksto",
    "quiz.next_in": "Susunod na tanong sa {seconds}s…",
    "quiz.seconds_short": "SEG",
    "result.title": "Magaling, {name}!",
    "result.score_summary": "{correct} sa {total} ang tama",
    "result.points_suffix": "puntos",
    "result.play_again": "Maglaro muli",
    "result.share": "Ibahagi ang iyong resulta",
    "result.view_leaderboard": "Tingnan ang leaderboard",
    "result.share_copied": "Nakopya! I-paste kung saan mo gustong ibahagi ito.",
    "result.share_text": "Nakakuha ako ng {score} puntos ({correct}/{total} tama) sa Bible Run! Kaya mo bang talunin ito?",
    "lb.title": "LEADERBOARD",
    "lb.loading": "Kinukuha…",
    "lb.empty": "Wala pang naglaro. Maging una!",
    "lb.leading": "Nangunguna",
    "lb.back": "Bumalik",
    "footer.about": "Tungkol sa amin",
    "footer.donate": "Magpadala ng regalo",
    "footer.contact": "Makipag-ugnayan sa amin",
    "footer.admin": "Admin",
    "about.title": "Tungkol sa Bible Run",
    "about.p1": "Ang Bible Run ay isang Bible knowledge quiz kung saan nakikipagkumpitensya ka sa orasan at sa ibang manlalaro mula sa buong mundo. Bawat tanong ay batay sa totoong teksto ng Bibliya, may sanggunian at konteksto para may matutunan ka sa daan - hindi lang basta manghula.",
    "about.p2": "Lahat ng tanong ay sinusuri at inaprubahan nang manwal bago mai-publish, para mapanatili ang mataas na kalidad ng nilalaman.",
    "donate.title": "Magpadala ng regalo",
    "donate.p1": "Ang Bible Run ay pinapatakbo bilang non-profit. Kung gusto mong suportahan ang operasyon at patuloy na pag-unlad nito, lubos kaming nagpapasalamat.",
    "donate.placeholder_title": "Hindi pa nakakonekta ang pagbabayad.",
    "donate.placeholder_body": "Ang kahong ito ay isang placeholder lamang - walang pagbabayad na matatanggap dito sa ngayon. Makipag-ugnayan sa pamamagitan ng \"Makipag-ugnayan sa amin\" at aayusin natin ang totoong daloy ng donasyon (hal. card) nang magkasama.",
    "contact.title": "Makipag-ugnayan sa amin",
    "contact.label.name": "Pangalan (opsyonal)",
    "contact.label.email": "Email",
    "contact.label.message": "Mensahe",
    "contact.submit": "Ipadala ang mensahe",
    "contact.sending": "Ipinapadala…",
    "contact.sent": "Salamat! Na-save ang iyong mensahe at babalikan ka namin.",
    "contact.err_message": "Sumulat ng mensahe.",
    "contact.err_generic": "Hindi naipadala ang mensahe. Subukan muli.",
  },
  ko: {
    "auth.title.login": "다시 오신 것을 환영합니다",
    "auth.title.signup": "계정 만들기",
    "auth.subtitle.login": "로그인하여 계속 플레이하세요",
    "auth.subtitle.signup": "가입하여 플레이를 시작하세요",
    "auth.tab.login": "로그인",
    "auth.tab.signup": "새 계정",
    "auth.label.email": "이메일",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "이름",
    "auth.placeholder.name": "이름을 입력하세요",
    "auth.label.country": "국가 선택",
    "auth.label.password": "비밀번호",
    "auth.forgot": "비밀번호를 잊으셨나요?",
    "auth.placeholder.password": "8자 이상",
    "auth.submit.login": "로그인",
    "auth.submit.signup": "계정 만들기",
    "auth.submit.loading": "잠시만요…",
    "auth.or": "또는 다음으로 계속",
    "auth.security_note": "비밀번호는 해시 처리되어 데이터베이스에 안전하게 저장됩니다. 저희는 평문 비밀번호를 절대 볼 수 없습니다.",
    "auth.show_password": "비밀번호 표시",
    "auth.hide_password": "비밀번호 숨기기",
    "err.email_invalid": "유효한 이메일 주소를 입력하세요.",
    "err.name_short": "이름을 입력하세요 (최소 2자).",
    "err.password_short": "비밀번호는 8자 이상이어야 합니다.",
    "err.email_taken": "이미 해당 이메일로 등록된 계정이 있습니다. 대신 로그인해 주세요.",
    "err.login_failed": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "err.too_many_attempts": "시도 횟수가 너무 많습니다. 15분 후 다시 시도해 주세요.",
    "err.generic": "문제가 발생했습니다. 다시 시도해 주세요.",
    "err.oauth_failed": "로그인에 실패했습니다. 다시 시도해 주세요.",
    "forgot.title": "비밀번호 재설정",
    "forgot.desc": "이메일 주소를 입력하시면 새 비밀번호를 설정할 수 있는 링크를 보내드립니다.",
    "forgot.submit": "재설정 링크 보내기",
    "forgot.sending": "전송 중…",
    "forgot.success": "해당 주소로 등록된 계정이 있다면 링크를 보내드렸습니다. 받은편지함(및 스팸함)을 확인하세요.",
    "forgot.back": "로그인으로 돌아가기",
    "reset.title": "새 비밀번호 설정",
    "reset.desc": "계정에 사용할 새 비밀번호를 선택하세요.",
    "reset.label": "새 비밀번호",
    "reset.submit": "새 비밀번호 설정",
    "reset.saving": "저장 중…",
    "reset.success": "비밀번호가 변경되었습니다! 이제 새 비밀번호로 로그인할 수 있습니다.",
    "reset.to_login": "로그인으로 이동",
    "reset.expired": "링크가 만료되었거나 이미 사용되었습니다. 재설정 링크를 다시 요청하세요.",
    "ready.welcome": "환영합니다, {name}",
    "ready.title": "떠날 준비가 되셨나요?",
    "ready.questions_count": "{count}개의 질문",
    "ready.seconds_per_q": "30초/질문",
    "ready.climb": "순위 올리기",
    "ready.level": "레벨 {level}",
    "ready.start": "게임 시작",
    "ready.loading": "질문 불러오는 중…",
    "ready.no_questions": "아직 게시된 질문이 없습니다",
    "ready.leaderboard_link": "리더보드",
    "ready.logout": "로그아웃",
    "ready.err_no_questions": "현재 게시된 질문이 없습니다. 나중에 다시 시도해 주세요.",
    "ready.err_fetch": "질문을 불러오지 못했습니다. 다시 시도해 주세요.",
    "quiz.question_of": "질문 {current} / {total}",
    "quiz.context_label": "맥락",
    "quiz.status.correct": "정답입니다! {explanation}",
    "quiz.status.wrong": "아쉽네요. 정답은 {answer}입니다.",
    "quiz.status.timeout": "시간이 종료되었습니다. 정답은 {answer}입니다.",
    "quiz.status.prompt": "시간이 끝나기 전에 답을 선택하세요.",
    "quiz.source_label": "출처",
    "quiz.read_more": "전체 본문 읽기",
    "quiz.next_in": "{seconds}초 후 다음 질문…",
    "quiz.seconds_short": "초",
    "result.title": "잘하셨어요, {name}님!",
    "result.score_summary": "{total}개 중 {correct}개 정답",
    "result.points_suffix": "점",
    "result.play_again": "다시 플레이",
    "result.share": "결과 공유하기",
    "result.view_leaderboard": "리더보드 보기",
    "result.share_copied": "복사되었습니다! 공유하려는 곳에 붙여넣으세요.",
    "result.share_text": "Bible Run에서 {score}점 ({correct}/{total} 정답)을 획득했어요! 저를 이길 수 있나요?",
    "lb.title": "리더보드",
    "lb.loading": "불러오는 중…",
    "lb.empty": "아직 아무도 플레이하지 않았습니다. 첫 번째가 되어보세요!",
    "lb.leading": "선두",
    "lb.back": "뒤로",
    "footer.about": "소개",
    "footer.donate": "후원하기",
    "footer.contact": "문의하기",
    "footer.admin": "관리자",
    "about.title": "Bible Run 소개",
    "about.p1": "Bible Run은 시간과 전 세계 다른 플레이어들과 경쟁하는 성경 지식 퀴즈입니다. 모든 질문은 실제 성경 본문을 바탕으로 하며, 출처와 맥락이 함께 제공되어 그냥 추측하는 것이 아니라 배우면서 진행할 수 있습니다.",
    "about.p2": "모든 질문은 게시되기 전에 수동으로 검토 및 승인되어 콘텐츠 품질을 높게 유지합니다.",
    "donate.title": "후원하기",
    "donate.p1": "Bible Run은 비영리로 운영됩니다. 운영과 지속적인 개발을 지원하고 싶으시다면 감사하겠습니다.",
    "donate.placeholder_title": "아직 결제 시스템이 연결되지 않았습니다.",
    "donate.placeholder_body": "이 상자는 자리 표시자입니다 - 오늘은 여기서 결제를 받을 수 없습니다. \"문의하기\"를 통해 연락 주시면 실제 후원 방법(예: 카드)을 함께 마련하겠습니다.",
    "contact.title": "문의하기",
    "contact.label.name": "이름 (선택 사항)",
    "contact.label.email": "이메일",
    "contact.label.message": "메시지",
    "contact.submit": "메시지 보내기",
    "contact.sending": "전송 중…",
    "contact.sent": "감사합니다! 메시지가 저장되었으며 곧 답변드리겠습니다.",
    "contact.err_message": "메시지를 입력하세요.",
    "contact.err_generic": "메시지를 보내지 못했습니다. 다시 시도해 주세요.",
  },
  th: {
    "auth.title.login": "ยินดีต้อนรับกลับมา",
    "auth.title.signup": "สร้างบัญชีของคุณ",
    "auth.subtitle.login": "เข้าสู่ระบบเพื่อเล่นต่อ",
    "auth.subtitle.signup": "สมัครสมาชิกเพื่อเริ่มเล่น",
    "auth.tab.login": "เข้าสู่ระบบ",
    "auth.tab.signup": "บัญชีใหม่",
    "auth.label.email": "อีเมล",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "ชื่อของคุณ",
    "auth.placeholder.name": "กรอกชื่อของคุณ",
    "auth.label.country": "เลือกประเทศ",
    "auth.label.password": "รหัสผ่าน",
    "auth.forgot": "ลืมรหัสผ่าน?",
    "auth.placeholder.password": "อย่างน้อย 8 ตัวอักษร",
    "auth.submit.login": "เข้าสู่ระบบ",
    "auth.submit.signup": "สร้างบัญชี",
    "auth.submit.loading": "สักครู่…",
    "auth.or": "หรือดำเนินการต่อด้วย",
    "auth.security_note": "รหัสผ่านของคุณถูกเข้ารหัส (hash) และจัดเก็บอย่างปลอดภัยในฐานข้อมูล เราจะไม่มีวันเห็นรหัสผ่านของคุณในรูปแบบข้อความธรรมดา",
    "auth.show_password": "แสดงรหัสผ่าน",
    "auth.hide_password": "ซ่อนรหัสผ่าน",
    "err.email_invalid": "กรอกอีเมลที่ถูกต้อง",
    "err.name_short": "กรอกชื่อของคุณ (อย่างน้อย 2 ตัวอักษร)",
    "err.password_short": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    "err.email_taken": "มีบัญชีที่ใช้อีเมลนี้อยู่แล้ว โปรดเข้าสู่ระบบแทน",
    "err.login_failed": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "err.too_many_attempts": "พยายามมากเกินไป โปรดรอ 15 นาทีแล้วลองอีกครั้ง",
    "err.generic": "เกิดข้อผิดพลาด โปรดลองอีกครั้ง",
    "err.oauth_failed": "เข้าสู่ระบบไม่สำเร็จ โปรดลองอีกครั้ง",
    "forgot.title": "รีเซ็ตรหัสผ่าน",
    "forgot.desc": "กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้",
    "forgot.submit": "ส่งลิงก์รีเซ็ต",
    "forgot.sending": "กำลังส่ง…",
    "forgot.success": "หากมีบัญชีที่ใช้อีเมลนั้น เราได้ส่งลิงก์ไปแล้ว โปรดตรวจสอบกล่องจดหมาย (และสแปม)",
    "forgot.back": "กลับไปเข้าสู่ระบบ",
    "reset.title": "ตั้งรหัสผ่านใหม่",
    "reset.desc": "เลือกรหัสผ่านใหม่สำหรับบัญชีของคุณ",
    "reset.label": "รหัสผ่านใหม่",
    "reset.submit": "ตั้งรหัสผ่านใหม่",
    "reset.saving": "กำลังบันทึก…",
    "reset.success": "อัปเดตรหัสผ่านแล้ว! ตอนนี้คุณเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว",
    "reset.to_login": "ไปที่หน้าเข้าสู่ระบบ",
    "reset.expired": "ลิงก์หมดอายุหรือถูกใช้ไปแล้ว โปรดขอลิงก์รีเซ็ตใหม่",
    "ready.welcome": "ยินดีต้อนรับ, {name}",
    "ready.title": "พร้อมออกเดินทางหรือยัง?",
    "ready.questions_count": "{count} คำถาม",
    "ready.seconds_per_q": "30 วิ/คำถาม",
    "ready.climb": "ไต่อันดับ",
    "ready.level": "เลเวล {level}",
    "ready.start": "เริ่มเกม",
    "ready.loading": "กำลังโหลดคำถาม…",
    "ready.no_questions": "ยังไม่มีคำถามที่เผยแพร่",
    "ready.leaderboard_link": "อันดับ",
    "ready.logout": "ออกจากระบบ",
    "ready.err_no_questions": "ขณะนี้ยังไม่มีคำถามที่เผยแพร่ โปรดลองอีกครั้งภายหลัง",
    "ready.err_fetch": "ไม่สามารถโหลดคำถามได้ โปรดลองอีกครั้ง",
    "quiz.question_of": "คำถามที่ {current} จาก {total}",
    "quiz.context_label": "บริบท",
    "quiz.status.correct": "ถูกต้อง! {explanation}",
    "quiz.status.wrong": "ยังไม่ถูกนะ คำตอบที่ถูกต้องคือ {answer}",
    "quiz.status.timeout": "หมดเวลาแล้ว คำตอบที่ถูกต้องคือ {answer}",
    "quiz.status.prompt": "เลือกคำตอบก่อนหมดเวลา",
    "quiz.source_label": "แหล่งที่มา",
    "quiz.read_more": "อ่านข้อความเต็ม",
    "quiz.next_in": "คำถามถัดไปใน {seconds} วินาที…",
    "quiz.seconds_short": "วิ",
    "result.title": "สู้ได้ดีมาก {name}!",
    "result.score_summary": "ถูก {correct} จาก {total} ข้อ",
    "result.points_suffix": "คะแนน",
    "result.play_again": "เล่นอีกครั้ง",
    "result.share": "แชร์ผลของคุณ",
    "result.view_leaderboard": "ดูตารางอันดับ",
    "result.share_copied": "คัดลอกแล้ว! วางไว้ที่ที่คุณต้องการแชร์",
    "result.share_text": "ฉันได้ {score} คะแนน ({correct}/{total} ข้อถูก) ใน Bible Run! คุณจะทำได้ดีกว่านี้ไหม?",
    "lb.title": "ตารางอันดับ",
    "lb.loading": "กำลังโหลด…",
    "lb.empty": "ยังไม่มีใครเล่นเลย เป็นคนแรกสิ!",
    "lb.leading": "นำอยู่",
    "lb.back": "ย้อนกลับ",
    "footer.about": "เกี่ยวกับเรา",
    "footer.donate": "ส่งของขวัญ",
    "footer.contact": "ติดต่อเรา",
    "footer.admin": "ผู้ดูแลระบบ",
    "about.title": "เกี่ยวกับ Bible Run",
    "about.p1": "Bible Run คือเกมทายคำถามความรู้พระคัมภีร์ที่คุณแข่งกับเวลาและผู้เล่นคนอื่นๆ จากทั่วโลก ทุกคำถามอ้างอิงจากข้อความในพระคัมภีร์จริง พร้อมแหล่งที่มาและบริบท เพื่อให้คุณได้เรียนรู้ระหว่างทาง ไม่ใช่แค่เดา",
    "about.p2": "ทุกคำถามได้รับการตรวจสอบและอนุมัติด้วยตนเองก่อนเผยแพร่ เพื่อรักษาคุณภาพเนื้อหาให้อยู่ในระดับสูง",
    "donate.title": "ส่งของขวัญ",
    "donate.p1": "Bible Run ดำเนินการแบบไม่แสวงหากำไร หากคุณต้องการสนับสนุนการดำเนินงานและการพัฒนาต่อไป เราขอขอบคุณเป็นอย่างยิ่ง",
    "donate.placeholder_title": "ยังไม่ได้เชื่อมต่อระบบชำระเงิน",
    "donate.placeholder_body": "กล่องนี้เป็นเพียงตัวยึดตำแหน่ง - วันนี้ยังไม่สามารถรับการชำระเงินที่นี่ได้ ติดต่อเราผ่าน \"ติดต่อเรา\" แล้วเราจะจัดระบบบริจาคจริง (เช่น บัตร) ร่วมกัน",
    "contact.title": "ติดต่อเรา",
    "contact.label.name": "ชื่อ (ไม่บังคับ)",
    "contact.label.email": "อีเมล",
    "contact.label.message": "ข้อความ",
    "contact.submit": "ส่งข้อความ",
    "contact.sending": "กำลังส่ง…",
    "contact.sent": "ขอบคุณ! ข้อความของคุณถูกบันทึกแล้ว เราจะติดต่อกลับไป",
    "contact.err_message": "กรุณาเขียนข้อความ",
    "contact.err_generic": "ไม่สามารถส่งข้อความได้ โปรดลองอีกครั้ง",
  },
  it: {
    "auth.title.login": "Bentornato",
    "auth.title.signup": "Crea il tuo account",
    "auth.subtitle.login": "Accedi per continuare a giocare",
    "auth.subtitle.signup": "Registrati per iniziare a giocare",
    "auth.tab.login": "Accedi",
    "auth.tab.signup": "Nuovo account",
    "auth.label.email": "Email",
    "auth.placeholder.email": "tu@esempio.com",
    "auth.label.name": "Il tuo nome",
    "auth.placeholder.name": "Inserisci il tuo nome",
    "auth.label.country": "Scegli il paese",
    "auth.label.password": "Password",
    "auth.forgot": "Password dimenticata?",
    "auth.placeholder.password": "Almeno 8 caratteri",
    "auth.submit.login": "Accedi",
    "auth.submit.signup": "Crea account",
    "auth.submit.loading": "Un momento…",
    "auth.or": "oppure continua con",
    "auth.security_note": "La tua password viene sottoposta a hash e archiviata in modo sicuro nel database. Non vediamo mai la tua password in chiaro.",
    "auth.show_password": "Mostra password",
    "auth.hide_password": "Nascondi password",
    "err.email_invalid": "Inserisci un indirizzo email valido.",
    "err.name_short": "Inserisci il tuo nome (almeno 2 caratteri).",
    "err.password_short": "La password deve avere almeno 8 caratteri.",
    "err.email_taken": "Esiste già un account con questa email. Accedi invece.",
    "err.login_failed": "Email o password errati.",
    "err.too_many_attempts": "Troppi tentativi. Attendi 15 minuti e riprova.",
    "err.generic": "Qualcosa è andato storto. Riprova.",
    "err.oauth_failed": "Accesso non riuscito. Riprova.",
    "forgot.title": "Reimposta password",
    "forgot.desc": "Inserisci la tua email e ti invieremo un link per impostare una nuova password.",
    "forgot.submit": "Invia link di reimpostazione",
    "forgot.sending": "Invio in corso…",
    "forgot.success": "Se esiste un account con questo indirizzo, ti abbiamo inviato un link. Controlla la posta in arrivo (e lo spam).",
    "forgot.back": "Torna al login",
    "reset.title": "Imposta nuova password",
    "reset.desc": "Scegli una nuova password per il tuo account.",
    "reset.label": "Nuova password",
    "reset.submit": "Imposta nuova password",
    "reset.saving": "Salvataggio…",
    "reset.success": "Password aggiornata! Ora puoi accedere con la nuova password.",
    "reset.to_login": "Vai al login",
    "reset.expired": "Questo link è scaduto o è già stato usato. Richiedi un nuovo link.",
    "ready.welcome": "Benvenuto, {name}",
    "ready.title": "Pronto a partire?",
    "ready.questions_count_one": "{count} domanda",
    "ready.questions_count": "{count} domande",
    "ready.seconds_per_q": "30 sec/domanda",
    "ready.climb": "Scala la classifica",
    "ready.level": "Livello {level}",
    "ready.start": "Inizia il gioco",
    "ready.loading": "Caricamento domande…",
    "ready.no_questions": "Nessuna domanda pubblicata ancora",
    "ready.leaderboard_link": "Classifica",
    "ready.logout": "Esci",
    "ready.err_no_questions": "Al momento non ci sono domande pubblicate. Riprova più tardi.",
    "ready.err_fetch": "Impossibile caricare le domande. Riprova.",
    "quiz.question_of": "DOMANDA {current} DI {total}",
    "quiz.context_label": "CONTESTO",
    "quiz.status.correct": "Corretto! {explanation}",
    "quiz.status.wrong": "Non proprio. La risposta corretta è {answer}.",
    "quiz.status.timeout": "Tempo scaduto. La risposta corretta è {answer}.",
    "quiz.status.prompt": "Scegli una risposta prima che scada il tempo.",
    "quiz.source_label": "FONTE",
    "quiz.read_more": "Leggi il testo completo",
    "quiz.next_in": "Prossima domanda tra {seconds}s…",
    "quiz.seconds_short": "SEC",
    "result.title": "Ben giocato, {name}!",
    "result.score_summary": "{correct} su {total} corrette",
    "result.points_suffix": "pt",
    "result.play_again": "Gioca ancora",
    "result.share": "Condividi il tuo risultato",
    "result.view_leaderboard": "Vedi la classifica",
    "result.share_copied": "Copiato! Incollalo dove vuoi condividerlo.",
    "result.share_text": "Ho totalizzato {score} punti ({correct}/{total} corrette) in Bible Run! Riesci a battermi?",
    "lb.title": "CLASSIFICA",
    "lb.loading": "Caricamento…",
    "lb.empty": "Nessuno ha ancora giocato. Sii il primo!",
    "lb.leading": "In testa",
    "lb.back": "Indietro",
    "footer.about": "Chi siamo",
    "footer.donate": "Fai un dono",
    "footer.contact": "Contattaci",
    "footer.admin": "Admin",
    "about.title": "Informazioni su Bible Run",
    "about.p1": "Bible Run è un quiz sulla conoscenza biblica in cui gareggi contro il tempo e altri giocatori di tutto il mondo. Ogni domanda si basa su testi biblici reali, con fonti e contesto per imparare qualcosa, non solo indovinare.",
    "about.p2": "Ogni domanda viene revisionata e approvata manualmente prima della pubblicazione, per mantenere alta la qualità dei contenuti.",
    "donate.title": "Fai un dono",
    "donate.p1": "Bible Run è gestito come un'organizzazione no-profit. Se vuoi sostenere il suo funzionamento e sviluppo, te ne saremmo grati.",
    "donate.placeholder_title": "Il pagamento non è ancora collegato.",
    "donate.placeholder_body": "Questo riquadro è un segnaposto - oggi non è possibile ricevere pagamenti qui. Contattaci tramite \"Contattaci\" e imposteremo insieme un vero flusso di donazione (es. carta o bonifico).",
    "contact.title": "Contattaci",
    "contact.label.name": "Nome (facoltativo)",
    "contact.label.email": "Email",
    "contact.label.message": "Messaggio",
    "contact.submit": "Invia messaggio",
    "contact.sending": "Invio in corso…",
    "contact.sent": "Grazie! Il tuo messaggio è stato salvato e ti risponderemo presto.",
    "contact.err_message": "Scrivi un messaggio.",
    "contact.err_generic": "Impossibile inviare il messaggio. Riprova.",
  },
  nl: {
    "auth.title.login": "Welkom terug",
    "auth.title.signup": "Maak je account aan",
    "auth.subtitle.login": "Log in om verder te spelen",
    "auth.subtitle.signup": "Registreer je om te beginnen",
    "auth.tab.login": "Inloggen",
    "auth.tab.signup": "Nieuw account",
    "auth.label.email": "E-mail",
    "auth.placeholder.email": "jij@voorbeeld.com",
    "auth.label.name": "Je naam",
    "auth.placeholder.name": "Voer je naam in",
    "auth.label.country": "Kies land",
    "auth.label.password": "Wachtwoord",
    "auth.forgot": "Wachtwoord vergeten?",
    "auth.placeholder.password": "Minimaal 8 tekens",
    "auth.submit.login": "Inloggen",
    "auth.submit.signup": "Account aanmaken",
    "auth.submit.loading": "Een moment…",
    "auth.or": "of ga verder met",
    "auth.security_note": "Je wachtwoord wordt gehasht en veilig opgeslagen in de database. We zien je wachtwoord nooit in platte tekst.",
    "auth.show_password": "Toon wachtwoord",
    "auth.hide_password": "Verberg wachtwoord",
    "err.email_invalid": "Voer een geldig e-mailadres in.",
    "err.name_short": "Voer je naam in (minimaal 2 tekens).",
    "err.password_short": "Wachtwoord moet minimaal 8 tekens bevatten.",
    "err.email_taken": "Er bestaat al een account met dit e-mailadres. Log in plaats daarvan in.",
    "err.login_failed": "Onjuiste e-mail of wachtwoord.",
    "err.too_many_attempts": "Te veel pogingen. Wacht 15 minuten en probeer het opnieuw.",
    "err.generic": "Er is iets misgegaan. Probeer het opnieuw.",
    "err.oauth_failed": "Inloggen mislukt. Probeer het opnieuw.",
    "forgot.title": "Wachtwoord opnieuw instellen",
    "forgot.desc": "Voer je e-mail in en we sturen je een link om een nieuw wachtwoord in te stellen.",
    "forgot.submit": "Stuur resetlink",
    "forgot.sending": "Verzenden…",
    "forgot.success": "Als er een account met dit adres bestaat, hebben we er een link naartoe gestuurd. Controleer je inbox (en spam).",
    "forgot.back": "Terug naar inloggen",
    "reset.title": "Nieuw wachtwoord instellen",
    "reset.desc": "Kies een nieuw wachtwoord voor je account.",
    "reset.label": "Nieuw wachtwoord",
    "reset.submit": "Nieuw wachtwoord instellen",
    "reset.saving": "Opslaan…",
    "reset.success": "Wachtwoord bijgewerkt! Je kunt nu inloggen met je nieuwe wachtwoord.",
    "reset.to_login": "Naar inloggen",
    "reset.expired": "Deze link is verlopen of al gebruikt. Vraag een nieuwe resetlink aan.",
    "ready.welcome": "Welkom, {name}",
    "ready.title": "Klaar om te beginnen?",
    "ready.questions_count_one": "{count} vraag",
    "ready.questions_count": "{count} vragen",
    "ready.seconds_per_q": "30 sec/vraag",
    "ready.climb": "Klim in de ranglijst",
    "ready.level": "Level {level}",
    "ready.start": "Start het spel",
    "ready.loading": "Vragen laden…",
    "ready.no_questions": "Nog geen vragen gepubliceerd",
    "ready.leaderboard_link": "Ranglijst",
    "ready.logout": "Uitloggen",
    "ready.err_no_questions": "Er zijn nu geen vragen gepubliceerd. Probeer het later opnieuw.",
    "ready.err_fetch": "Kon vragen niet laden. Probeer het opnieuw.",
    "quiz.question_of": "VRAAG {current} VAN {total}",
    "quiz.context_label": "CONTEXT",
    "quiz.status.correct": "Correct! {explanation}",
    "quiz.status.wrong": "Niet helemaal. Het juiste antwoord is {answer}.",
    "quiz.status.timeout": "Tijd is om. Het juiste antwoord is {answer}.",
    "quiz.status.prompt": "Kies een antwoord voordat de tijd om is.",
    "quiz.source_label": "BRON",
    "quiz.read_more": "Lees de volledige tekst",
    "quiz.next_in": "Volgende vraag over {seconds}s…",
    "quiz.seconds_short": "SEC",
    "result.title": "Goed gespeeld, {name}!",
    "result.score_summary": "{correct} van {total} correct",
    "result.points_suffix": "pt",
    "result.play_again": "Speel opnieuw",
    "result.share": "Deel je resultaat",
    "result.view_leaderboard": "Bekijk de ranglijst",
    "result.share_copied": "Gekopieerd! Plak het waar je het wilt delen.",
    "result.share_text": "Ik scoorde {score} punten ({correct}/{total} correct) in Bible Run! Kun jij dat verslaan?",
    "lb.title": "RANGLIJST",
    "lb.loading": "Laden…",
    "lb.empty": "Nog niemand heeft gespeeld. Wees de eerste!",
    "lb.leading": "Aan de leiding",
    "lb.back": "Terug",
    "footer.about": "Over ons",
    "footer.donate": "Stuur een gift",
    "footer.contact": "Neem contact op",
    "footer.admin": "Beheer",
    "about.title": "Over Bible Run",
    "about.p1": "Bible Run is een bijbelkennisquiz waarin je tegen de klok en tegen spelers over de hele wereld speelt. Elke vraag is gebaseerd op echte bijbelteksten, met bronvermelding en context zodat je iets leert - niet zomaar raadt.",
    "about.p2": "Elke vraag wordt handmatig beoordeeld en goedgekeurd voordat deze wordt gepubliceerd, om de kwaliteit hoog te houden.",
    "donate.title": "Stuur een gift",
    "donate.p1": "Bible Run wordt gerund als een non-profitorganisatie. Als je de werking en verdere ontwikkeling wilt steunen, zijn we je dankbaar.",
    "donate.placeholder_title": "Betalen is nog niet aangesloten.",
    "donate.placeholder_body": "Dit vak is een tijdelijke aanduiding - vandaag kan hier geen betaling worden ontvangen. Neem contact met ons op via \"Neem contact op\" en samen zetten we een echte donatiestroom op (bijv. kaart of overschrijving).",
    "contact.title": "Neem contact op",
    "contact.label.name": "Naam (optioneel)",
    "contact.label.email": "E-mail",
    "contact.label.message": "Bericht",
    "contact.submit": "Verstuur bericht",
    "contact.sending": "Verzenden…",
    "contact.sent": "Bedankt! Je bericht is opgeslagen en we nemen contact met je op.",
    "contact.err_message": "Schrijf een bericht.",
    "contact.err_generic": "Kon het bericht niet versturen. Probeer het opnieuw.",
  },
  pl: {
    "auth.title.login": "Witaj ponownie",
    "auth.title.signup": "Utwórz konto",
    "auth.subtitle.login": "Zaloguj się, aby grać dalej",
    "auth.subtitle.signup": "Zarejestruj się, aby zacząć grać",
    "auth.tab.login": "Zaloguj się",
    "auth.tab.signup": "Nowe konto",
    "auth.label.email": "E-mail",
    "auth.placeholder.email": "ty@przyklad.com",
    "auth.label.name": "Twoje imię",
    "auth.placeholder.name": "Wpisz swoje imię",
    "auth.label.country": "Wybierz kraj",
    "auth.label.password": "Hasło",
    "auth.forgot": "Zapomniałeś hasła?",
    "auth.placeholder.password": "Co najmniej 8 znaków",
    "auth.submit.login": "Zaloguj się",
    "auth.submit.signup": "Utwórz konto",
    "auth.submit.loading": "Chwileczkę…",
    "auth.or": "lub kontynuuj przez",
    "auth.security_note": "Twoje hasło jest haszowane i bezpiecznie przechowywane w bazie danych. Nigdy nie widzimy Twojego hasła w postaci jawnej.",
    "auth.show_password": "Pokaż hasło",
    "auth.hide_password": "Ukryj hasło",
    "err.email_invalid": "Podaj prawidłowy adres e-mail.",
    "err.name_short": "Podaj swoje imię (co najmniej 2 znaki).",
    "err.password_short": "Hasło musi mieć co najmniej 8 znaków.",
    "err.email_taken": "Konto z tym adresem e-mail już istnieje. Zaloguj się zamiast tego.",
    "err.login_failed": "Nieprawidłowy e-mail lub hasło.",
    "err.too_many_attempts": "Zbyt wiele prób. Poczekaj 15 minut i spróbuj ponownie.",
    "err.generic": "Coś poszło nie tak. Spróbuj ponownie.",
    "err.oauth_failed": "Logowanie nie powiodło się. Spróbuj ponownie.",
    "forgot.title": "Zresetuj hasło",
    "forgot.desc": "Podaj swój e-mail, a wyślemy Ci link do ustawienia nowego hasła.",
    "forgot.submit": "Wyślij link resetujący",
    "forgot.sending": "Wysyłanie…",
    "forgot.success": "Jeśli istnieje konto z tym adresem, wysłaliśmy tam link. Sprawdź skrzynkę odbiorczą (i spam).",
    "forgot.back": "Powrót do logowania",
    "reset.title": "Ustaw nowe hasło",
    "reset.desc": "Wybierz nowe hasło dla swojego konta.",
    "reset.label": "Nowe hasło",
    "reset.submit": "Ustaw nowe hasło",
    "reset.saving": "Zapisywanie…",
    "reset.success": "Hasło zaktualizowane! Możesz teraz zalogować się nowym hasłem.",
    "reset.to_login": "Przejdź do logowania",
    "reset.expired": "Ten link wygasł lub został już użyty. Poproś o nowy link resetujący.",
    "ready.welcome": "Witaj, {name}",
    "ready.title": "Gotowy do startu?",
    "ready.questions_count_one": "{count} pytanie",
    "ready.questions_count_few": "{count} pytania",
    "ready.questions_count": "{count} pytań",
    "ready.seconds_per_q": "30 sek/pytanie",
    "ready.climb": "Wspinaj się w rankingu",
    "ready.level": "Poziom {level}",
    "ready.start": "Rozpocznij grę",
    "ready.loading": "Ładowanie pytań…",
    "ready.no_questions": "Brak opublikowanych pytań",
    "ready.leaderboard_link": "Ranking",
    "ready.logout": "Wyloguj się",
    "ready.err_no_questions": "Obecnie nie ma opublikowanych pytań. Spróbuj ponownie później.",
    "ready.err_fetch": "Nie udało się załadować pytań. Spróbuj ponownie.",
    "quiz.question_of": "PYTANIE {current} Z {total}",
    "quiz.context_label": "KONTEKST",
    "quiz.status.correct": "Poprawnie! {explanation}",
    "quiz.status.wrong": "Niezupełnie. Poprawna odpowiedź to {answer}.",
    "quiz.status.timeout": "Czas minął. Poprawna odpowiedź to {answer}.",
    "quiz.status.prompt": "Wybierz odpowiedź, zanim czas się skończy.",
    "quiz.source_label": "ŹRÓDŁO",
    "quiz.read_more": "Przeczytaj cały tekst",
    "quiz.next_in": "Następne pytanie za {seconds}s…",
    "quiz.seconds_short": "SEK",
    "result.title": "Dobra gra, {name}!",
    "result.score_summary": "{correct} z {total} poprawnych",
    "result.points_suffix": "pkt",
    "result.play_again": "Zagraj ponownie",
    "result.share": "Udostępnij wynik",
    "result.view_leaderboard": "Zobacz ranking",
    "result.share_copied": "Skopiowano! Wklej go tam, gdzie chcesz się podzielić.",
    "result.share_text": "Zdobyłem {score} punktów ({correct}/{total} poprawnych) w Bible Run! Pobijesz mnie?",
    "lb.title": "RANKING",
    "lb.loading": "Ładowanie…",
    "lb.empty": "Nikt jeszcze nie grał. Bądź pierwszy!",
    "lb.leading": "Na prowadzeniu",
    "lb.back": "Wstecz",
    "footer.about": "O nas",
    "footer.donate": "Wyślij dar",
    "footer.contact": "Kontakt",
    "footer.admin": "Admin",
    "about.title": "O Bible Run",
    "about.p1": "Bible Run to quiz z wiedzy biblijnej, w którym ścigasz się z czasem i graczami z całego świata. Każde pytanie oparte jest na prawdziwym tekście biblijnym, ze źródłem i kontekstem, dzięki czemu się uczysz - a nie tylko zgadujesz.",
    "about.p2": "Każde pytanie jest ręcznie sprawdzane i zatwierdzane przed publikacją, aby utrzymać wysoką jakość treści.",
    "donate.title": "Wyślij dar",
    "donate.p1": "Bible Run działa jako organizacja non-profit. Jeśli chcesz wesprzeć jej działanie i dalszy rozwój, będziemy wdzięczni.",
    "donate.placeholder_title": "Płatności nie są jeszcze podłączone.",
    "donate.placeholder_body": "To pole jest tymczasowe - dziś nie można tu przyjąć płatności. Skontaktuj się z nami przez \"Kontakt\", a wspólnie ustawimy prawdziwy proces darowizn (np. kartą lub przelewem).",
    "contact.title": "Kontakt",
    "contact.label.name": "Imię (opcjonalnie)",
    "contact.label.email": "E-mail",
    "contact.label.message": "Wiadomość",
    "contact.submit": "Wyślij wiadomość",
    "contact.sending": "Wysyłanie…",
    "contact.sent": "Dziękujemy! Twoja wiadomość została zapisana i wkrótce się odezwiemy.",
    "contact.err_message": "Napisz wiadomość.",
    "contact.err_generic": "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
  },
  ru: {
    "auth.title.login": "С возвращением",
    "auth.title.signup": "Создайте аккаунт",
    "auth.subtitle.login": "Войдите, чтобы продолжить игру",
    "auth.subtitle.signup": "Зарегистрируйтесь, чтобы начать играть",
    "auth.tab.login": "Войти",
    "auth.tab.signup": "Новый аккаунт",
    "auth.label.email": "Email",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "Ваше имя",
    "auth.placeholder.name": "Введите ваше имя",
    "auth.label.country": "Выберите страну",
    "auth.label.password": "Пароль",
    "auth.forgot": "Забыли пароль?",
    "auth.placeholder.password": "Минимум 8 символов",
    "auth.submit.login": "Войти",
    "auth.submit.signup": "Создать аккаунт",
    "auth.submit.loading": "Один момент…",
    "auth.or": "или продолжить через",
    "auth.security_note": "Ваш пароль хешируется и надёжно хранится в базе данных. Мы никогда не видим ваш пароль в открытом виде.",
    "auth.show_password": "Показать пароль",
    "auth.hide_password": "Скрыть пароль",
    "err.email_invalid": "Введите действительный адрес электронной почты.",
    "err.name_short": "Введите имя (минимум 2 символа).",
    "err.password_short": "Пароль должен содержать минимум 8 символов.",
    "err.email_taken": "Аккаунт с таким email уже существует. Войдите вместо регистрации.",
    "err.login_failed": "Неверный email или пароль.",
    "err.too_many_attempts": "Слишком много попыток. Подождите 15 минут и попробуйте снова.",
    "err.generic": "Что-то пошло не так. Попробуйте ещё раз.",
    "err.oauth_failed": "Вход не удался. Попробуйте ещё раз.",
    "forgot.title": "Сброс пароля",
    "forgot.desc": "Введите email, и мы отправим ссылку для установки нового пароля.",
    "forgot.submit": "Отправить ссылку для сброса",
    "forgot.sending": "Отправка…",
    "forgot.success": "Если аккаунт с этим адресом существует, мы отправили туда ссылку. Проверьте почту (и папку спам).",
    "forgot.back": "Назад ко входу",
    "reset.title": "Установить новый пароль",
    "reset.desc": "Выберите новый пароль для вашего аккаунта.",
    "reset.label": "Новый пароль",
    "reset.submit": "Установить новый пароль",
    "reset.saving": "Сохранение…",
    "reset.success": "Пароль обновлён! Теперь вы можете войти с новым паролем.",
    "reset.to_login": "Перейти ко входу",
    "reset.expired": "Срок действия ссылки истёк или она уже использована. Запросите новую ссылку.",
    "ready.welcome": "Добро пожаловать, {name}",
    "ready.title": "Готовы начать?",
    "ready.questions_count_one": "{count} вопрос",
    "ready.questions_count_few": "{count} вопроса",
    "ready.questions_count": "{count} вопросов",
    "ready.seconds_per_q": "30 сек/вопрос",
    "ready.climb": "Поднимайтесь в рейтинге",
    "ready.level": "Уровень {level}",
    "ready.start": "Начать игру",
    "ready.loading": "Загрузка вопросов…",
    "ready.no_questions": "Пока нет опубликованных вопросов",
    "ready.leaderboard_link": "Таблица лидеров",
    "ready.logout": "Выйти",
    "ready.err_no_questions": "Сейчас нет опубликованных вопросов. Попробуйте позже.",
    "ready.err_fetch": "Не удалось загрузить вопросы. Попробуйте ещё раз.",
    "quiz.question_of": "ВОПРОС {current} ИЗ {total}",
    "quiz.context_label": "КОНТЕКСТ",
    "quiz.status.correct": "Верно! {explanation}",
    "quiz.status.wrong": "Не совсем. Правильный ответ: {answer}.",
    "quiz.status.timeout": "Время вышло. Правильный ответ: {answer}.",
    "quiz.status.prompt": "Выберите ответ, пока не закончилось время.",
    "quiz.source_label": "ИСТОЧНИК",
    "quiz.read_more": "Читать полный текст",
    "quiz.next_in": "Следующий вопрос через {seconds}с…",
    "quiz.seconds_short": "СЕК",
    "result.title": "Отличная игра, {name}!",
    "result.score_summary": "{correct} из {total} верно",
    "result.points_suffix": "очк",
    "result.play_again": "Играть снова",
    "result.share": "Поделиться результатом",
    "result.view_leaderboard": "Посмотреть таблицу лидеров",
    "result.share_copied": "Скопировано! Вставьте туда, где хотите поделиться.",
    "result.share_text": "Я набрал {score} очков ({correct}/{total} верно) в Bible Run! Сможешь побить мой результат?",
    "lb.title": "ТАБЛИЦА ЛИДЕРОВ",
    "lb.loading": "Загрузка…",
    "lb.empty": "Пока никто не играл. Будьте первым!",
    "lb.leading": "Лидирует",
    "lb.back": "Назад",
    "footer.about": "О нас",
    "footer.donate": "Отправить подарок",
    "footer.contact": "Связаться с нами",
    "footer.admin": "Админ",
    "about.title": "О Bible Run",
    "about.p1": "Bible Run — это викторина на знание Библии, где вы соревнуетесь со временем и игроками со всего мира. Каждый вопрос основан на реальном библейском тексте, с указанием источника и контекста, чтобы вы учились, а не просто угадывали.",
    "about.p2": "Каждый вопрос проверяется и утверждается вручную перед публикацией, чтобы поддерживать высокое качество контента.",
    "donate.title": "Отправить подарок",
    "donate.p1": "Bible Run управляется как некоммерческая организация. Если вы хотите поддержать её работу и дальнейшее развитие, мы будем благодарны.",
    "donate.placeholder_title": "Оплата пока не подключена.",
    "donate.placeholder_body": "Это поле-заглушка — сегодня здесь нельзя произвести оплату. Свяжитесь с нами через \"Связаться с нами\", и мы вместе настроим настоящий процесс пожертвований (например, картой или переводом).",
    "contact.title": "Связаться с нами",
    "contact.label.name": "Имя (необязательно)",
    "contact.label.email": "Email",
    "contact.label.message": "Сообщение",
    "contact.submit": "Отправить сообщение",
    "contact.sending": "Отправка…",
    "contact.sent": "Спасибо! Ваше сообщение сохранено, мы свяжемся с вами.",
    "contact.err_message": "Пожалуйста, напишите сообщение.",
    "contact.err_generic": "Не удалось отправить сообщение. Попробуйте ещё раз.",
  },
  ar: {
    "auth.title.login": "مرحبًا بعودتك",
    "auth.title.signup": "أنشئ حسابك",
    "auth.subtitle.login": "سجّل الدخول لمواصلة اللعب",
    "auth.subtitle.signup": "سجّل للبدء في اللعب",
    "auth.tab.login": "تسجيل الدخول",
    "auth.tab.signup": "حساب جديد",
    "auth.label.email": "البريد الإلكتروني",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "اسمك",
    "auth.placeholder.name": "أدخل اسمك",
    "auth.label.country": "اختر البلد",
    "auth.label.password": "كلمة المرور",
    "auth.forgot": "هل نسيت كلمة المرور؟",
    "auth.placeholder.password": "8 أحرف على الأقل",
    "auth.submit.login": "تسجيل الدخول",
    "auth.submit.signup": "إنشاء حساب",
    "auth.submit.loading": "لحظة واحدة…",
    "auth.or": "أو تابع باستخدام",
    "auth.security_note": "يتم تشفير كلمة مرورك وتخزينها بأمان في قاعدة البيانات. لا نرى كلمة مرورك أبدًا كنص عادي.",
    "auth.show_password": "إظهار كلمة المرور",
    "auth.hide_password": "إخفاء كلمة المرور",
    "err.email_invalid": "أدخل عنوان بريد إلكتروني صالحًا.",
    "err.name_short": "أدخل اسمك (حرفان على الأقل).",
    "err.password_short": "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
    "err.email_taken": "يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول بدلاً من ذلك.",
    "err.login_failed": "بريد إلكتروني أو كلمة مرور غير صحيحة.",
    "err.too_many_attempts": "محاولات كثيرة جدًا. انتظر 15 دقيقة ثم حاول مرة أخرى.",
    "err.generic": "حدث خطأ ما. حاول مرة أخرى.",
    "err.oauth_failed": "فشل تسجيل الدخول. حاول مرة أخرى.",
    "forgot.title": "إعادة تعيين كلمة المرور",
    "forgot.desc": "أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.",
    "forgot.submit": "إرسال رابط إعادة التعيين",
    "forgot.sending": "جارٍ الإرسال…",
    "forgot.success": "إذا كان هناك حساب بهذا العنوان، فقد أرسلنا رابطًا إليه. تحقق من بريدك الوارد (ومجلد البريد العشوائي).",
    "forgot.back": "العودة لتسجيل الدخول",
    "reset.title": "تعيين كلمة مرور جديدة",
    "reset.desc": "اختر كلمة مرور جديدة لحسابك.",
    "reset.label": "كلمة المرور الجديدة",
    "reset.submit": "تعيين كلمة المرور الجديدة",
    "reset.saving": "جارٍ الحفظ…",
    "reset.success": "تم تحديث كلمة المرور! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    "reset.to_login": "الذهاب لتسجيل الدخول",
    "reset.expired": "انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل. اطلب رابط إعادة تعيين جديد.",
    "ready.welcome": "مرحبًا، {name}",
    "ready.title": "هل أنت مستعد للانطلاق؟",
    "ready.questions_count_zero": "لا توجد أسئلة",
    "ready.questions_count_one": "سؤال واحد",
    "ready.questions_count_two": "سؤالان",
    "ready.questions_count_few": "{count} أسئلة",
    "ready.questions_count": "{count} سؤالًا",
    "ready.seconds_per_q": "30 ثانية/سؤال",
    "ready.climb": "تسلّق الترتيب",
    "ready.level": "المستوى {level}",
    "ready.start": "ابدأ اللعبة",
    "ready.loading": "جارٍ تحميل الأسئلة…",
    "ready.no_questions": "لا توجد أسئلة منشورة بعد",
    "ready.leaderboard_link": "لوحة المتصدرين",
    "ready.logout": "تسجيل الخروج",
    "ready.err_no_questions": "لا توجد أسئلة منشورة حاليًا. حاول مرة أخرى لاحقًا.",
    "ready.err_fetch": "تعذّر تحميل الأسئلة. حاول مرة أخرى.",
    "quiz.question_of": "السؤال {current} من {total}",
    "quiz.context_label": "السياق",
    "quiz.status.correct": "صحيح! {explanation}",
    "quiz.status.wrong": "ليس تمامًا. الإجابة الصحيحة هي {answer}.",
    "quiz.status.timeout": "انتهى الوقت. الإجابة الصحيحة هي {answer}.",
    "quiz.status.prompt": "اختر إجابة قبل انتهاء الوقت.",
    "quiz.source_label": "المصدر",
    "quiz.read_more": "اقرأ النص كاملاً",
    "quiz.next_in": "السؤال التالي خلال {seconds} ث…",
    "quiz.seconds_short": "ث",
    "result.title": "أحسنت اللعب، {name}!",
    "result.score_summary": "{correct} من {total} صحيحة",
    "result.points_suffix": "نقطة",
    "result.play_again": "العب مرة أخرى",
    "result.share": "شارك نتيجتك",
    "result.view_leaderboard": "عرض لوحة المتصدرين",
    "result.share_copied": "تم النسخ! الصقها حيث تريد المشاركة.",
    "result.share_text": "لقد سجّلت {score} نقطة ({correct}/{total} صحيحة) في Bible Run! هل يمكنك التغلب على ذلك؟",
    "lb.title": "لوحة المتصدرين",
    "lb.loading": "جارٍ التحميل…",
    "lb.empty": "لم يلعب أحد بعد. كن الأول!",
    "lb.leading": "في الصدارة",
    "lb.back": "رجوع",
    "footer.about": "من نحن",
    "footer.donate": "أرسل هدية",
    "footer.contact": "اتصل بنا",
    "footer.admin": "الإدارة",
    "about.title": "عن Bible Run",
    "about.p1": "Bible Run هو اختبار معرفة الكتاب المقدس حيث تتسابق مع الوقت وتنافس لاعبين من جميع أنحاء العالم. كل سؤال مستند إلى نص كتابي حقيقي، مع ذكر المصدر والسياق حتى تتعلم شيئًا - لا مجرد التخمين.",
    "about.p2": "تتم مراجعة كل سؤال والموافقة عليه يدويًا قبل نشره، للحفاظ على جودة المحتوى عالية.",
    "donate.title": "أرسل هدية",
    "donate.p1": "يُدار Bible Run كمنظمة غير ربحية. إذا كنت ترغب في دعم تشغيله وتطويره المستمر، سنكون ممتنين.",
    "donate.placeholder_title": "الدفع غير متصل بعد.",
    "donate.placeholder_body": "هذا المربع هو عنصر نائب - لا يمكن استلام أي دفعة هنا اليوم. تواصل معنا عبر \"اتصل بنا\" وسنقوم معًا بإعداد وسيلة تبرع حقيقية (مثل البطاقة أو التحويل البنكي).",
    "contact.title": "اتصل بنا",
    "contact.label.name": "الاسم (اختياري)",
    "contact.label.email": "البريد الإلكتروني",
    "contact.label.message": "الرسالة",
    "contact.submit": "إرسال الرسالة",
    "contact.sending": "جارٍ الإرسال…",
    "contact.sent": "شكرًا لك! تم حفظ رسالتك وسنتواصل معك قريبًا.",
    "contact.err_message": "يرجى كتابة رسالة.",
    "contact.err_generic": "تعذّر إرسال الرسالة. حاول مرة أخرى.",
  },
  zh: {
    "auth.title.login": "欢迎回来",
    "auth.title.signup": "创建账户",
    "auth.subtitle.login": "登录以继续游戏",
    "auth.subtitle.signup": "注册开始游戏",
    "auth.tab.login": "登录",
    "auth.tab.signup": "新账户",
    "auth.label.email": "邮箱",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "你的名字",
    "auth.placeholder.name": "输入你的名字",
    "auth.label.country": "选择国家",
    "auth.label.password": "密码",
    "auth.forgot": "忘记密码？",
    "auth.placeholder.password": "至少8个字符",
    "auth.submit.login": "登录",
    "auth.submit.signup": "创建账户",
    "auth.submit.loading": "请稍候…",
    "auth.or": "或继续使用",
    "auth.security_note": "你的密码会被哈希处理并安全存储在数据库中。我们绝不会看到你的明文密码。",
    "auth.show_password": "显示密码",
    "auth.hide_password": "隐藏密码",
    "err.email_invalid": "请输入有效的邮箱地址。",
    "err.name_short": "请输入你的名字（至少2个字符）。",
    "err.password_short": "密码必须至少8个字符。",
    "err.email_taken": "该邮箱已注册账户，请直接登录。",
    "err.login_failed": "邮箱或密码错误。",
    "err.too_many_attempts": "尝试次数过多，请等待15分钟后再试。",
    "err.generic": "出了点问题，请重试。",
    "err.oauth_failed": "登录失败，请重试。",
    "forgot.title": "重置密码",
    "forgot.desc": "输入你的邮箱，我们会发送设置新密码的链接。",
    "forgot.submit": "发送重置链接",
    "forgot.sending": "发送中…",
    "forgot.success": "如果存在该邮箱的账户，我们已发送链接。请查看收件箱（以及垃圾邮件文件夹）。",
    "forgot.back": "返回登录",
    "reset.title": "设置新密码",
    "reset.desc": "为你的账户选择一个新密码。",
    "reset.label": "新密码",
    "reset.submit": "设置新密码",
    "reset.saving": "保存中…",
    "reset.success": "密码已更新！现在可以用新密码登录了。",
    "reset.to_login": "前往登录",
    "reset.expired": "此链接已过期或已被使用。请重新申请重置链接。",
    "ready.welcome": "欢迎，{name}",
    "ready.title": "准备好出发了吗？",
    "ready.questions_count": "{count} 道题",
    "ready.seconds_per_q": "30秒/题",
    "ready.climb": "提升排名",
    "ready.level": "等级 {level}",
    "ready.start": "开始游戏",
    "ready.loading": "加载题目中…",
    "ready.no_questions": "暂无已发布的题目",
    "ready.leaderboard_link": "排行榜",
    "ready.logout": "退出登录",
    "ready.err_no_questions": "目前没有已发布的题目，请稍后再试。",
    "ready.err_fetch": "无法加载题目，请重试。",
    "quiz.question_of": "第 {current} 题，共 {total} 题",
    "quiz.context_label": "背景",
    "quiz.status.correct": "正确！{explanation}",
    "quiz.status.wrong": "不完全对。正确答案是 {answer}。",
    "quiz.status.timeout": "时间到。正确答案是 {answer}。",
    "quiz.status.prompt": "请在时间结束前选择一个答案。",
    "quiz.source_label": "来源",
    "quiz.read_more": "阅读全文",
    "quiz.next_in": "{seconds}秒后进入下一题…",
    "quiz.seconds_short": "秒",
    "result.title": "干得漂亮，{name}！",
    "result.score_summary": "{total} 题中答对 {correct} 题",
    "result.points_suffix": "分",
    "result.play_again": "再玩一次",
    "result.share": "分享你的成绩",
    "result.view_leaderboard": "查看排行榜",
    "result.share_copied": "已复制！粘贴到你想分享的地方。",
    "result.share_text": "我在 Bible Run 中获得了 {score} 分（{correct}/{total} 正确）！你能超过我吗？",
    "lb.title": "排行榜",
    "lb.loading": "加载中…",
    "lb.empty": "还没有人玩过，快来第一个吧！",
    "lb.leading": "领先中",
    "lb.back": "返回",
    "footer.about": "关于我们",
    "footer.donate": "赠送礼物",
    "footer.contact": "联系我们",
    "footer.admin": "管理员",
    "about.title": "关于 Bible Run",
    "about.p1": "Bible Run 是一款圣经知识问答游戏，你将与时间赛跑，并与来自世界各地的玩家竞争。每道题都基于真实的圣经文本，附有出处和背景，让你在游戏中真正学到知识，而不只是猜测。",
    "about.p2": "每道题在发布前都经过人工审核和批准，以保持内容的高质量。",
    "donate.title": "赠送礼物",
    "donate.p1": "Bible Run 是一个非营利项目运营。如果你愿意支持它的运营和持续开发，我们将不胜感激。",
    "donate.placeholder_title": "支付功能尚未接入。",
    "donate.placeholder_body": "此处仅为占位 - 目前无法在此接收付款。请通过“联系我们”与我们联系，我们将共同设置真正的捐赠方式（例如银行卡或转账）。",
    "contact.title": "联系我们",
    "contact.label.name": "姓名（选填）",
    "contact.label.email": "邮箱",
    "contact.label.message": "留言",
    "contact.submit": "发送消息",
    "contact.sending": "发送中…",
    "contact.sent": "谢谢！你的消息已保存，我们会尽快回复。",
    "contact.err_message": "请填写留言内容。",
    "contact.err_generic": "无法发送消息，请重试。",
  },
  hi: {
    "auth.title.login": "वापसी पर स्वागत है",
    "auth.title.signup": "अपना खाता बनाएं",
    "auth.subtitle.login": "खेलना जारी रखने के लिए लॉग इन करें",
    "auth.subtitle.signup": "खेलना शुरू करने के लिए साइन अप करें",
    "auth.tab.login": "लॉग इन करें",
    "auth.tab.signup": "नया खाता",
    "auth.label.email": "ईमेल",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "आपका नाम",
    "auth.placeholder.name": "अपना नाम दर्ज करें",
    "auth.label.country": "देश चुनें",
    "auth.label.password": "पासवर्ड",
    "auth.forgot": "पासवर्ड भूल गए?",
    "auth.placeholder.password": "कम से कम 8 अक्षर",
    "auth.submit.login": "लॉग इन करें",
    "auth.submit.signup": "खाता बनाएं",
    "auth.submit.loading": "एक क्षण…",
    "auth.or": "या इसके साथ जारी रखें",
    "auth.security_note": "आपका पासवर्ड हैश किया जाता है और डेटाबेस में सुरक्षित रूप से संग्रहीत किया जाता है। हम आपका पासवर्ड कभी सादे पाठ में नहीं देखते।",
    "auth.show_password": "पासवर्ड दिखाएं",
    "auth.hide_password": "पासवर्ड छिपाएं",
    "err.email_invalid": "एक मान्य ईमेल पता दर्ज करें।",
    "err.name_short": "अपना नाम दर्ज करें (कम से कम 2 अक्षर)।",
    "err.password_short": "पासवर्ड कम से कम 8 अक्षर का होना चाहिए।",
    "err.email_taken": "इस ईमेल से पहले से एक खाता मौजूद है। इसके बजाय लॉग इन करें।",
    "err.login_failed": "गलत ईमेल या पासवर्ड।",
    "err.too_many_attempts": "बहुत अधिक प्रयास। 15 मिनट प्रतीक्षा करें और फिर से प्रयास करें।",
    "err.generic": "कुछ गलत हो गया। कृपया पुनः प्रयास करें।",
    "err.oauth_failed": "लॉगिन विफल रहा। कृपया पुनः प्रयास करें।",
    "forgot.title": "पासवर्ड रीसेट करें",
    "forgot.desc": "अपना ईमेल दर्ज करें और हम आपको नया पासवर्ड सेट करने के लिए एक लिंक भेजेंगे।",
    "forgot.submit": "रीसेट लिंक भेजें",
    "forgot.sending": "भेजा जा रहा है…",
    "forgot.success": "यदि इस पते से कोई खाता मौजूद है, तो हमने वहां एक लिंक भेज दिया है। अपना इनबॉक्स (और स्पैम फ़ोल्डर) जांचें।",
    "forgot.back": "लॉगिन पर वापस जाएं",
    "reset.title": "नया पासवर्ड सेट करें",
    "reset.desc": "अपने खाते के लिए एक नया पासवर्ड चुनें।",
    "reset.label": "नया पासवर्ड",
    "reset.submit": "नया पासवर्ड सेट करें",
    "reset.saving": "सहेजा जा रहा है…",
    "reset.success": "पासवर्ड अपडेट हो गया! अब आप अपने नए पासवर्ड से लॉग इन कर सकते हैं।",
    "reset.to_login": "लॉगिन पर जाएं",
    "reset.expired": "यह लिंक समाप्त हो गया है या पहले ही इस्तेमाल किया जा चुका है। नया रीसेट लिंक मांगें।",
    "ready.welcome": "स्वागत है, {name}",
    "ready.title": "शुरू करने के लिए तैयार हैं?",
    "ready.questions_count": "{count} प्रश्न",
    "ready.seconds_per_q": "30 सेकंड/प्रश्न",
    "ready.climb": "रैंकिंग में ऊपर चढ़ें",
    "ready.level": "स्तर {level}",
    "ready.start": "खेल शुरू करें",
    "ready.loading": "प्रश्न लोड हो रहे हैं…",
    "ready.no_questions": "अभी तक कोई प्रश्न प्रकाशित नहीं हुआ",
    "ready.leaderboard_link": "लीडरबोर्ड",
    "ready.logout": "लॉग आउट",
    "ready.err_no_questions": "अभी कोई प्रश्न प्रकाशित नहीं है। बाद में फिर से प्रयास करें।",
    "ready.err_fetch": "प्रश्न लोड नहीं हो सके। कृपया पुनः प्रयास करें।",
    "quiz.question_of": "प्रश्न {current} / {total}",
    "quiz.context_label": "संदर्भ",
    "quiz.status.correct": "सही! {explanation}",
    "quiz.status.wrong": "बिल्कुल नहीं। सही उत्तर है {answer}।",
    "quiz.status.timeout": "समय समाप्त। सही उत्तर है {answer}।",
    "quiz.status.prompt": "समय समाप्त होने से पहले एक उत्तर चुनें।",
    "quiz.source_label": "स्रोत",
    "quiz.read_more": "पूरा पाठ पढ़ें",
    "quiz.next_in": "अगला प्रश्न {seconds} सेकंड में…",
    "quiz.seconds_short": "सेक",
    "result.title": "शानदार खेल, {name}!",
    "result.score_summary": "{total} में से {correct} सही",
    "result.points_suffix": "अंक",
    "result.play_again": "फिर से खेलें",
    "result.share": "अपना परिणाम साझा करें",
    "result.view_leaderboard": "लीडरबोर्ड देखें",
    "result.share_copied": "कॉपी हो गया! जहां साझा करना चाहते हैं वहां पेस्ट करें।",
    "result.share_text": "मैंने Bible Run में {score} अंक ({correct}/{total} सही) प्राप्त किए! क्या आप इसे हरा सकते हैं?",
    "lb.title": "लीडरबोर्ड",
    "lb.loading": "लोड हो रहा है…",
    "lb.empty": "अभी तक किसी ने नहीं खेला है। पहले बनें!",
    "lb.leading": "आगे चल रहे हैं",
    "lb.back": "वापस",
    "footer.about": "हमारे बारे में",
    "footer.donate": "एक उपहार भेजें",
    "footer.contact": "संपर्क करें",
    "footer.admin": "एडमिन",
    "about.title": "Bible Run के बारे में",
    "about.p1": "Bible Run एक बाइबिल ज्ञान क्विज़ है जहां आप समय के खिलाफ दौड़ते हैं और दुनिया भर के खिलाड़ियों के खिलाफ प्रतिस्पर्धा करते हैं। हर प्रश्न वास्तविक बाइबिल पाठ पर आधारित है, स्रोत और संदर्भ के साथ ताकि आप कुछ सीखें - सिर्फ अनुमान न लगाएं।",
    "about.p2": "प्रकाशित होने से पहले हर प्रश्न की मैन्युअल समीक्षा और अनुमोदन किया जाता है, ताकि सामग्री की गुणवत्ता ऊंची बनी रहे।",
    "donate.title": "एक उपहार भेजें",
    "donate.p1": "Bible Run एक गैर-लाभकारी संगठन के रूप में चलाया जाता है। यदि आप इसके संचालन और निरंतर विकास का समर्थन करना चाहते हैं, तो हम आभारी होंगे।",
    "donate.placeholder_title": "भुगतान अभी तक कनेक्ट नहीं हुआ है।",
    "donate.placeholder_body": "यह बॉक्स एक प्लेसहोल्डर है - आज यहां कोई भुगतान प्राप्त नहीं किया जा सकता। \"संपर्क करें\" के माध्यम से हमसे संपर्क करें और हम मिलकर एक वास्तविक दान प्रक्रिया (जैसे कार्ड या बैंक ट्रांसफर) स्थापित करेंगे।",
    "contact.title": "संपर्क करें",
    "contact.label.name": "नाम (वैकल्पिक)",
    "contact.label.email": "ईमेल",
    "contact.label.message": "संदेश",
    "contact.submit": "संदेश भेजें",
    "contact.sending": "भेजा जा रहा है…",
    "contact.sent": "धन्यवाद! आपका संदेश सहेज लिया गया है और हम जल्द ही आपसे संपर्क करेंगे।",
    "contact.err_message": "कृपया एक संदेश लिखें।",
    "contact.err_generic": "संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें।",
  },
  vi: {
    "auth.title.login": "Chào mừng trở lại",
    "auth.title.signup": "Tạo tài khoản của bạn",
    "auth.subtitle.login": "Đăng nhập để tiếp tục chơi",
    "auth.subtitle.signup": "Đăng ký để bắt đầu chơi",
    "auth.tab.login": "Đăng nhập",
    "auth.tab.signup": "Tài khoản mới",
    "auth.label.email": "Email",
    "auth.placeholder.email": "you@example.com",
    "auth.label.name": "Tên của bạn",
    "auth.placeholder.name": "Nhập tên của bạn",
    "auth.label.country": "Chọn quốc gia",
    "auth.label.password": "Mật khẩu",
    "auth.forgot": "Quên mật khẩu?",
    "auth.placeholder.password": "Ít nhất 8 ký tự",
    "auth.submit.login": "Đăng nhập",
    "auth.submit.signup": "Tạo tài khoản",
    "auth.submit.loading": "Một chút…",
    "auth.or": "hoặc tiếp tục với",
    "auth.security_note": "Mật khẩu của bạn được băm và lưu trữ an toàn trong cơ sở dữ liệu. Chúng tôi không bao giờ thấy mật khẩu của bạn ở dạng văn bản thuần.",
    "auth.show_password": "Hiện mật khẩu",
    "auth.hide_password": "Ẩn mật khẩu",
    "err.email_invalid": "Nhập một địa chỉ email hợp lệ.",
    "err.name_short": "Nhập tên của bạn (ít nhất 2 ký tự).",
    "err.password_short": "Mật khẩu phải có ít nhất 8 ký tự.",
    "err.email_taken": "Đã tồn tại tài khoản với email này. Hãy đăng nhập thay vì đăng ký.",
    "err.login_failed": "Email hoặc mật khẩu không đúng.",
    "err.too_many_attempts": "Quá nhiều lần thử. Vui lòng đợi 15 phút rồi thử lại.",
    "err.generic": "Đã xảy ra lỗi. Vui lòng thử lại.",
    "err.oauth_failed": "Đăng nhập thất bại. Vui lòng thử lại.",
    "forgot.title": "Đặt lại mật khẩu",
    "forgot.desc": "Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt mật khẩu mới.",
    "forgot.submit": "Gửi liên kết đặt lại",
    "forgot.sending": "Đang gửi…",
    "forgot.success": "Nếu có tài khoản với địa chỉ này, chúng tôi đã gửi liên kết đến đó. Kiểm tra hộp thư đến (và thư mục spam).",
    "forgot.back": "Quay lại đăng nhập",
    "reset.title": "Đặt mật khẩu mới",
    "reset.desc": "Chọn mật khẩu mới cho tài khoản của bạn.",
    "reset.label": "Mật khẩu mới",
    "reset.submit": "Đặt mật khẩu mới",
    "reset.saving": "Đang lưu…",
    "reset.success": "Đã cập nhật mật khẩu! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.",
    "reset.to_login": "Đi đến đăng nhập",
    "reset.expired": "Liên kết này đã hết hạn hoặc đã được sử dụng. Yêu cầu liên kết đặt lại mới.",
    "ready.welcome": "Chào mừng, {name}",
    "ready.title": "Sẵn sàng bắt đầu chưa?",
    "ready.questions_count": "{count} câu hỏi",
    "ready.seconds_per_q": "30 giây/câu",
    "ready.climb": "Leo hạng",
    "ready.level": "Cấp độ {level}",
    "ready.start": "Bắt đầu trò chơi",
    "ready.loading": "Đang tải câu hỏi…",
    "ready.no_questions": "Chưa có câu hỏi nào được đăng",
    "ready.leaderboard_link": "Bảng xếp hạng",
    "ready.logout": "Đăng xuất",
    "ready.err_no_questions": "Hiện chưa có câu hỏi nào được đăng. Vui lòng thử lại sau.",
    "ready.err_fetch": "Không thể tải câu hỏi. Vui lòng thử lại.",
    "quiz.question_of": "CÂU {current} / {total}",
    "quiz.context_label": "BỐI CẢNH",
    "quiz.status.correct": "Chính xác! {explanation}",
    "quiz.status.wrong": "Chưa đúng. Đáp án đúng là {answer}.",
    "quiz.status.timeout": "Hết giờ. Đáp án đúng là {answer}.",
    "quiz.status.prompt": "Chọn một câu trả lời trước khi hết giờ.",
    "quiz.source_label": "NGUỒN",
    "quiz.read_more": "Đọc toàn bộ văn bản",
    "quiz.next_in": "Câu hỏi tiếp theo sau {seconds}s…",
    "quiz.seconds_short": "GIÂY",
    "result.title": "Chơi tốt lắm, {name}!",
    "result.score_summary": "{correct}/{total} câu đúng",
    "result.points_suffix": "điểm",
    "result.play_again": "Chơi lại",
    "result.share": "Chia sẻ kết quả",
    "result.view_leaderboard": "Xem bảng xếp hạng",
    "result.share_copied": "Đã sao chép! Dán vào nơi bạn muốn chia sẻ.",
    "result.share_text": "Tôi đã đạt {score} điểm ({correct}/{total} đúng) trong Bible Run! Bạn có thể đánh bại điều đó không?",
    "lb.title": "BẢNG XẾP HẠNG",
    "lb.loading": "Đang tải…",
    "lb.empty": "Chưa có ai chơi. Hãy là người đầu tiên!",
    "lb.leading": "Đang dẫn đầu",
    "lb.back": "Quay lại",
    "footer.about": "Về chúng tôi",
    "footer.donate": "Gửi quà tặng",
    "footer.contact": "Liên hệ",
    "footer.admin": "Quản trị",
    "about.title": "Về Bible Run",
    "about.p1": "Bible Run là một trò chơi đố vui kiến thức Kinh Thánh, nơi bạn chạy đua với thời gian và cạnh tranh với người chơi trên khắp thế giới. Mỗi câu hỏi đều dựa trên văn bản Kinh Thánh thực sự, có nguồn và bối cảnh để bạn học được điều gì đó - chứ không chỉ đoán.",
    "about.p2": "Mỗi câu hỏi được xem xét và phê duyệt thủ công trước khi đăng, để giữ chất lượng nội dung cao.",
    "donate.title": "Gửi quà tặng",
    "donate.p1": "Bible Run được vận hành như một tổ chức phi lợi nhuận. Nếu bạn muốn ủng hộ hoạt động và sự phát triển liên tục của nó, chúng tôi rất biết ơn.",
    "donate.placeholder_title": "Chưa kết nối thanh toán.",
    "donate.placeholder_body": "Ô này chỉ là chỗ giữ chỗ - hôm nay chưa thể nhận thanh toán ở đây. Hãy liên hệ qua \"Liên hệ\" và chúng ta sẽ cùng thiết lập một quy trình quyên góp thực sự (ví dụ: thẻ hoặc chuyển khoản).",
    "contact.title": "Liên hệ",
    "contact.label.name": "Tên (không bắt buộc)",
    "contact.label.email": "Email",
    "contact.label.message": "Tin nhắn",
    "contact.submit": "Gửi tin nhắn",
    "contact.sending": "Đang gửi…",
    "contact.sent": "Cảm ơn! Tin nhắn của bạn đã được lưu và chúng tôi sẽ phản hồi sớm.",
    "contact.err_message": "Vui lòng viết một tin nhắn.",
    "contact.err_generic": "Không thể gửi tin nhắn. Vui lòng thử lại.",
  },
  id: {
    "auth.title.login": "Selamat datang kembali",
    "auth.title.signup": "Buat akun Anda",
    "auth.subtitle.login": "Masuk untuk terus bermain",
    "auth.subtitle.signup": "Daftar untuk mulai bermain",
    "auth.tab.login": "Masuk",
    "auth.tab.signup": "Akun baru",
    "auth.label.email": "Email",
    "auth.placeholder.email": "kamu@contoh.com",
    "auth.label.name": "Nama Anda",
    "auth.placeholder.name": "Masukkan nama Anda",
    "auth.label.country": "Pilih negara",
    "auth.label.password": "Kata sandi",
    "auth.forgot": "Lupa kata sandi?",
    "auth.placeholder.password": "Minimal 8 karakter",
    "auth.submit.login": "Masuk",
    "auth.submit.signup": "Buat akun",
    "auth.submit.loading": "Sebentar…",
    "auth.or": "atau lanjutkan dengan",
    "auth.security_note": "Kata sandi Anda di-hash dan disimpan dengan aman di database. Kami tidak pernah melihat kata sandi Anda dalam bentuk teks biasa.",
    "auth.show_password": "Tampilkan kata sandi",
    "auth.hide_password": "Sembunyikan kata sandi",
    "err.email_invalid": "Masukkan alamat email yang valid.",
    "err.name_short": "Masukkan nama Anda (minimal 2 karakter).",
    "err.password_short": "Kata sandi harus minimal 8 karakter.",
    "err.email_taken": "Akun dengan email ini sudah ada. Silakan masuk sebagai gantinya.",
    "err.login_failed": "Email atau kata sandi salah.",
    "err.too_many_attempts": "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi.",
    "err.generic": "Terjadi kesalahan. Silakan coba lagi.",
    "err.oauth_failed": "Login gagal. Silakan coba lagi.",
    "forgot.title": "Atur ulang kata sandi",
    "forgot.desc": "Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur kata sandi baru.",
    "forgot.submit": "Kirim tautan reset",
    "forgot.sending": "Mengirim…",
    "forgot.success": "Jika ada akun dengan alamat ini, kami telah mengirimkan tautan ke sana. Periksa kotak masuk Anda (dan folder spam).",
    "forgot.back": "Kembali ke masuk",
    "reset.title": "Atur kata sandi baru",
    "reset.desc": "Pilih kata sandi baru untuk akun Anda.",
    "reset.label": "Kata sandi baru",
    "reset.submit": "Atur kata sandi baru",
    "reset.saving": "Menyimpan…",
    "reset.success": "Kata sandi diperbarui! Sekarang Anda bisa masuk dengan kata sandi baru.",
    "reset.to_login": "Ke halaman masuk",
    "reset.expired": "Tautan ini sudah kedaluwarsa atau sudah digunakan. Minta tautan reset baru.",
    "ready.welcome": "Selamat datang, {name}",
    "ready.title": "Siap untuk mulai?",
    "ready.questions_count": "{count} pertanyaan",
    "ready.seconds_per_q": "30 detik/pertanyaan",
    "ready.climb": "Naik peringkat",
    "ready.level": "Level {level}",
    "ready.start": "Mulai permainan",
    "ready.loading": "Memuat pertanyaan…",
    "ready.no_questions": "Belum ada pertanyaan yang dipublikasikan",
    "ready.leaderboard_link": "Papan peringkat",
    "ready.logout": "Keluar",
    "ready.err_no_questions": "Saat ini belum ada pertanyaan yang dipublikasikan. Coba lagi nanti.",
    "ready.err_fetch": "Tidak dapat memuat pertanyaan. Silakan coba lagi.",
    "quiz.question_of": "PERTANYAAN {current} DARI {total}",
    "quiz.context_label": "KONTEKS",
    "quiz.status.correct": "Benar! {explanation}",
    "quiz.status.wrong": "Belum tepat. Jawaban yang benar adalah {answer}.",
    "quiz.status.timeout": "Waktu habis. Jawaban yang benar adalah {answer}.",
    "quiz.status.prompt": "Pilih jawaban sebelum waktu habis.",
    "quiz.source_label": "SUMBER",
    "quiz.read_more": "Baca teks lengkap",
    "quiz.next_in": "Pertanyaan berikutnya dalam {seconds}dtk…",
    "quiz.seconds_short": "DTK",
    "result.title": "Permainan yang bagus, {name}!",
    "result.score_summary": "{correct} dari {total} benar",
    "result.points_suffix": "poin",
    "result.play_again": "Main lagi",
    "result.share": "Bagikan hasil Anda",
    "result.view_leaderboard": "Lihat papan peringkat",
    "result.share_copied": "Disalin! Tempel di tempat Anda ingin membagikannya.",
    "result.share_text": "Saya mendapat {score} poin ({correct}/{total} benar) di Bible Run! Bisakah Anda mengalahkannya?",
    "lb.title": "PAPAN PERINGKAT",
    "lb.loading": "Memuat…",
    "lb.empty": "Belum ada yang bermain. Jadilah yang pertama!",
    "lb.leading": "Memimpin",
    "lb.back": "Kembali",
    "footer.about": "Tentang kami",
    "footer.donate": "Kirim hadiah",
    "footer.contact": "Hubungi kami",
    "footer.admin": "Admin",
    "about.title": "Tentang Bible Run",
    "about.p1": "Bible Run adalah kuis pengetahuan Alkitab di mana Anda berpacu dengan waktu dan bersaing dengan pemain dari seluruh dunia. Setiap pertanyaan didasarkan pada teks Alkitab yang nyata, dengan sumber dan konteks agar Anda belajar sesuatu - bukan hanya menebak.",
    "about.p2": "Setiap pertanyaan ditinjau dan disetujui secara manual sebelum dipublikasikan, untuk menjaga kualitas konten tetap tinggi.",
    "donate.title": "Kirim hadiah",
    "donate.p1": "Bible Run dijalankan sebagai organisasi nirlaba. Jika Anda ingin mendukung operasional dan pengembangannya, kami akan sangat berterima kasih.",
    "donate.placeholder_title": "Pembayaran belum terhubung.",
    "donate.placeholder_body": "Kotak ini hanya tempat penampung - pembayaran belum bisa diterima di sini hari ini. Hubungi kami melalui \"Hubungi kami\" dan kita akan menyiapkan alur donasi yang sesungguhnya bersama-sama (misalnya kartu atau transfer bank).",
    "contact.title": "Hubungi kami",
    "contact.label.name": "Nama (opsional)",
    "contact.label.email": "Email",
    "contact.label.message": "Pesan",
    "contact.submit": "Kirim pesan",
    "contact.sending": "Mengirim…",
    "contact.sent": "Terima kasih! Pesan Anda telah disimpan dan kami akan segera menghubungi Anda.",
    "contact.err_message": "Silakan tulis pesan.",
    "contact.err_generic": "Tidak dapat mengirim pesan. Silakan coba lagi.",
  },
  tr: {
    "auth.title.login": "Tekrar hoş geldin",
    "auth.title.signup": "Hesabını oluştur",
    "auth.subtitle.login": "Oynamaya devam etmek için giriş yap",
    "auth.subtitle.signup": "Oynamaya başlamak için kaydol",
    "auth.tab.login": "Giriş yap",
    "auth.tab.signup": "Yeni hesap",
    "auth.label.email": "E-posta",
    "auth.placeholder.email": "sen@ornek.com",
    "auth.label.name": "Adın",
    "auth.placeholder.name": "Adını gir",
    "auth.label.country": "Ülke seç",
    "auth.label.password": "Şifre",
    "auth.forgot": "Şifreni mi unuttun?",
    "auth.placeholder.password": "En az 8 karakter",
    "auth.submit.login": "Giriş yap",
    "auth.submit.signup": "Hesap oluştur",
    "auth.submit.loading": "Bir saniye…",
    "auth.or": "veya şununla devam et",
    "auth.security_note": "Şifren hashlenir ve veritabanında güvenle saklanır. Şifreni asla düz metin olarak görmeyiz.",
    "auth.show_password": "Şifreyi göster",
    "auth.hide_password": "Şifreyi gizle",
    "err.email_invalid": "Geçerli bir e-posta adresi gir.",
    "err.name_short": "Adını gir (en az 2 karakter).",
    "err.password_short": "Şifre en az 8 karakter olmalı.",
    "err.email_taken": "Bu e-posta ile zaten bir hesap var. Bunun yerine giriş yap.",
    "err.login_failed": "Yanlış e-posta veya şifre.",
    "err.too_many_attempts": "Çok fazla deneme. 15 dakika bekleyip tekrar dene.",
    "err.generic": "Bir şeyler yanlış gitti. Lütfen tekrar dene.",
    "err.oauth_failed": "Giriş başarısız oldu. Lütfen tekrar dene.",
    "forgot.title": "Şifreyi sıfırla",
    "forgot.desc": "E-postanı gir, sana yeni bir şifre belirlemen için bir bağlantı gönderelim.",
    "forgot.submit": "Sıfırlama bağlantısı gönder",
    "forgot.sending": "Gönderiliyor…",
    "forgot.success": "Bu adresle bir hesap varsa, oraya bir bağlantı gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et.",
    "forgot.back": "Girişe dön",
    "reset.title": "Yeni şifre belirle",
    "reset.desc": "Hesabın için yeni bir şifre seç.",
    "reset.label": "Yeni şifre",
    "reset.submit": "Yeni şifre belirle",
    "reset.saving": "Kaydediliyor…",
    "reset.success": "Şifre güncellendi! Artık yeni şifrenle giriş yapabilirsin.",
    "reset.to_login": "Girişe git",
    "reset.expired": "Bu bağlantının süresi doldu ya da zaten kullanıldı. Yeni bir sıfırlama bağlantısı iste.",
    "ready.welcome": "Hoş geldin, {name}",
    "ready.title": "Yola çıkmaya hazır mısın?",
    "ready.questions_count": "{count} soru",
    "ready.seconds_per_q": "30 sn/soru",
    "ready.climb": "Sıralamada yüksel",
    "ready.level": "Seviye {level}",
    "ready.start": "Oyunu başlat",
    "ready.loading": "Sorular yükleniyor…",
    "ready.no_questions": "Henüz yayınlanmış soru yok",
    "ready.leaderboard_link": "Lider tablosu",
    "ready.logout": "Çıkış yap",
    "ready.err_no_questions": "Şu anda yayınlanmış soru yok. Daha sonra tekrar dene.",
    "ready.err_fetch": "Sorular yüklenemedi. Lütfen tekrar dene.",
    "quiz.question_of": "SORU {current} / {total}",
    "quiz.context_label": "BAĞLAM",
    "quiz.status.correct": "Doğru! {explanation}",
    "quiz.status.wrong": "Tam değil. Doğru cevap {answer}.",
    "quiz.status.timeout": "Süre doldu. Doğru cevap {answer}.",
    "quiz.status.prompt": "Süre dolmadan bir cevap seç.",
    "quiz.source_label": "KAYNAK",
    "quiz.read_more": "Metnin tamamını oku",
    "quiz.next_in": "Sonraki soru {seconds}sn içinde…",
    "quiz.seconds_short": "SN",
    "result.title": "İyi oynadın, {name}!",
    "result.score_summary": "{total} sorudan {correct} doğru",
    "result.points_suffix": "puan",
    "result.play_again": "Tekrar oyna",
    "result.share": "Sonucunu paylaş",
    "result.view_leaderboard": "Lider tablosunu görüntüle",
    "result.share_copied": "Kopyalandı! Paylaşmak istediğin yere yapıştır.",
    "result.share_text": "Bible Run'da {score} puan aldım ({correct}/{total} doğru)! Bunu geçebilir misin?",
    "lb.title": "LİDER TABLOSU",
    "lb.loading": "Yükleniyor…",
    "lb.empty": "Henüz kimse oynamadı. İlk sen ol!",
    "lb.leading": "Önde",
    "lb.back": "Geri",
    "footer.about": "Hakkımızda",
    "footer.donate": "Bağış gönder",
    "footer.contact": "Bize ulaşın",
    "footer.admin": "Yönetici",
    "about.title": "Bible Run hakkında",
    "about.p1": "Bible Run, zamana karşı yarıştığın ve dünyanın dört bir yanından oyuncularla rekabet ettiğin bir İncil bilgisi yarışmasıdır. Her soru gerçek İncil metnine dayanır, kaynak ve bağlamla birlikte sunulur - böylece sadece tahmin etmez, bir şeyler öğrenirsin.",
    "about.p2": "İçerik kalitesini yüksek tutmak için her soru, yayınlanmadan önce elle incelenip onaylanır.",
    "donate.title": "Bağış gönder",
    "donate.p1": "Bible Run kâr amacı gütmeyen bir yapı olarak yürütülüyor. İşleyişini ve gelişimini desteklemek istersen minnettar oluruz.",
    "donate.placeholder_title": "Ödeme henüz bağlanmadı.",
    "donate.placeholder_body": "Bu kutu bir yer tutucudur - bugün burada ödeme alınamıyor. \"Bize ulaşın\" üzerinden bize ulaş, birlikte gerçek bir bağış akışı (örneğin kart veya banka havalesi) kuralım.",
    "contact.title": "Bize ulaşın",
    "contact.label.name": "İsim (isteğe bağlı)",
    "contact.label.email": "E-posta",
    "contact.label.message": "Mesaj",
    "contact.submit": "Mesaj gönder",
    "contact.sending": "Gönderiliyor…",
    "contact.sent": "Teşekkürler! Mesajın kaydedildi, sana geri döneceğiz.",
    "contact.err_message": "Lütfen bir mesaj yaz.",
    "contact.err_generic": "Mesaj gönderilemedi. Lütfen tekrar dene.",
  },
  el: {
    "auth.title.login": "Καλώς ήρθες πάλι",
    "auth.title.signup": "Δημιούργησε τον λογαριασμό σου",
    "auth.subtitle.login": "Συνδέσου για να συνεχίσεις να παίζεις",
    "auth.subtitle.signup": "Εγγράψου για να ξεκινήσεις να παίζεις",
    "auth.tab.login": "Σύνδεση",
    "auth.tab.signup": "Νέος λογαριασμός",
    "auth.label.email": "Email",
    "auth.placeholder.email": "esy@paradeigma.com",
    "auth.label.name": "Το όνομά σου",
    "auth.placeholder.name": "Γράψε το όνομά σου",
    "auth.label.country": "Επίλεξε χώρα",
    "auth.label.password": "Κωδικός",
    "auth.forgot": "Ξέχασες τον κωδικό;",
    "auth.placeholder.password": "Τουλάχιστον 8 χαρακτήρες",
    "auth.submit.login": "Σύνδεση",
    "auth.submit.signup": "Δημιουργία λογαριασμού",
    "auth.submit.loading": "Μια στιγμή…",
    "auth.or": "ή συνέχισε με",
    "auth.security_note": "Ο κωδικός σου κρυπτογραφείται (hash) και αποθηκεύεται με ασφάλεια στη βάση δεδομένων. Δεν βλέπουμε ποτέ τον κωδικό σου σε απλό κείμενο.",
    "auth.show_password": "Εμφάνιση κωδικού",
    "auth.hide_password": "Απόκρυψη κωδικού",
    "err.email_invalid": "Εισάγετε έγκυρη διεύθυνση email.",
    "err.name_short": "Εισάγετε το όνομά σας (τουλάχιστον 2 χαρακτήρες).",
    "err.password_short": "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.",
    "err.email_taken": "Υπάρχει ήδη λογαριασμός με αυτό το email. Συνδέσου αντ' αυτού.",
    "err.login_failed": "Λανθασμένο email ή κωδικός.",
    "err.too_many_attempts": "Πολλές προσπάθειες. Περίμενε 15 λεπτά και δοκίμασε ξανά.",
    "err.generic": "Κάτι πήγε στραβά. Δοκίμασε ξανά.",
    "err.oauth_failed": "Η σύνδεση απέτυχε. Δοκίμασε ξανά.",
    "forgot.title": "Επαναφορά κωδικού",
    "forgot.desc": "Εισάγετε το email σας και θα σας στείλουμε έναν σύνδεσμο για να ορίσετε νέο κωδικό.",
    "forgot.submit": "Αποστολή συνδέσμου επαναφοράς",
    "forgot.sending": "Αποστολή…",
    "forgot.success": "Αν υπάρχει λογαριασμός με αυτή τη διεύθυνση, στείλαμε έναν σύνδεσμο εκεί. Έλεγξε τα εισερχόμενά σου (και τα ανεπιθύμητα).",
    "forgot.back": "Πίσω στη σύνδεση",
    "reset.title": "Ορισμός νέου κωδικού",
    "reset.desc": "Επίλεξε νέο κωδικό για τον λογαριασμό σου.",
    "reset.label": "Νέος κωδικός",
    "reset.submit": "Ορισμός νέου κωδικού",
    "reset.saving": "Αποθήκευση…",
    "reset.success": "Ο κωδικός ενημερώθηκε! Μπορείς τώρα να συνδεθείς με τον νέο σου κωδικό.",
    "reset.to_login": "Μετάβαση στη σύνδεση",
    "reset.expired": "Αυτός ο σύνδεσμος έχει λήξει ή έχει ήδη χρησιμοποιηθεί. Ζήτησε νέο σύνδεσμο επαναφοράς.",
    "ready.welcome": "Καλώς ήρθες, {name}",
    "ready.title": "Έτοιμος να ξεκινήσεις;",
    "ready.questions_count_one": "{count} ερώτηση",
    "ready.questions_count": "{count} ερωτήσεις",
    "ready.seconds_per_q": "30 δευτ/ερώτηση",
    "ready.climb": "Ανέβα στην κατάταξη",
    "ready.level": "Επίπεδο {level}",
    "ready.start": "Έναρξη παιχνιδιού",
    "ready.loading": "Φόρτωση ερωτήσεων…",
    "ready.no_questions": "Δεν έχουν δημοσιευτεί ερωτήσεις ακόμα",
    "ready.leaderboard_link": "Πίνακας κατάταξης",
    "ready.logout": "Αποσύνδεση",
    "ready.err_no_questions": "Δεν υπάρχουν δημοσιευμένες ερωτήσεις αυτή τη στιγμή. Δοκίμασε ξανά αργότερα.",
    "ready.err_fetch": "Δεν ήταν δυνατή η φόρτωση των ερωτήσεων. Δοκίμασε ξανά.",
    "quiz.question_of": "ΕΡΩΤΗΣΗ {current} ΑΠΟ {total}",
    "quiz.context_label": "ΠΛΑΙΣΙΟ",
    "quiz.status.correct": "Σωστά! {explanation}",
    "quiz.status.wrong": "Όχι ακριβώς. Η σωστή απάντηση είναι {answer}.",
    "quiz.status.timeout": "Ο χρόνος τελείωσε. Η σωστή απάντηση είναι {answer}.",
    "quiz.status.prompt": "Επίλεξε μια απάντηση πριν τελειώσει ο χρόνος.",
    "quiz.source_label": "ΠΗΓΗ",
    "quiz.read_more": "Διάβασε ολόκληρο το κείμενο",
    "quiz.next_in": "Επόμενη ερώτηση σε {seconds}δ…",
    "quiz.seconds_short": "ΔΕΥΤ",
    "result.title": "Έπαιξες υπέροχα, {name}!",
    "result.score_summary": "{correct} από {total} σωστές",
    "result.points_suffix": "πόντοι",
    "result.play_again": "Παίξε ξανά",
    "result.share": "Κοινοποίησε το αποτέλεσμά σου",
    "result.view_leaderboard": "Δες τον πίνακα κατάταξης",
    "result.share_copied": "Αντιγράφηκε! Επικόλλησέ το όπου θέλεις να το μοιραστείς.",
    "result.share_text": "Σκόραρα {score} πόντους ({correct}/{total} σωστές) στο Bible Run! Μπορείς να με ξεπεράσεις;",
    "lb.title": "ΠΙΝΑΚΑΣ ΚΑΤΑΤΑΞΗΣ",
    "lb.loading": "Φόρτωση…",
    "lb.empty": "Κανείς δεν έχει παίξει ακόμα. Γίνε ο πρώτος!",
    "lb.leading": "Στην κορυφή",
    "lb.back": "Πίσω",
    "footer.about": "Σχετικά με εμάς",
    "footer.donate": "Στείλε ένα δώρο",
    "footer.contact": "Επικοινωνία",
    "footer.admin": "Διαχειριστής",
    "about.title": "Σχετικά με το Bible Run",
    "about.p1": "Το Bible Run είναι ένα κουίζ γνώσεων της Βίβλου όπου τρέχεις ενάντια στον χρόνο και ανταγωνίζεσαι παίκτες από όλο τον κόσμο. Κάθε ερώτηση βασίζεται σε πραγματικό βιβλικό κείμενο, με πηγή και πλαίσιο ώστε να μαθαίνεις κάτι - όχι απλώς να μαντεύεις.",
    "about.p2": "Κάθε ερώτηση ελέγχεται και εγκρίνεται χειροκίνητα πριν δημοσιευτεί, ώστε να διατηρείται υψηλή η ποιότητα του περιεχομένου.",
    "donate.title": "Στείλε ένα δώρο",
    "donate.p1": "Το Bible Run λειτουργεί ως μη κερδοσκοπικός οργανισμός. Αν θέλεις να στηρίξεις τη λειτουργία και τη συνεχή ανάπτυξή του, θα είμαστε ευγνώμονες.",
    "donate.placeholder_title": "Οι πληρωμές δεν έχουν συνδεθεί ακόμα.",
    "donate.placeholder_body": "Αυτό το πλαίσιο είναι προσωρινό - καμία πληρωμή δεν μπορεί να ληφθεί εδώ σήμερα. Επικοινώνησε μαζί μας μέσω \"Επικοινωνία\" και θα στήσουμε μαζί μια πραγματική διαδικασία δωρεάς (π.χ. κάρτα ή τραπεζικό έμβασμα).",
    "contact.title": "Επικοινωνία",
    "contact.label.name": "Όνομα (προαιρετικό)",
    "contact.label.email": "Email",
    "contact.label.message": "Μήνυμα",
    "contact.submit": "Αποστολή μηνύματος",
    "contact.sending": "Αποστολή…",
    "contact.sent": "Ευχαριστούμε! Το μήνυμά σου αποθηκεύτηκε και θα επικοινωνήσουμε σύντομα.",
    "contact.err_message": "Παρακαλώ γράψε ένα μήνυμα.",
    "contact.err_generic": "Δεν ήταν δυνατή η αποστολή του μηνύματος. Δοκίμασε ξανά.",
  },
  sw: {
    "auth.title.login": "Karibu tena",
    "auth.title.signup": "Fungua akaunti yako",
    "auth.subtitle.login": "Ingia ili kuendelea kucheza",
    "auth.subtitle.signup": "Jisajili ili kuanza kucheza",
    "auth.tab.login": "Ingia",
    "auth.tab.signup": "Akaunti mpya",
    "auth.label.email": "Barua pepe",
    "auth.placeholder.email": "wewe@mfano.com",
    "auth.label.name": "Jina lako",
    "auth.placeholder.name": "Andika jina lako",
    "auth.label.country": "Chagua nchi",
    "auth.label.password": "Nenosiri",
    "auth.forgot": "Umesahau nenosiri?",
    "auth.placeholder.password": "Angalau herufi 8",
    "auth.submit.login": "Ingia",
    "auth.submit.signup": "Fungua akaunti",
    "auth.submit.loading": "Subiri kidogo…",
    "auth.or": "au endelea na",
    "auth.security_note": "Nenosiri lako lina-hashiwa na kuhifadhiwa kwa usalama katika hifadhidata. Hatuoni kamwe nenosiri lako kama maandishi wazi.",
    "auth.show_password": "Onyesha nenosiri",
    "auth.hide_password": "Ficha nenosiri",
    "err.email_invalid": "Weka anwani sahihi ya barua pepe.",
    "err.name_short": "Weka jina lako (angalau herufi 2).",
    "err.password_short": "Nenosiri lazima liwe na angalau herufi 8.",
    "err.email_taken": "Akaunti yenye barua pepe hii tayari ipo. Ingia badala yake.",
    "err.login_failed": "Barua pepe au nenosiri sio sahihi.",
    "err.too_many_attempts": "Majaribio mengi mno. Subiri dakika 15 kisha jaribu tena.",
    "err.generic": "Hitilafu imetokea. Tafadhali jaribu tena.",
    "err.oauth_failed": "Kuingia hakukufanikiwa. Tafadhali jaribu tena.",
    "forgot.title": "Weka upya nenosiri",
    "forgot.desc": "Weka barua pepe yako na tutakutumia kiungo cha kuweka nenosiri jipya.",
    "forgot.submit": "Tuma kiungo cha kuweka upya",
    "forgot.sending": "Inatuma…",
    "forgot.success": "Ikiwa akaunti ipo na anwani hii, tumetuma kiungo huko. Angalia kikasha chako (na spam).",
    "forgot.back": "Rudi kuingia",
    "reset.title": "Weka nenosiri jipya",
    "reset.desc": "Chagua nenosiri jipya kwa akaunti yako.",
    "reset.label": "Nenosiri jipya",
    "reset.submit": "Weka nenosiri jipya",
    "reset.saving": "Inahifadhi…",
    "reset.success": "Nenosiri limesasishwa! Sasa unaweza kuingia kwa nenosiri lako jipya.",
    "reset.to_login": "Nenda kuingia",
    "reset.expired": "Kiungo hiki kimeisha muda au kimeshatumika. Omba kiungo kipya cha kuweka upya.",
    "ready.welcome": "Karibu, {name}",
    "ready.title": "Uko tayari kuanza?",
    "ready.questions_count_one": "Swali {count}",
    "ready.questions_count": "Maswali {count}",
    "ready.seconds_per_q": "sekunde 30/swali",
    "ready.climb": "Panda katika orodha",
    "ready.level": "Kiwango {level}",
    "ready.start": "Anza mchezo",
    "ready.loading": "Inapakia maswali…",
    "ready.no_questions": "Hakuna maswali yaliyochapishwa bado",
    "ready.leaderboard_link": "Ubao wa viongozi",
    "ready.logout": "Toka",
    "ready.err_no_questions": "Hakuna maswali yaliyochapishwa kwa sasa. Jaribu tena baadaye.",
    "ready.err_fetch": "Imeshindwa kupakia maswali. Tafadhali jaribu tena.",
    "quiz.question_of": "SWALI {current} KATI YA {total}",
    "quiz.context_label": "MUKTADHA",
    "quiz.status.correct": "Sahihi! {explanation}",
    "quiz.status.wrong": "Sio sahihi kabisa. Jibu sahihi ni {answer}.",
    "quiz.status.timeout": "Muda umeisha. Jibu sahihi ni {answer}.",
    "quiz.status.prompt": "Chagua jibu kabla ya muda kuisha.",
    "quiz.source_label": "CHANZO",
    "quiz.read_more": "Soma maandishi yote",
    "quiz.next_in": "Swali linalofuata baada ya sekunde {seconds}…",
    "quiz.seconds_short": "SEK",
    "result.title": "Umecheza vizuri, {name}!",
    "result.score_summary": "{correct} kati ya {total} sahihi",
    "result.points_suffix": "pointi",
    "result.play_again": "Cheza tena",
    "result.share": "Shiriki matokeo yako",
    "result.view_leaderboard": "Angalia ubao wa viongozi",
    "result.share_copied": "Imenakiliwa! Bandika mahali unapotaka kushiriki.",
    "result.share_text": "Nilipata pointi {score} ({correct}/{total} sahihi) katika Bible Run! Unaweza kunizidi?",
    "lb.title": "UBAO WA VIONGOZI",
    "lb.loading": "Inapakia…",
    "lb.empty": "Hakuna aliyecheza bado. Kuwa wa kwanza!",
    "lb.leading": "Kiongozi",
    "lb.back": "Rudi",
    "footer.about": "Kuhusu sisi",
    "footer.donate": "Tuma zawadi",
    "footer.contact": "Wasiliana nasi",
    "footer.admin": "Msimamizi",
    "about.title": "Kuhusu Bible Run",
    "about.p1": "Bible Run ni jaribio la maarifa ya Biblia ambapo unashindana na muda na wachezaji kutoka duniani kote. Kila swali linatokana na maandiko halisi ya Biblia, likiwa na chanzo na muktadha ili ujifunze kitu - si kubahatisha tu.",
    "about.p2": "Kila swali linakaguliwa na kuidhinishwa kwa mkono kabla ya kuchapishwa, ili kudumisha ubora wa juu wa maudhui.",
    "donate.title": "Tuma zawadi",
    "donate.p1": "Bible Run inaendeshwa kama shirika lisilo la faida. Ukitaka kusaidia uendeshaji na maendeleo yake yanayoendelea, tutashukuru.",
    "donate.placeholder_title": "Malipo hayajaunganishwa bado.",
    "donate.placeholder_body": "Kisanduku hiki ni nafasi tu - malipo hayawezi kupokelewa hapa leo. Wasiliana nasi kupitia \"Wasiliana nasi\" na tutaweka pamoja mfumo halisi wa michango (mfano kadi au uhamisho wa benki).",
    "contact.title": "Wasiliana nasi",
    "contact.label.name": "Jina (si lazima)",
    "contact.label.email": "Barua pepe",
    "contact.label.message": "Ujumbe",
    "contact.submit": "Tuma ujumbe",
    "contact.sending": "Inatuma…",
    "contact.sent": "Asante! Ujumbe wako umehifadhiwa na tutawasiliana nawe hivi karibuni.",
    "contact.err_message": "Tafadhali andika ujumbe.",
    "contact.err_generic": "Imeshindwa kutuma ujumbe. Tafadhali jaribu tena.",
  },
};

function translate(lang, key, vars) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let resolvedKey = key;
  if (vars && typeof vars.count === "number") {
    let category = "other";
    try {
      category = new Intl.PluralRules(lang).select(vars.count);
    } catch {
      category = vars.count === 1 ? "one" : "other";
    }
    const pluralKey = `${key}_${category}`;
    if (dict[pluralKey] !== undefined) resolvedKey = pluralKey;
  }
  let text = dict[resolvedKey] ?? dict[key] ?? TRANSLATIONS.en[resolvedKey] ?? TRANSLATIONS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}

function detectBrowserLang() {
  try {
    const candidates = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    for (const raw of candidates) {
      if (!raw) continue;
      const code = raw.toLowerCase().split("-")[0];
      if (TRANSLATIONS[code]) return code;
    }
  } catch {
    // navigator otillgänglig - kör standardspråk
  }
  return "en";
}

function loadLang() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && TRANSLATIONS[stored]) return stored;
  } catch {
    // localStorage otillgängligt - kör standardspråk
  }
  return detectBrowserLang();
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
  const [revealCountdown, setRevealCountdown] = useState(0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);

  const timerRef = useRef(null);
  const revealRef = useRef(null);

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
  const [outreachMaxCountries, setOutreachMaxCountries] = useState(5);
  const [outreachMaxEmails, setOutreachMaxEmails] = useState(20);
  const [outreachConfigSaving, setOutreachConfigSaving] = useState(false);
  const [outreachConfigSaved, setOutreachConfigSaved] = useState(false);
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
        try {
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
        } catch (err) {
          if (err.message.includes("too_many_attempts")) {
            setAuthError(t("err.too_many_attempts"));
          } else {
            throw err;
          }
        }
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
        body: JSON.stringify({ p_email: cleanEmail, p_lang: lang }),
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
        setScreen("ready");
        setLoadingQuiz(false);
        return;
      }
      setQuestions(buildQuizSet(qs, QUIZ_LENGTH));
      setQIndex(0);
      setScore(0);
      setCorrectCount(0);
      setSelected(null);
      setLocked(false);
      setTimeLeft(QUESTION_SECONDS);
      setScreen("quiz");
    } catch (err) {
      setReadyError(err.message || t("ready.err_fetch"));
      setScreen("ready");
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

      setRevealCountdown(REVEAL_SECONDS);
      let remaining = REVEAL_SECONDS;
      clearInterval(revealRef.current);
      revealRef.current = setInterval(() => {
        remaining -= 1;
        setRevealCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(revealRef.current);
          if (qIndex + 1 < questions.length) {
            setQIndex((i) => i + 1);
            setSelected(null);
            setLocked(false);
            setTimeLeft(QUESTION_SECONDS);
          } else {
            finishGame(newScore, newCorrect);
          }
        }
      }, 1000);
    },
    [locked, questions, qIndex, timeLeft, score, correctCount]
  );

  useEffect(() => () => clearInterval(revealRef.current), []);

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
    loadPlayerStats(player.id);
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

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const rows = await sb("leaderboard?select=*&order=best_score.desc&limit=10");
      setLeaderboard(rows);
    } catch {
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  async function openLeaderboard() {
    setScreen("leaderboard");
    fetchLeaderboard();
  }

  useEffect(() => {
    if (player?.id) fetchLeaderboard();
  }, [player?.id, fetchLeaderboard]);

  useEffect(() => {
    if (screen === "result" && player?.id) fetchLeaderboard();
  }, [screen, player?.id, fetchLeaderboard]);

  useEffect(() => {
    if (screen !== "ready") return;
    sb("questions?status=eq.approved&is_active=eq.true&select=id")
      .then((rows) => setActiveQuestionCount(rows.length))
      .catch(() => setActiveQuestionCount(null));
  }, [screen]);

  const loadPlayerStats = useCallback(async (playerId) => {
    try {
      const rows = await sb("rpc/get_player_stats", {
        method: "POST",
        body: JSON.stringify({ p_player_id: playerId }),
      });
      setPlayerStats(rows?.[0] || null);
    } catch {
      setPlayerStats(null);
    }
  }, []);

  useEffect(() => {
    if (player?.id) loadPlayerStats(player.id);
    else setPlayerStats(null);
  }, [player?.id, loadPlayerStats]);

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
    } catch (err) {
      setAdminError(err.message?.includes("too_many_attempts") ? "För många felaktiga försök. Vänta 15 minuter och försök igen." : "Fel kod.");
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
      const [res, configRows] = await Promise.all([
        fetch(`${SUPABASE_URL}/functions/v1/admin-outreach`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
          body: JSON.stringify({ passcode: adminPasscode }),
        }),
        sb("rpc/admin_get_outreach_config", {
          method: "POST",
          body: JSON.stringify({ p_passcode: adminPasscode }),
        }),
      ]);
      if (!res.ok) throw new Error(`Kunde inte hämta kyrko-kontakter (${res.status})`);
      const data = await res.json();
      setOutreachSegments(data.segments || []);
      setOutreachDomains(data.domains || []);
      if (configRows?.[0]) {
        setOutreachMaxCountries(configRows[0].max_countries_per_batch);
        setOutreachMaxEmails(configRows[0].max_emails_per_day);
      }
      setOutreachLoaded(true);
    } catch (err) {
      setOutreachError(err.message || "Kunde inte hämta kyrko-kontakter.");
    } finally {
      setOutreachLoading(false);
    }
  }

  async function saveOutreachConfig() {
    setOutreachConfigSaving(true);
    setOutreachError("");
    setOutreachConfigSaved(false);
    try {
      const rows = await sb("rpc/admin_update_outreach_config", {
        method: "POST",
        body: JSON.stringify({
          p_passcode: adminPasscode,
          p_max_countries: Number(outreachMaxCountries),
          p_max_emails: Number(outreachMaxEmails),
        }),
      });
      if (rows?.[0]) {
        setOutreachMaxCountries(rows[0].max_countries_per_batch);
        setOutreachMaxEmails(rows[0].max_emails_per_day);
      }
      setOutreachConfigSaved(true);
      setTimeout(() => setOutreachConfigSaved(false), 2500);
    } catch (err) {
      setOutreachError(err.message || "Kunde inte spara inställningarna.");
    } finally {
      setOutreachConfigSaving(false);
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

  const heroLevel = playerStats ? levelFromScore(playerStats.total_score) : 1;
  const heroXpIntoLevel = playerStats ? (playerStats.total_score % LEVEL_SCORE_STEP) : 0;
  const showSidebar = player && !["auth", "resetPassword", "leaderboard"].includes(screen);

  return (
    <Backdrop>
      <div dir={RTL_LANGS.has(lang) ? "rtl" : "ltr"} className="mx-auto flex h-full max-h-screen w-full max-w-6xl flex-col overflow-y-auto px-5 py-6">
        <header className="mb-6 flex-none text-center">
          <div className="mb-2 flex justify-center">
            <Crown className="h-9 w-9 text-amber-400" />
          </div>
          <h1 className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-5xl font-bold tracking-wide text-transparent">
            BIBLE RUN
          </h1>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 font-sans text-xs">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => changeLang(l.code)}
                aria-pressed={lang === l.code}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${lang === l.code ? "border-amber-400 bg-amber-500/20 text-amber-200" : "border-amber-800/40 text-amber-300/60 hover:text-amber-200"}`}
              >
                <FlagIcon code={LANG_TO_COUNTRY[l.code]} /> {l.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex w-full flex-1 flex-col items-center justify-center gap-6 lg:flex-row lg:items-center">
        <div className="w-full lg:max-w-[640px]">

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

        {screen === "ready" && player && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-amber-700/40 bg-slate-950/96 p-6 text-center shadow-2xl lg:max-w-[640px] lg:p-8">
            <p className="flex items-center justify-center gap-1.5 font-sans text-sm text-amber-300">{t("ready.welcome", { name: player.display_name })} <FlagIcon code={playerCountry?.code} /></p>
            {playerStats && (
              <p className="mt-1 flex items-center justify-center gap-1 font-sans text-xs font-semibold text-amber-400">
                <Crown className="h-3.5 w-3.5" /> {t("ready.level", { level: heroLevel })}
                <span className="text-slate-500">· {heroXpIntoLevel}/{LEVEL_SCORE_STEP} XP</span>
              </p>
            )}
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

        {screen === "quiz" && q && (
          <div className="mx-auto w-full max-w-[560px] rounded-2xl border-2 border-amber-600/70 bg-slate-950/92 p-6 shadow-2xl lg:max-w-[640px] lg:p-8">
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
              <div className="mt-3 rounded-r-md border-l-2 border-amber-500 bg-slate-900/70 px-3 py-2 lg:px-4 lg:py-3">
                <span className="font-sans text-[10px] font-bold tracking-widest text-amber-400 lg:text-xs">{t("quiz.context_label")}</span>
                <p className="mt-1 font-sans text-xs leading-relaxed text-slate-300 lg:text-sm">{q.context}</p>
              </div>
            )}

            <h3 className="my-4 text-center font-serif text-lg font-semibold leading-snug lg:text-2xl">{q.question}</h3>

            <div className="grid grid-cols-1 gap-2 font-sans sm:grid-cols-2 lg:gap-3">
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
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition lg:px-4 lg:py-3.5 lg:text-base ${cls}`}
                  >
                    <span className="grid h-6 w-6 flex-none place-content-center rounded-full border border-amber-500/60 text-xs text-amber-300 lg:h-7 lg:w-7 lg:text-sm">
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
              className={`mt-3 min-h-[1.4em] text-center font-sans text-xs font-semibold lg:text-sm ${
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

            {locked && revealCountdown > 0 && (
              <p className="mt-3 text-center font-sans text-[11px] text-slate-500">
                {t("quiz.next_in", { seconds: revealCountdown })}
              </p>
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
              <GoldButton onClick={startGame} disabled={loadingQuiz}>
                {loadingQuiz ? t("ready.loading") : t("result.play_again")}
              </GoldButton>
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
              return (
                <div className="mb-4 flex flex-col items-center gap-1 rounded-xl border-2 border-amber-400 bg-gradient-to-b from-amber-950/60 to-slate-900/60 px-4 py-4 text-center shadow-lg shadow-amber-900/30">
                  <Crown className="h-7 w-7 text-amber-300" />
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-amber-400">{t("lb.leading")}</p>
                  <p className="flex items-center justify-center gap-1.5 font-serif text-lg font-bold text-amber-100"><FlagIcon code={leader.country_code} /> {leader.display_name}</p>
                  <p className="font-serif text-2xl font-bold text-amber-400">{leader.best_score} {t("result.points_suffix")}</p>
                </div>
              );
            })()}

            <ol className="space-y-2 font-sans text-sm">
              {leaderboard.map((row, i) => {
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
                      <FlagIcon code={row.country_code} />
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

        {showSidebar && (
          <aside className="hidden w-full flex-none lg:block lg:w-[300px]">
            <div className="rounded-2xl border border-amber-700/40 bg-slate-950/96 p-5 shadow-2xl">
              <h2 className="mb-1 flex items-center gap-1.5 text-center font-serif text-base font-bold tracking-wide">
                <Medal className="h-4 w-4 text-amber-400" /> {t("lb.title")}
              </h2>
              <Divider />
              {leaderboardLoading && <p className="text-center font-sans text-xs text-slate-400">{t("lb.loading")}</p>}
              {!leaderboardLoading && leaderboard.length === 0 && (
                <p className="text-center font-sans text-xs text-slate-400">{t("lb.empty")}</p>
              )}
              {!leaderboardLoading && leaderboard.length > 0 && (
                <ol className="space-y-1.5 font-sans text-xs">
                  {leaderboard.slice(0, 5).map((row, i) => {
                    const rank = i + 1;
                    const medalStyle =
                      rank === 1 ? "border-amber-300 bg-amber-400 text-slate-950"
                      : rank === 2 ? "border-slate-300 bg-slate-300/90 text-slate-950"
                      : rank === 3 ? "border-orange-700 bg-orange-700/80 text-white"
                      : "border-amber-800/30 bg-slate-800 text-amber-300";
                    return (
                      <li key={row.player_id} className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${rank <= 3 ? "border-amber-500/40 bg-slate-900/70" : "border-amber-800/30 bg-slate-900/50"}`}>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className={`grid h-5 w-5 flex-none place-content-center rounded-full border text-[10px] font-bold ${medalStyle}`}>
                            {rank}
                          </span>
                          <FlagIcon code={row.country_code} />
                          <span className={`truncate ${row.player_id === player?.id ? "font-bold text-amber-300" : ""}`}>{row.display_name}</span>
                        </span>
                        <span className="flex-none text-amber-400">{row.best_score}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              <button type="button"
                onClick={openLeaderboard}
                className="mt-3 w-full rounded-lg border border-amber-600/50 py-2 font-sans text-xs text-amber-200 hover:bg-amber-900/20"
              >
                {t("result.view_leaderboard")}
              </button>
            </div>
          </aside>
        )}
        </main>

        <footer className="mt-6 flex-none">
          <FooterNav onSelect={openFooterModal} t={t} />
        </footer>
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

                  <div className="rounded-lg border border-amber-700/30 bg-slate-900/40 p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400">Gränser för agenten</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] text-slate-400">Länder per omgång</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={outreachMaxCountries}
                          onChange={(e) => setOutreachMaxCountries(e.target.value)}
                          className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-2.5 py-1.5 text-sm text-amber-50 outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-slate-400">Mejl per dag</label>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={outreachMaxEmails}
                          onChange={(e) => setOutreachMaxEmails(e.target.value)}
                          className="w-full rounded-md border border-amber-700/50 bg-slate-950/70 px-2.5 py-1.5 text-sm text-amber-50 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                    <button type="button"
                      onClick={saveOutreachConfig}
                      disabled={outreachConfigSaving}
                      className="mt-3 w-full rounded-lg bg-gradient-to-b from-amber-300 to-amber-500 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                    >
                      {outreachConfigSaving ? "Sparar…" : outreachConfigSaved ? "Sparat ✓" : "Spara gränser"}
                    </button>
                    <p className="mt-2 text-[10px] text-slate-500">
                      Dessa gränser lagras och kommer respekteras av det faktiska utskicksflödet när det byggs. Gränserna ändrar inget om vad som skickas eller när - "skicka nu" krävs fortfarande alltid.
                    </p>
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
