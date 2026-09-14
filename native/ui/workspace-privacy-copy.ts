import type { AppLocale, WorkspaceServerIdentity } from "../core/index";

export type PrivacyCopy = {
  title: string;
  body: string;
  support: string;
  details: string;
  provider: string;
  serverId: string;
  workspaceMachineId: string;
  ip: string;
  location: string;
  serverType: string;
  allocatedVcpu: string;
  allocatedMemory: string;
  allocatedStorage: string;
  inServiceSince: string;
  unavailable: string;
  policy: string;
  close: string;
};

type PrivacyWords = Omit<PrivacyCopy, "body"> & { vpsBody: string; microVmBody: string };

const words: Record<AppLocale, PrivacyWords> = {
  en: { title: "Privacy", vpsBody: "Your personal content is protected on your own virtual private server (VPS). You decide who can access it.", microVmBody: "Your personal content is protected inside your own isolated virtual machine. You decide who can access it.", support: "Hey Hermes handles operations and backups. Support access requires your approval.", details: "Private environment details", provider: "Provider", serverId: "Server ID", workspaceMachineId: "Workspace machine ID", ip: "IP address", location: "Location", serverType: "Environment type", allocatedVcpu: "Allocated vCPU", allocatedMemory: "Allocated memory", allocatedStorage: "Allocated private storage", inServiceSince: "In service since", unavailable: "Not available", policy: "Privacy policy", close: "Close" },
  de: { title: "Datenschutz", vpsBody: "Deine persönlichen Inhalte sind auf deinem eigenen virtuellen privaten Server (VPS) geschützt. Du bestimmst, wer darauf zugreifen darf.", microVmBody: "Deine persönlichen Inhalte sind in deiner eigenen isolierten virtuellen Maschine geschützt. Du bestimmst, wer darauf zugreifen darf.", support: "Hey Hermes übernimmt Betrieb und Backups. Supportzugriff erfolgt nur mit deiner Freigabe.", details: "Details der privaten Umgebung", provider: "Anbieter", serverId: "Server-ID", workspaceMachineId: "Workspace-Maschinen-ID", ip: "IP-Adresse", location: "Standort", serverType: "Umgebungstyp", allocatedVcpu: "Zugewiesene vCPU", allocatedMemory: "Zugewiesener Arbeitsspeicher", allocatedStorage: "Zugewiesener privater Speicher", inServiceSince: "In Betrieb seit", unavailable: "Nicht verfügbar", policy: "Datenschutzerklärung", close: "Schließen" },
  fr: { title: "Confidentialité", vpsBody: "Vos contenus personnels sont protégés sur votre propre serveur privé virtuel (VPS). Vous décidez qui peut y accéder.", microVmBody: "Vos contenus personnels sont protégés dans votre propre machine virtuelle isolée. Vous décidez qui peut y accéder.", support: "Hey Hermes assure le fonctionnement et les sauvegardes. Le support ne peut y accéder qu’avec votre accord.", details: "Détails de l’environnement privé", provider: "Fournisseur", serverId: "Identifiant du serveur", workspaceMachineId: "Identifiant de la machine de l’espace", ip: "Adresse IP", location: "Emplacement", serverType: "Type d’environnement", allocatedVcpu: "vCPU alloué", allocatedMemory: "Mémoire allouée", allocatedStorage: "Stockage privé alloué", inServiceSince: "En service depuis", unavailable: "Indisponible", policy: "Politique de confidentialité", close: "Fermer" },
  es: { title: "Privacidad", vpsBody: "Tu contenido personal está protegido en tu propio servidor privado virtual (VPS). Tú decides quién puede acceder.", microVmBody: "Tu contenido personal está protegido dentro de tu propia máquina virtual aislada. Tú decides quién puede acceder.", support: "Hey Hermes se encarga del funcionamiento y las copias de seguridad. El soporte solo accede con tu autorización.", details: "Detalles del entorno privado", provider: "Proveedor", serverId: "ID del servidor", workspaceMachineId: "ID de la máquina del espacio", ip: "Dirección IP", location: "Ubicación", serverType: "Tipo de entorno", allocatedVcpu: "vCPU asignada", allocatedMemory: "Memoria asignada", allocatedStorage: "Almacenamiento privado asignado", inServiceSince: "En servicio desde", unavailable: "No disponible", policy: "Política de privacidad", close: "Cerrar" },
  it: { title: "Privacy", vpsBody: "I tuoi contenuti personali sono protetti sul tuo server privato virtuale (VPS). Decidi tu chi può accedervi.", microVmBody: "I tuoi contenuti personali sono protetti nella tua macchina virtuale isolata. Decidi tu chi può accedervi.", support: "Hey Hermes si occupa della gestione e dei backup. L’assistenza accede solo con la tua autorizzazione.", details: "Dettagli dell’ambiente privato", provider: "Fornitore", serverId: "ID server", workspaceMachineId: "ID macchina dello spazio", ip: "Indirizzo IP", location: "Posizione", serverType: "Tipo di ambiente", allocatedVcpu: "vCPU assegnata", allocatedMemory: "Memoria assegnata", allocatedStorage: "Archiviazione privata assegnata", inServiceSince: "In servizio dal", unavailable: "Non disponibile", policy: "Informativa sulla privacy", close: "Chiudi" },
  "pt-BR": { title: "Privacidade", vpsBody: "Seu conteúdo pessoal está protegido no seu próprio servidor virtual privado (VPS). Você decide quem pode acessá-lo.", microVmBody: "Seu conteúdo pessoal está protegido dentro da sua própria máquina virtual isolada. Você decide quem pode acessá-lo.", support: "O Hey Hermes cuida da operação e dos backups. O suporte só acessa com sua autorização.", details: "Detalhes do ambiente privado", provider: "Provedor", serverId: "ID do servidor", workspaceMachineId: "ID da máquina do espaço", ip: "Endereço IP", location: "Localização", serverType: "Tipo de ambiente", allocatedVcpu: "vCPU alocada", allocatedMemory: "Memória alocada", allocatedStorage: "Armazenamento privado alocado", inServiceSince: "Em serviço desde", unavailable: "Não disponível", policy: "Política de privacidade", close: "Fechar" },
  ja: { title: "プライバシー", vpsBody: "あなたの個人的なコンテンツは、あなた専用の仮想プライベートサーバー（VPS）で保護されています。誰がアクセスできるかは、あなたが決めます。", microVmBody: "あなたの個人的なコンテンツは、あなた専用の隔離された仮想マシン内で保護されています。誰がアクセスできるかは、あなたが決めます。", support: "Hey Hermesが運用とバックアップを行います。サポートによるアクセスには、あなたの許可が必要です。", details: "プライベート環境の情報", provider: "プロバイダー", serverId: "サーバーID", workspaceMachineId: "ワークスペースマシンID", ip: "IPアドレス", location: "所在地", serverType: "環境の種類", allocatedVcpu: "割り当てvCPU", allocatedMemory: "割り当てメモリ", allocatedStorage: "割り当てプライベートストレージ", inServiceSince: "利用開始日", unavailable: "利用不可", policy: "プライバシーポリシー", close: "閉じる" },
  ko: { title: "개인정보 보호", vpsBody: "개인 콘텐츠는 전용 가상 사설 서버(VPS)에서 보호됩니다. 누가 접근할 수 있는지는 직접 결정합니다.", microVmBody: "개인 콘텐츠는 전용으로 격리된 가상 머신 안에서 보호됩니다. 누가 접근할 수 있는지는 직접 결정합니다.", support: "Hey Hermes가 운영과 백업을 담당합니다. 지원팀은 사용자의 승인하에만 접근합니다.", details: "개인 환경 정보", provider: "제공업체", serverId: "서버 ID", workspaceMachineId: "워크스페이스 머신 ID", ip: "IP 주소", location: "위치", serverType: "환경 유형", allocatedVcpu: "할당된 vCPU", allocatedMemory: "할당된 메모리", allocatedStorage: "할당된 개인 저장공간", inServiceSince: "서비스 시작일", unavailable: "사용할 수 없음", policy: "개인정보 처리방침", close: "닫기" },
};

const unconfirmed: Record<AppLocale, string> = {
  en: "Your server assignment is not confirmed here yet. Server information may still be loading or unavailable. This view does not confirm where your workspace content is stored. See the privacy policy for data processing and backups.",
  de: "Deine Serverzuordnung ist hier noch nicht bestätigt. Die Serverinformationen werden möglicherweise noch geladen oder sind nicht verfügbar. Diese Ansicht bestätigt nicht, wo deine Workspace-Inhalte gespeichert sind. Informationen zu Datenverarbeitung und Backups stehen in der Datenschutzerklärung.",
  fr: "L’attribution de votre serveur n’est pas encore confirmée ici. Les informations peuvent être en cours de chargement ou indisponibles. Cette vue ne confirme pas où votre contenu est stocké. Consultez la politique pour le traitement des données et les sauvegardes.",
  es: "La asignación de tu servidor aún no está confirmada aquí. La información puede estar cargándose o no estar disponible. Esta vista no confirma dónde se guarda tu contenido. Consulta la política sobre el procesamiento de datos y las copias de seguridad.",
  it: "L’assegnazione del server non è ancora confermata qui. Le informazioni potrebbero essere in caricamento o non disponibili. Questa vista non conferma dove sono conservati i contenuti. Consulta l’informativa per trattamento dei dati e backup.",
  "pt-BR": "A atribuição do seu servidor ainda não foi confirmada aqui. As informações podem estar carregando ou indisponíveis. Esta tela não confirma onde o conteúdo está armazenado. Consulte a política sobre processamento de dados e backups.",
  ja: "ここではサーバーの割り当てがまだ確認されていません。情報の読み込み中、または利用できない可能性があります。この画面ではコンテンツの保存場所を確認できません。データ処理とバックアップについてはプライバシーポリシーをご覧ください。",
  ko: "이 화면에서는 서버 할당이 아직 확인되지 않았습니다. 정보를 불러오는 중이거나 사용할 수 없을 수 있습니다. 이 화면은 콘텐츠의 저장 위치를 확인해 주지 않습니다. 데이터 처리 및 백업은 개인정보 처리방침을 참고하세요.",
};

export function workspacePrivacyHasServer(identity: WorkspaceServerIdentity | null, workspaceId: string) {
  return Boolean(identity?.confirmed && identity.workspaceId === workspaceId);
}

export function workspacePrivacyCopy(locale: AppLocale, hosting: WorkspaceServerIdentity["hostingKind"] | boolean = "unconfirmed"): PrivacyCopy {
  const source = words[locale];
  const hostingKind = hosting === true ? "dedicated_vps" : hosting === false ? "unconfirmed" : hosting;
  const body = hostingKind === "dedicated_vps" ? source.vpsBody : hostingKind === "firecracker_microvm" ? source.microVmBody : unconfirmed[locale];
  const { vpsBody: _vpsBody, microVmBody: _microVmBody, ...copy } = source;
  return { ...copy, body };
}

export function workspacePrivacyRows(identity: WorkspaceServerIdentity | null, copy: PrivacyCopy) {
  if (!identity?.confirmed) return [] as Array<readonly [string, string]>;
  if (identity.hostingKind === "firecracker_microvm") {
    const rows: Array<readonly [string, string | null]> = [
      [copy.serverType, identity.serverType],
      [copy.workspaceMachineId, identity.workspaceMachineId],
      [copy.location, identity.location],
      [copy.allocatedVcpu, identity.allocatedVcpu === null ? null : String(identity.allocatedVcpu)],
      [copy.allocatedMemory, identity.allocatedMemoryMb === null ? null : `${identity.allocatedMemoryMb} MB`],
      [copy.allocatedStorage, identity.allocatedPrivateStorageGb === null ? null : `${identity.allocatedPrivateStorageGb} GB`],
      [copy.inServiceSince, identity.inServiceSince],
    ];
    return rows.filter((row): row is readonly [string, string] => Boolean(row[1]));
  }
  return [
    [copy.provider, identity.provider],
    [copy.serverId, identity.serverId],
    [copy.ip, identity.publicIpv4 || copy.unavailable],
    [copy.location, identity.location || copy.unavailable],
    [copy.serverType, identity.serverType || copy.unavailable],
    [copy.inServiceSince, identity.inServiceSince || copy.unavailable],
  ] as Array<readonly [string, string]>;
}
