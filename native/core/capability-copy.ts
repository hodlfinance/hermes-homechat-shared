import type { AppLocale } from "./types";

// Shared existing capabilities wording for both product clients.
export type CapabilityCopy = {
    title: string;
    subtitle: string;
    serviceReachTitle: string;
    serviceReachDescription: string;
    panelDescription: string;
    checking: string;
    emptyTitle: string;
    emptyBody: string;
    askHermes: string;
    serviceReachChecked: (date: string) => string;
    checked: (date: string) => string;
    categories: Readonly<Record<"ai" | "messaging" | "email" | "workspace" | "memory" | "tasks" | "custom", string>>;
  };
const catalog: Record<AppLocale, CapabilityCopy> = {
"en": {
      title: "Capabilities",
      subtitle: "Hermes-native status and suggested entry points.",
      serviceReachTitle: "Service reach",
      serviceReachDescription: "Reached means Hermes read provider-backed evidence. The displayed time comes from the provider.",
      panelDescription: "Hermes-native entry points and live status hints. Deep setup stays in Hermes.",
      checking: "Checking…",
      emptyTitle: "Capabilities are not loaded yet",
      emptyBody: "Open this page or refresh to ask Hermes for the current native status.",
      askHermes: "Ask Hermes",
      serviceReachChecked: (date) => `Checked ${date}. Refresh reads the services again.`,
      checked: (date) => `Checked ${date}. Unknown means Hey Hermes could not verify the Hermes-native state right now.`,
      categories: { ai: "AI", messaging: "Messaging", email: "Email", workspace: "Workspace", memory: "Memory", tasks: "Tasks", custom: "Custom" },
    },
"de": {
      title: "Fähigkeiten",
      subtitle: "Hermes-eigener Status und vorgeschlagene Einstiegspunkte.",
      serviceReachTitle: "Erreichbarkeit der Dienste",
      serviceReachDescription: "Erreicht heisst, Hermes hat Belege vom Anbieter selbst gelesen. Die angezeigte Zeit kommt vom Anbieter.",
      panelDescription: "Hermes-eigene Einstiegspunkte und Statushinweise. Die tiefe Einrichtung bleibt in Hermes.",
      checking: "Wird geprüft…",
      emptyTitle: "Die Fähigkeiten sind noch nicht geladen",
      emptyBody: "Öffne diese Seite oder aktualisiere sie, um Hermes nach dem aktuellen eigenen Status zu fragen.",
      askHermes: "Hermes fragen",
      serviceReachChecked: (date) => `Geprüft ${date}. Aktualisieren liest die Dienste erneut.`,
      checked: (date) => `Geprüft ${date}. Unbekannt heisst, Hey Hermes konnte den Hermes-eigenen Zustand gerade nicht bestätigen.`,
      categories: { ai: "KI", messaging: "Nachrichten", email: "E-Mail", workspace: "Workspace", memory: "Memory", tasks: "Aufgaben", custom: "Eigene" },
    },
"fr": {
      title: "Fonctions",
      subtitle: "État natif Hermes et points d'entrée suggérés.",
      serviceReachTitle: "Accessibilité des services",
      serviceReachDescription: "Atteint signifie qu'Hermes a lu des preuves fournies par le service. L'heure affichée vient du service.",
      panelDescription: "Points d'entrée natifs d'Hermes et indications d'état. La configuration détaillée reste dans Hermes.",
      checking: "Vérification…",
      emptyTitle: "Les fonctions ne sont pas encore chargées",
      emptyBody: "Ouvrez cette page ou actualisez-la pour demander à Hermes son état natif actuel.",
      askHermes: "Demander à Hermes",
      serviceReachChecked: (date) => `Vérifié ${date}. Actualiser relit les services.`,
      checked: (date) => `Vérifié ${date}. Inconnu signifie qu'Hey Hermes n'a pas pu confirmer l'état natif d'Hermes pour l'instant.`,
      categories: { ai: "IA", messaging: "Messagerie", email: "E-mail", workspace: "Espace de travail", memory: "Mémoire", tasks: "Taches", custom: "Personnalise" },
    },
"es": {
      title: "Funciones",
      subtitle: "Estado nativo de Hermes y puntos de entrada sugeridos.",
      serviceReachTitle: "Alcance de los servicios",
      serviceReachDescription: "Alcanzado significa que Hermes leyó evidencia del propio proveedor. La hora mostrada viene del proveedor.",
      panelDescription: "Puntos de entrada nativos de Hermes e indicios de estado. La configuración a fondo se queda en Hermes.",
      checking: "Comprobando…",
      emptyTitle: "Las funciones aún no se han cargado",
      emptyBody: "Abre esta página o actualízala para preguntar a Hermes por su estado nativo actual.",
      askHermes: "Preguntar a Hermes",
      serviceReachChecked: (date) => `Comprobado ${date}. Actualizar vuelve a leer los servicios.`,
      checked: (date) => `Comprobado ${date}. Desconocido significa que Hey Hermes no pudo confirmar ahora el estado nativo de Hermes.`,
      categories: { ai: "IA", messaging: "Mensajería", email: "Correo", workspace: "Espacio de trabajo", memory: "Memoria", tasks: "Tareas", custom: "Personalizadas" },
    },
"it": {
      title: "Funzioni",
      subtitle: "Stato nativo di Hermes e punti d'ingresso suggeriti.",
      serviceReachTitle: "Raggiungibilità dei servizi",
      serviceReachDescription: "Raggiunto significa che Hermes ha letto prove fornite dal servizio. L'orario mostrato viene dal servizio.",
      panelDescription: "Punti d'ingresso nativi di Hermes e indicazioni di stato. La configurazione approfondita resta in Hermes.",
      checking: "Verifica…",
      emptyTitle: "Le funzioni non sono ancora caricate",
      emptyBody: "Apri questa pagina o aggiornala per chiedere a Hermes lo stato nativo attuale.",
      askHermes: "Chiedi a Hermes",
      serviceReachChecked: (date) => `Verificato ${date}. Aggiorna rilegge i servizi.`,
      checked: (date) => `Verificato ${date}. Sconosciuto significa che Hey Hermes non ha potuto confermare ora lo stato nativo di Hermes.`,
      categories: { ai: "IA", messaging: "Messaggistica", email: "E-mail", workspace: "Spazio di lavoro", memory: "Memoria", tasks: "Attivita", custom: "Personalizzate" },
    },
"pt-BR": {
      title: "Recursos",
      subtitle: "Status nativo do Hermes e pontos de entrada sugeridos.",
      serviceReachTitle: "Alcance dos serviços",
      serviceReachDescription: "Alcançado significa que o Hermes leu evidências do próprio provedor. O horário exibido vem do provedor.",
      panelDescription: "Pontos de entrada nativos do Hermes e indicações de status. A configuração detalhada fica no Hermes.",
      checking: "Verificando…",
      emptyTitle: "Os recursos ainda não foram carregados",
      emptyBody: "Abra esta página ou atualize-a para perguntar ao Hermes o status nativo atual.",
      askHermes: "Perguntar ao Hermes",
      serviceReachChecked: (date) => `Verificado ${date}. Atualizar lê os serviços de novo.`,
      checked: (date) => `Verificado ${date}. Desconhecido significa que o Hey Hermes não conseguiu confirmar agora o estado nativo do Hermes.`,
      categories: { ai: "IA", messaging: "Mensagens", email: "E-mail", workspace: "Espaço de trabalho", memory: "Memória", tasks: "Tarefas", custom: "Personalizados" },
    },
"ja": {
      title: "機能",
      subtitle: "Hermes 本体のステータスと、おすすめの入口です。",
      serviceReachTitle: "サービスへの到達",
      serviceReachDescription: "到達とは、Hermes が提供元の裏づけを読んだという意味です。表示される時刻は提供元のものです。",
      panelDescription: "Hermes 本体の入口と、その時々のステータスの手がかりです。詳しい設定は Hermes 側に残ります。",
      checking: "確認中…",
      emptyTitle: "機能はまだ読み込まれていません",
      emptyBody: "このページを開くか更新して、Hermes に今の本体ステータスを尋ねてください。",
      askHermes: "Hermes に聞く",
      serviceReachChecked: (date) => `${date} に確認しました。更新するとサービスを読み直します。`,
      checked: (date) => `${date} に確認しました。不明とは、Hey Hermes が今 Hermes 本体の状態を確認できなかったという意味です。`,
      categories: { ai: "AI", messaging: "メッセージ", email: "メール", workspace: "ワークスペース", memory: "メモリ", tasks: "タスク", custom: "カスタム" },
    },
"ko": {
      title: "기능",
      subtitle: "Hermes 자체 상태와 추천 진입점입니다.",
      serviceReachTitle: "서비스 연결 상태",
      serviceReachDescription: "연결됨은 Hermes가 제공자의 근거를 직접 읽었다는 뜻입니다. 표시되는 시각은 제공자의 것입니다.",
      panelDescription: "Hermes 자체 진입점과 현재 상태 힌트입니다. 자세한 설정은 Hermes에 남습니다.",
      checking: "확인하는 중…",
      emptyTitle: "기능을 아직 불러오지 않았습니다",
      emptyBody: "이 페이지를 열거나 새로 고쳐 Hermes에 현재 자체 상태를 물어보세요.",
      askHermes: "Hermes에게 묻기",
      serviceReachChecked: (date) => `${date}에 확인했습니다. 새로 고치면 서비스를 다시 읽습니다.`,
      checked: (date) => `${date}에 확인했습니다. 알 수 없음은 Hey Hermes가 지금 Hermes 자체 상태를 확인하지 못했다는 뜻입니다.`,
      categories: { ai: "AI", messaging: "메시지", email: "메일", workspace: "워크스페이스", memory: "메모리", tasks: "작업", custom: "사용자 지정" },
    }
};
export function capabilityCopy(locale: AppLocale): CapabilityCopy { return catalog[locale]; }

const statusCatalog = {
  "en": {
    "current": "Current",
    "available": "Available",
    "needs_attention": "Needs attention",
    "suggested": "Suggested",
    "active": "Active",
    "unavailable": "Unavailable",
    "unknown": "Unknown",
    "refresh": "Refresh capabilities"
  },
  "de": {
    "current": "Aktuell",
    "available": "Verfügbar",
    "needs_attention": "Prüfen",
    "suggested": "Vorgeschlagen",
    "active": "Aktiv",
    "unavailable": "Nicht verfügbar",
    "unknown": "Unbekannt",
    "refresh": "Funktionen aktualisieren"
  },
  "fr": {
    "current": "Actuel",
    "available": "Disponible",
    "needs_attention": "À vérifier",
    "suggested": "Suggéré",
    "active": "Actif",
    "unavailable": "Indisponible",
    "unknown": "Inconnu",
    "refresh": "Actualiser les capacités"
  },
  "es": {
    "current": "Actual",
    "available": "Disponible",
    "needs_attention": "Necesita atención",
    "suggested": "Sugerido",
    "active": "Activo",
    "unavailable": "No disponible",
    "unknown": "Desconocido",
    "refresh": "Actualizar capacidades"
  },
  "it": {
    "current": "Attuale",
    "available": "Disponibile",
    "needs_attention": "Da verificare",
    "suggested": "Suggerito",
    "active": "Attivo",
    "unavailable": "Non disponibile",
    "unknown": "Sconosciuto",
    "refresh": "Aggiorna funzionalità"
  },
  "pt-BR": {
    "current": "Atual",
    "available": "Disponível",
    "needs_attention": "Precisa de atenção",
    "suggested": "Sugerido",
    "active": "Ativo",
    "unavailable": "Indisponível",
    "unknown": "Desconhecido",
    "refresh": "Atualizar recursos"
  },
  "ja": {
    "current": "現在",
    "available": "利用可能",
    "needs_attention": "要確認",
    "suggested": "提案",
    "active": "有効",
    "unavailable": "利用不可",
    "unknown": "不明",
    "refresh": "機能を更新"
  },
  "ko": {
    "current": "현재",
    "available": "사용 가능",
    "needs_attention": "확인 필요",
    "suggested": "제안됨",
    "active": "활성",
    "unavailable": "사용 불가",
    "unknown": "알 수 없음",
    "refresh": "기능 새로고침"
  }
};
export function capabilityStatusCopy(locale: AppLocale) { return statusCatalog[locale]; }
