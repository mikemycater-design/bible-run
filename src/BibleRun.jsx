import { useState, useEffect, useRef, useCallback } from "react";
import { Crown, BookOpen, Timer, Trophy, LogOut, Check, X, Medal, Eye, EyeOff, Mail, Lock, User, ShieldCheck, Globe2, ChevronRight } from "lucide-react";

const SUPABASE_URL = "https://mhgnikriicjamwmxdjdg.supabase.co";
const SUPABASE_KEY = "sb_publishable_qZQ3fm0Xs6uFGEMYg-RoSg_g-PktFsf";
const QUESTION_SECONDS = 30;
const REVEAL_SECONDS = 6;

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
};

const LEVEL_SCORE_STEP = 500;

function levelFromScore(totalScore) {
  return Math.floor((totalScore || 0) / LEVEL_SCORE_STEP) + 1;
}

const LANG_KEY = "bible_run_lang";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "no", label: "Norsk", flag: "🇳🇴" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "tl", label: "Filipino", flag: "🇵🇭" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
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
};

function translate(lang, key, vars) {
  let text = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
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
        setScreen("ready");
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

  const heroLevel = playerStats ? levelFromScore(playerStats.total_score) : 1;
  const heroXpIntoLevel = playerStats ? (playerStats.total_score % LEVEL_SCORE_STEP) : 0;
  const showSidebar = player && !["auth", "resetPassword", "leaderboard"].includes(screen);

  return (
    <Backdrop>
      <div className="mx-auto flex h-full max-h-screen w-full max-w-6xl flex-col overflow-y-auto px-5 py-6">
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
