import type { AppLocale } from "./types";

/**
 * HPD-876. What Hermes is doing, in the customer's language.
 *
 * Until now the live line knew six fixed states ("Working", "Writing a
 * reply", ...) and otherwise passed Hermes' own English phrase through. That
 * phrase is English, capped at 49 characters by Hermes
 * (`agent/display.py:build_status_phrase`), and for every product tool it only
 * says "is using <tool>", which this module used to collapse to "Working".
 *
 * This table is the one place that turns a tool or a phase into a verb. It is
 * keyed, not worded: the runtime and the plane never send prose for it, and
 * each surface looks the key up in the locale the customer chose. It is shared
 * by Hey and HODL through this package.
 *
 * What never enters this table is a tool's input or result. A verb and a tool's
 * display name are all a customer sees in the foreground (the rule in
 * hey-hermes `docs/hermes-default-deviations.md`: no private reasoning, no tool
 * inputs). Phase 2 of HPD-874 may add fields to the event, never prose here.
 */
export const heyActivityVerbKeys = [
  "thinking",
  "writing",
  "reading",
  "searching",
  "updating",
  "checkingMemory",
  "searchingWeb",
  "browsing",
  "searchingFiles",
  "writingFile",
  "runningCommand",
  "runningCode",
  "readingSkill",
  "updatingSkill",
  "searchingPastChats",
  "updatingMemory",
  "updatingTasks",
  "scheduling",
  "delegating",
  "askingYou",
  "lookingAtImage",
  "creatingMedia",
  "readingPortfolio",
  "checkingPrices",
  "searchingResearch",
  "checkingWatchlist",
  "checkingFinance",
  "readingEmail",
  "writingEmail",
  "checkingCalendar",
  "readingDrive",
  "startingPage",
  "summarizing",
  "compacting",
  "usingTool",
] as const;

export type HeyActivityVerbKey = (typeof heyActivityVerbKeys)[number];

/** The tool a step used, by display name only. Never an argument. */
export const heyActivityToolKeys = [
  "web",
  "browser",
  "files",
  "terminal",
  "code",
  "skills",
  "pastChats",
  "memory",
  "tasks",
  "scheduler",
  "subtask",
  "image",
  "portfolio",
  "marketData",
  "research",
  "watchlist",
  "finance",
  "gmail",
  "calendar",
  "drive",
  "page",
  "context",
] as const;

export type HeyActivityToolKey = (typeof heyActivityToolKeys)[number];

export type HeyActivityStep = {
  verbKey: HeyActivityVerbKey;
  toolKey: HeyActivityToolKey | null;
};

type VerbCopy = Readonly<Record<HeyActivityVerbKey, string>>;
type ToolCopy = Readonly<Record<HeyActivityToolKey, string>>;

const verbCopy: Readonly<Record<AppLocale, VerbCopy>> = {
  en: {
    thinking: "Thinking",
    writing: "Writing the reply",
    reading: "Reading",
    searching: "Searching",
    updating: "Updating",
    checkingMemory: "Checking memory",
    searchingWeb: "Searching the web",
    browsing: "Browsing",
    searchingFiles: "Searching files",
    writingFile: "Writing a file",
    runningCommand: "Running a command",
    runningCode: "Running code",
    readingSkill: "Reading a skill",
    updatingSkill: "Updating a skill",
    searchingPastChats: "Searching past chats",
    updatingMemory: "Updating memory",
    updatingTasks: "Updating tasks",
    scheduling: "Scheduling",
    delegating: "Starting a background task",
    askingYou: "Asking you",
    lookingAtImage: "Looking at the image",
    creatingMedia: "Creating media",
    readingPortfolio: "Reading your portfolio",
    checkingPrices: "Checking prices",
    searchingResearch: "Searching research",
    checkingWatchlist: "Checking your watchlist",
    checkingFinance: "Checking finance data",
    readingEmail: "Reading email",
    writingEmail: "Writing an email",
    checkingCalendar: "Checking your calendar",
    readingDrive: "Reading documents",
    startingPage: "Starting a page",
    summarizing: "Summarizing",
    compacting: "Compacting the history",
    usingTool: "Using a tool",
  },
  de: {
    thinking: "Denkt nach",
    writing: "Schreibt die Antwort",
    reading: "Liest",
    searching: "Sucht",
    updating: "Aktualisiert",
    checkingMemory: "Prüft das Gedächtnis",
    searchingWeb: "Sucht im Web",
    browsing: "Surft",
    searchingFiles: "Durchsucht Dateien",
    writingFile: "Schreibt Datei",
    runningCommand: "Führt einen Befehl aus",
    runningCode: "Führt Code aus",
    readingSkill: "Liest eine Fähigkeit",
    updatingSkill: "Aktualisiert eine Fähigkeit",
    searchingPastChats: "Durchsucht frühere Chats",
    updatingMemory: "Aktualisiert das Gedächtnis",
    updatingTasks: "Aktualisiert Aufgaben",
    scheduling: "Plant einen Termin",
    delegating: "Startet einen Hintergrundauftrag",
    askingYou: "Fragt dich",
    lookingAtImage: "Sieht sich das Bild an",
    creatingMedia: "Erstellt Medien",
    readingPortfolio: "Liest dein Portfolio",
    checkingPrices: "Prüft Kurse",
    searchingResearch: "Sucht Recherche",
    checkingWatchlist: "Prüft deine Watchlist",
    checkingFinance: "Prüft Finanzdaten",
    readingEmail: "Liest E-Mails",
    writingEmail: "Schreibt eine E-Mail",
    checkingCalendar: "Prüft deinen Kalender",
    readingDrive: "Liest Dokumente",
    startingPage: "Startet Seite",
    summarizing: "Fasst zusammen",
    compacting: "Verdichtet den Verlauf",
    usingTool: "Nutzt ein Werkzeug",
  },
  fr: {
    thinking: "Réfléchit",
    writing: "Rédige la réponse",
    reading: "Lit",
    searching: "Cherche",
    updating: "Met à jour",
    checkingMemory: "Consulte la mémoire",
    searchingWeb: "Cherche sur le web",
    browsing: "Navigue",
    searchingFiles: "Cherche dans les fichiers",
    writingFile: "Écrit un fichier",
    runningCommand: "Exécute une commande",
    runningCode: "Exécute du code",
    readingSkill: "Lit une compétence",
    updatingSkill: "Met à jour une compétence",
    searchingPastChats: "Cherche dans les anciens chats",
    updatingMemory: "Met à jour la mémoire",
    updatingTasks: "Met à jour les tâches",
    scheduling: "Planifie",
    delegating: "Lance une tâche de fond",
    askingYou: "Te pose une question",
    lookingAtImage: "Regarde l’image",
    creatingMedia: "Crée un média",
    readingPortfolio: "Lit ton portefeuille",
    checkingPrices: "Vérifie les cours",
    searchingResearch: "Cherche des analyses",
    checkingWatchlist: "Vérifie ta liste de suivi",
    checkingFinance: "Vérifie les données financières",
    readingEmail: "Lit les e-mails",
    writingEmail: "Rédige un e-mail",
    checkingCalendar: "Vérifie ton agenda",
    readingDrive: "Lit des documents",
    startingPage: "Lance une page",
    summarizing: "Résume",
    compacting: "Condense l’historique",
    usingTool: "Utilise un outil",
  },
  es: {
    thinking: "Pensando",
    writing: "Escribiendo la respuesta",
    reading: "Leyendo",
    searching: "Buscando",
    updating: "Actualizando",
    checkingMemory: "Consultando la memoria",
    searchingWeb: "Buscando en la web",
    browsing: "Navegando",
    searchingFiles: "Buscando en archivos",
    writingFile: "Escribiendo un archivo",
    runningCommand: "Ejecutando un comando",
    runningCode: "Ejecutando código",
    readingSkill: "Leyendo una habilidad",
    updatingSkill: "Actualizando una habilidad",
    searchingPastChats: "Buscando en chats anteriores",
    updatingMemory: "Actualizando la memoria",
    updatingTasks: "Actualizando tareas",
    scheduling: "Programando",
    delegating: "Iniciando una tarea en segundo plano",
    askingYou: "Preguntándote",
    lookingAtImage: "Mirando la imagen",
    creatingMedia: "Creando contenido",
    readingPortfolio: "Leyendo tu cartera",
    checkingPrices: "Consultando cotizaciones",
    searchingResearch: "Buscando análisis",
    checkingWatchlist: "Revisando tu lista de seguimiento",
    checkingFinance: "Consultando datos financieros",
    readingEmail: "Leyendo correos",
    writingEmail: "Escribiendo un correo",
    checkingCalendar: "Revisando tu calendario",
    readingDrive: "Leyendo documentos",
    startingPage: "Iniciando una página",
    summarizing: "Resumiendo",
    compacting: "Condensando el historial",
    usingTool: "Usando una herramienta",
  },
  it: {
    thinking: "Sta pensando",
    writing: "Scrive la risposta",
    reading: "Sta leggendo",
    searching: "Sta cercando",
    updating: "Aggiorna",
    checkingMemory: "Consulta la memoria",
    searchingWeb: "Cerca sul web",
    browsing: "Sta navigando",
    searchingFiles: "Cerca nei file",
    writingFile: "Scrive un file",
    runningCommand: "Esegue un comando",
    runningCode: "Esegue codice",
    readingSkill: "Legge una competenza",
    updatingSkill: "Aggiorna una competenza",
    searchingPastChats: "Cerca nelle chat precedenti",
    updatingMemory: "Aggiorna la memoria",
    updatingTasks: "Aggiorna le attività",
    scheduling: "Pianifica",
    delegating: "Avvia un’attività in background",
    askingYou: "Ti fa una domanda",
    lookingAtImage: "Guarda l’immagine",
    creatingMedia: "Crea contenuti",
    readingPortfolio: "Legge il tuo portafoglio",
    checkingPrices: "Controlla le quotazioni",
    searchingResearch: "Cerca analisi",
    checkingWatchlist: "Controlla la tua watchlist",
    checkingFinance: "Controlla i dati finanziari",
    readingEmail: "Legge le email",
    writingEmail: "Scrive un’email",
    checkingCalendar: "Controlla il tuo calendario",
    readingDrive: "Legge documenti",
    startingPage: "Avvia una pagina",
    summarizing: "Riassume",
    compacting: "Condensa la cronologia",
    usingTool: "Usa uno strumento",
  },
  "pt-BR": {
    thinking: "Pensando",
    writing: "Escrevendo a resposta",
    reading: "Lendo",
    searching: "Pesquisando",
    updating: "Atualizando",
    checkingMemory: "Consultando a memória",
    searchingWeb: "Pesquisando na web",
    browsing: "Navegando",
    searchingFiles: "Pesquisando arquivos",
    writingFile: "Escrevendo um arquivo",
    runningCommand: "Executando um comando",
    runningCode: "Executando código",
    readingSkill: "Lendo uma habilidade",
    updatingSkill: "Atualizando uma habilidade",
    searchingPastChats: "Pesquisando conversas anteriores",
    updatingMemory: "Atualizando a memória",
    updatingTasks: "Atualizando tarefas",
    scheduling: "Agendando",
    delegating: "Iniciando uma tarefa em segundo plano",
    askingYou: "Perguntando a você",
    lookingAtImage: "Olhando a imagem",
    creatingMedia: "Criando mídia",
    readingPortfolio: "Lendo sua carteira",
    checkingPrices: "Verificando cotações",
    searchingResearch: "Pesquisando análises",
    checkingWatchlist: "Verificando sua lista de acompanhamento",
    checkingFinance: "Verificando dados financeiros",
    readingEmail: "Lendo e-mails",
    writingEmail: "Escrevendo um e-mail",
    checkingCalendar: "Verificando sua agenda",
    readingDrive: "Lendo documentos",
    startingPage: "Iniciando uma página",
    summarizing: "Resumindo",
    compacting: "Condensando o histórico",
    usingTool: "Usando uma ferramenta",
  },
  ja: {
    thinking: "考え中",
    writing: "回答を作成中",
    reading: "読み込み中",
    searching: "検索中",
    updating: "更新中",
    checkingMemory: "メモリを確認中",
    searchingWeb: "ウェブを検索中",
    browsing: "ブラウズ中",
    searchingFiles: "ファイルを検索中",
    writingFile: "ファイルを作成中",
    runningCommand: "コマンドを実行中",
    runningCode: "コードを実行中",
    readingSkill: "スキルを確認中",
    updatingSkill: "スキルを更新中",
    searchingPastChats: "過去のチャットを検索中",
    updatingMemory: "メモリを更新中",
    updatingTasks: "タスクを更新中",
    scheduling: "予定を設定中",
    delegating: "バックグラウンドタスクを開始中",
    askingYou: "確認しています",
    lookingAtImage: "画像を確認中",
    creatingMedia: "メディアを作成中",
    readingPortfolio: "ポートフォリオを確認中",
    checkingPrices: "株価を確認中",
    searchingResearch: "リサーチを検索中",
    checkingWatchlist: "ウォッチリストを確認中",
    checkingFinance: "金融データを確認中",
    readingEmail: "メールを確認中",
    writingEmail: "メールを作成中",
    checkingCalendar: "カレンダーを確認中",
    readingDrive: "ドキュメントを確認中",
    startingPage: "ページを起動中",
    summarizing: "要約中",
    compacting: "履歴を圧縮中",
    usingTool: "ツールを使用中",
  },
  ko: {
    thinking: "생각 중",
    writing: "답변 작성 중",
    reading: "읽는 중",
    searching: "검색 중",
    updating: "업데이트 중",
    checkingMemory: "메모리 확인 중",
    searchingWeb: "웹 검색 중",
    browsing: "탐색 중",
    searchingFiles: "파일 검색 중",
    writingFile: "파일 작성 중",
    runningCommand: "명령 실행 중",
    runningCode: "코드 실행 중",
    readingSkill: "스킬 확인 중",
    updatingSkill: "스킬 업데이트 중",
    searchingPastChats: "이전 채팅 검색 중",
    updatingMemory: "메모리 업데이트 중",
    updatingTasks: "할 일 업데이트 중",
    scheduling: "일정 설정 중",
    delegating: "백그라운드 작업 시작 중",
    askingYou: "질문하는 중",
    lookingAtImage: "이미지 확인 중",
    creatingMedia: "미디어 생성 중",
    readingPortfolio: "포트폴리오 확인 중",
    checkingPrices: "시세 확인 중",
    searchingResearch: "리서치 검색 중",
    checkingWatchlist: "관심 종목 확인 중",
    checkingFinance: "금융 데이터 확인 중",
    readingEmail: "이메일 확인 중",
    writingEmail: "이메일 작성 중",
    checkingCalendar: "캘린더 확인 중",
    readingDrive: "문서 확인 중",
    startingPage: "페이지 시작 중",
    summarizing: "요약 중",
    compacting: "기록 압축 중",
    usingTool: "도구 사용 중",
  },
};

const toolCopy: Readonly<Record<AppLocale, ToolCopy>> = {
  en: {
    web: "Web search", browser: "Browser", files: "Files", terminal: "Terminal", code: "Code",
    skills: "Skills", pastChats: "Past chats", memory: "Memory", tasks: "Tasks", scheduler: "Schedule",
    subtask: "Background task", image: "Image", portfolio: "Portfolio", marketData: "Market data",
    research: "Research", watchlist: "Watchlist", finance: "Finance data", gmail: "Gmail",
    calendar: "Google Calendar", drive: "Google Drive", page: "Page", context: "Chat history",
  },
  de: {
    web: "Websuche", browser: "Browser", files: "Dateien", terminal: "Terminal", code: "Code",
    skills: "Fähigkeiten", pastChats: "Frühere Chats", memory: "Gedächtnis", tasks: "Aufgaben", scheduler: "Zeitplan",
    subtask: "Hintergrundauftrag", image: "Bild", portfolio: "Portfolio", marketData: "Marktdaten",
    research: "Recherche", watchlist: "Watchlist", finance: "Finanzdaten", gmail: "Gmail",
    calendar: "Google Kalender", drive: "Google Drive", page: "Seite", context: "Chatverlauf",
  },
  fr: {
    web: "Recherche web", browser: "Navigateur", files: "Fichiers", terminal: "Terminal", code: "Code",
    skills: "Compétences", pastChats: "Anciens chats", memory: "Mémoire", tasks: "Tâches", scheduler: "Planning",
    subtask: "Tâche de fond", image: "Image", portfolio: "Portefeuille", marketData: "Données de marché",
    research: "Analyses", watchlist: "Liste de suivi", finance: "Données financières", gmail: "Gmail",
    calendar: "Google Agenda", drive: "Google Drive", page: "Page", context: "Historique du chat",
  },
  es: {
    web: "Búsqueda web", browser: "Navegador", files: "Archivos", terminal: "Terminal", code: "Código",
    skills: "Habilidades", pastChats: "Chats anteriores", memory: "Memoria", tasks: "Tareas", scheduler: "Programación",
    subtask: "Tarea en segundo plano", image: "Imagen", portfolio: "Cartera", marketData: "Datos de mercado",
    research: "Análisis", watchlist: "Lista de seguimiento", finance: "Datos financieros", gmail: "Gmail",
    calendar: "Google Calendar", drive: "Google Drive", page: "Página", context: "Historial del chat",
  },
  it: {
    web: "Ricerca web", browser: "Browser", files: "File", terminal: "Terminale", code: "Codice",
    skills: "Competenze", pastChats: "Chat precedenti", memory: "Memoria", tasks: "Attività", scheduler: "Pianificazione",
    subtask: "Attività in background", image: "Immagine", portfolio: "Portafoglio", marketData: "Dati di mercato",
    research: "Analisi", watchlist: "Watchlist", finance: "Dati finanziari", gmail: "Gmail",
    calendar: "Google Calendar", drive: "Google Drive", page: "Pagina", context: "Cronologia della chat",
  },
  "pt-BR": {
    web: "Pesquisa na web", browser: "Navegador", files: "Arquivos", terminal: "Terminal", code: "Código",
    skills: "Habilidades", pastChats: "Conversas anteriores", memory: "Memória", tasks: "Tarefas", scheduler: "Agenda",
    subtask: "Tarefa em segundo plano", image: "Imagem", portfolio: "Carteira", marketData: "Dados de mercado",
    research: "Análises", watchlist: "Lista de acompanhamento", finance: "Dados financeiros", gmail: "Gmail",
    calendar: "Google Agenda", drive: "Google Drive", page: "Página", context: "Histórico da conversa",
  },
  ja: {
    web: "ウェブ検索", browser: "ブラウザ", files: "ファイル", terminal: "ターミナル", code: "コード",
    skills: "スキル", pastChats: "過去のチャット", memory: "メモリ", tasks: "タスク", scheduler: "スケジュール",
    subtask: "バックグラウンドタスク", image: "画像", portfolio: "ポートフォリオ", marketData: "市場データ",
    research: "リサーチ", watchlist: "ウォッチリスト", finance: "金融データ", gmail: "Gmail",
    calendar: "Google カレンダー", drive: "Google ドライブ", page: "ページ", context: "チャット履歴",
  },
  ko: {
    web: "웹 검색", browser: "브라우저", files: "파일", terminal: "터미널", code: "코드",
    skills: "스킬", pastChats: "이전 채팅", memory: "메모리", tasks: "할 일", scheduler: "일정",
    subtask: "백그라운드 작업", image: "이미지", portfolio: "포트폴리오", marketData: "시장 데이터",
    research: "리서치", watchlist: "관심 종목", finance: "금융 데이터", gmail: "Gmail",
    calendar: "Google 캘린더", drive: "Google 드라이브", page: "페이지", context: "채팅 기록",
  },
};

function copyLocale(locale: string | null | undefined): AppLocale {
  return locale && Object.prototype.hasOwnProperty.call(verbCopy, locale) ? (locale as AppLocale) : "en";
}

export function heyActivityVerbText(verbKey: HeyActivityVerbKey, locale: string | null | undefined): string {
  return verbCopy[copyLocale(locale)][verbKey];
}

export function heyActivityToolText(toolKey: HeyActivityToolKey, locale: string | null | undefined): string {
  return toolCopy[copyLocale(locale)][toolKey];
}

/**
 * The live line under the verb: "verb · tool". When the verb above already
 * says the same thing, only the tool is left, and when there is nothing more
 * to say than the line above, there is no second line.
 */
export function heyActivityStepText(
  step: HeyActivityStep,
  locale: string | null | undefined,
  headlineVerbKey: HeyActivityVerbKey | null = null,
): string | null {
  const tool = step.toolKey ? heyActivityToolText(step.toolKey, locale) : null;
  if (headlineVerbKey === step.verbKey) return tool;
  const verb = heyActivityVerbText(step.verbKey, locale);
  return tool ? `${verb} · ${tool}` : verb;
}

// Hermes' own phrase for its built-in tools (`agent/display.py:_TOOL_VERBS`
// at the pinned d0625482), lower-cased and after its "is ". Longest first,
// because "is reading skill" must not be read as "is reading".
const hermesPhraseSteps: ReadonlyArray<readonly [string, HeyActivityVerbKey, HeyActivityToolKey | null]> = [
  ["searching past sessions", "searchingPastChats", "pastChats"],
  ["looking at the image", "lookingAtImage", "image"],
  ["searching the web", "searchingWeb", "web"],
  ["generating speech", "creatingMedia", null],
  ["generating image", "creatingMedia", null],
  ["generating video", "creatingMedia", null],
  ["updating memory", "updatingMemory", "memory"],
  ["searching files", "searchingFiles", "files"],
  ["updating skill", "updatingSkill", "skills"],
  ["updating tasks", "updatingTasks", "tasks"],
  ["listing skills", "readingSkill", "skills"],
  ["reading skill", "readingSkill", "skills"],
  ["running code", "runningCode", "code"],
  ["delegating", "delegating", "subtask"],
  ["scheduling", "scheduling", "scheduler"],
  ["browsing", "browsing", "browser"],
  ["clicking", "browsing", "browser"],
  ["editing", "writingFile", "files"],
  ["writing", "writingFile", "files"],
  ["reading", "reading", null],
  ["running", "runningCommand", "terminal"],
  ["typing", "browsing", "browser"],
  ["asking", "askingYou", null],
];

const TOOL_NAME = /^[a-z][a-z0-9_]{1,80}$/;

/**
 * The step for one tool name: Hermes' built-ins, the product's own plugin
 * tools, and connected finance tools by what their name says they touch.
 * An unknown tool has no step, so it never reaches the customer by name.
 */
export function heyActivityStepForTool(rawTool: string): HeyActivityStep | null {
  const lowered = String(rawTool ?? "").trim().toLowerCase();
  // `mcp__server__read_content` says what it does in its last segment.
  const tool = lowered.replace(/^mcp__[a-z0-9_]*?__/, "");
  if (!TOOL_NAME.test(tool)) return null;
  const builtIn: Record<string, HeyActivityStep> = {
    web_search: { verbKey: "searchingWeb", toolKey: "web" },
    web_extract: { verbKey: "reading", toolKey: "web" },
    browser_navigate: { verbKey: "browsing", toolKey: "browser" },
    browser_click: { verbKey: "browsing", toolKey: "browser" },
    browser_type: { verbKey: "browsing", toolKey: "browser" },
    browser_snapshot: { verbKey: "browsing", toolKey: "browser" },
    read_file: { verbKey: "reading", toolKey: "files" },
    write_file: { verbKey: "writingFile", toolKey: "files" },
    patch: { verbKey: "writingFile", toolKey: "files" },
    search_files: { verbKey: "searchingFiles", toolKey: "files" },
    terminal: { verbKey: "runningCommand", toolKey: "terminal" },
    process: { verbKey: "runningCommand", toolKey: "terminal" },
    execute_code: { verbKey: "runningCode", toolKey: "code" },
    image_generate: { verbKey: "creatingMedia", toolKey: null },
    video_generate: { verbKey: "creatingMedia", toolKey: null },
    text_to_speech: { verbKey: "creatingMedia", toolKey: null },
    vision_analyze: { verbKey: "lookingAtImage", toolKey: "image" },
    session_search: { verbKey: "searchingPastChats", toolKey: "pastChats" },
    workspace_history: { verbKey: "searchingPastChats", toolKey: "pastChats" },
    skill_view: { verbKey: "readingSkill", toolKey: "skills" },
    skills_list: { verbKey: "readingSkill", toolKey: "skills" },
    skill_manage: { verbKey: "updatingSkill", toolKey: "skills" },
    delegate_task: { verbKey: "delegating", toolKey: "subtask" },
    cronjob: { verbKey: "scheduling", toolKey: "scheduler" },
    heyhermes_manual_cron_run: { verbKey: "scheduling", toolKey: "scheduler" },
    clarify: { verbKey: "askingYou", toolKey: null },
    memory: { verbKey: "updatingMemory", toolKey: "memory" },
    todo: { verbKey: "updatingTasks", toolKey: "tasks" },
    tasks_create: { verbKey: "updatingTasks", toolKey: "tasks" },
    tasks_update: { verbKey: "updatingTasks", toolKey: "tasks" },
    finance_tool_execute: { verbKey: "checkingFinance", toolKey: "finance" },
    google_gmail_read: { verbKey: "readingEmail", toolKey: "gmail" },
    google_gmail_message: { verbKey: "readingEmail", toolKey: "gmail" },
    google_gmail_draft: { verbKey: "writingEmail", toolKey: "gmail" },
    google_gmail_send: { verbKey: "writingEmail", toolKey: "gmail" },
    google_calendar_read: { verbKey: "checkingCalendar", toolKey: "calendar" },
    google_calendar_create: { verbKey: "scheduling", toolKey: "calendar" },
    google_drive_read: { verbKey: "readingDrive", toolKey: "drive" },
    google_drive_write: { verbKey: "writingFile", toolKey: "drive" },
  };
  const exact = builtIn[tool];
  if (exact) return exact;
  if (tool.startsWith("ranked_tasks_")) return { verbKey: "updatingTasks", toolKey: "tasks" };
  if (tool.startsWith("browser_")) return { verbKey: "browsing", toolKey: "browser" };
  if (/watchlist/.test(tool)) return { verbKey: "checkingWatchlist", toolKey: "watchlist" };
  if (/portfolio|position|holding/.test(tool)) return { verbKey: "readingPortfolio", toolKey: "portfolio" };
  if (/quote|price|ticker|market|chart|trending/.test(tool)) return { verbKey: "checkingPrices", toolKey: "marketData" };
  if (/research|news|filing|analyst|earning/.test(tool)) return { verbKey: "searchingResearch", toolKey: "research" };
  if (/(?:page|site)_(?:start|publish|deploy|create|open)|(?:start|publish|deploy|create|open)_(?:page|site)/.test(tool)) {
    return { verbKey: "startingPage", toolKey: "page" };
  }
  if (/summar/.test(tool)) return { verbKey: "summarizing", toolKey: null };
  return null;
}

/**
 * The step inside Hermes' own status phrase ("is searching the web…",
 * "is using finance_tool_execute…"). Only the verb part is read; whatever
 * preview Hermes appended after it is never returned.
 */
export function heyActivityStepFromHermesPhrase(content: string): HeyActivityStep | null {
  const text = String(content ?? "").trim();
  if (/^(?:\S{1,3}\s*)?(?:compacting|compressing)\s+(?:the\s+)?(?:context|conversation|history)\b/iu.test(text)) {
    return { verbKey: "compacting", toolKey: "context" };
  }
  const normalized = text.replace(/(?:…|\.\.\.)$/, "").trim().toLowerCase();
  if (!normalized.startsWith("is ")) return null;
  const phrase = normalized.slice(3);
  const using = phrase.match(/^using ([a-z0-9_]+)$/);
  if (using) return heyActivityStepForTool(using[1] ?? "");
  const match = hermesPhraseSteps.find(([prefix]) => phrase === prefix || phrase.startsWith(`${prefix} `));
  return match ? { verbKey: match[1], toolKey: match[2] } : null;
}

/**
 * A tool name from the child-run completion receipt the runtime has sent since
 * HPD-629 ("web_search finished in 3.2s.", "terminal hit an obstacle: …").
 * Only the tool name and the measured duration are read; the obstacle text
 * after the colon is the tool's own output and is never returned.
 */
export function heyActivityCompletionFromReceipt(content: string): {
  tool: string;
  ok: boolean;
  durationMs: number | null;
} | null {
  const text = String(content ?? "").trim();
  const finished = text.match(/^([A-Za-z0-9_.:/-]{1,120}) finished(?: in (\d+(?:\.\d+)?)s)?\.$/);
  if (finished) {
    const seconds = finished[2] ? Number(finished[2]) : NaN;
    return {
      tool: finished[1] ?? "",
      ok: true,
      durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null,
    };
  }
  const failed = text.match(/^([A-Za-z0-9_.:/-]{1,120}) hit an obstacle\b/);
  if (failed) return { tool: failed[1] ?? "", ok: false, durationMs: null };
  return null;
}
