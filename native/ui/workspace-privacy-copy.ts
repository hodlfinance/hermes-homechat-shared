import type { AppLocale, WorkspaceServerIdentity } from "../core/index";
type PrivacyCopy = { title: string; body: string; support: string; details: string; provider: string; serverId: string; ip: string; location: string; serverType: string; unavailable: string; policy: string; close: string };
const words: Record<AppLocale, readonly [string, string, string, string, string, string, string, string, string, string, string, string]> = {
  en: ["Privacy", "Your personal content is protected on your own virtual private server (VPS). You decide who can access it.", "Hey Hermes handles operations and backups. Support access requires your approval.", "Server details", "Provider", "Server ID", "IP address", "Location", "Server type", "Not available", "Privacy policy", "Close"],
  de: ["Datenschutz", "Deine persönlichen Inhalte sind auf deinem eigenen virtuellen privaten Server (VPS) geschützt. Du bestimmst, wer darauf zugreifen darf.", "Hey Hermes übernimmt Betrieb und Backups. Supportzugriff erfolgt nur mit deiner Freigabe.", "Serverdetails", "Anbieter", "Server-ID", "IP-Adresse", "Standort", "Servertyp", "Nicht verfügbar", "Datenschutzerklärung", "Schließen"],
  fr: ["Confidentialité", "Vos contenus personnels sont protégés sur votre propre serveur privé virtuel (VPS). Vous décidez qui peut y accéder.", "Hey Hermes assure le fonctionnement et les sauvegardes. Le support ne peut y accéder qu’avec votre accord.", "Détails du serveur", "Fournisseur", "Identifiant du serveur", "Adresse IP", "Emplacement", "Type de serveur", "Indisponible", "Politique de confidentialité", "Fermer"],
  es: ["Privacidad", "Tu contenido personal está protegido en tu propio servidor privado virtual (VPS). Tú decides quién puede acceder.", "Hey Hermes se encarga del funcionamiento y las copias de seguridad. El soporte solo accede con tu autorización.", "Detalles del servidor", "Proveedor", "ID del servidor", "Dirección IP", "Ubicación", "Tipo de servidor", "No disponible", "Política de privacidad", "Cerrar"],
  it: ["Privacy", "I tuoi contenuti personali sono protetti sul tuo server privato virtuale (VPS). Decidi tu chi può accedervi.", "Hey Hermes si occupa della gestione e dei backup. L’assistenza accede solo con la tua autorizzazione.", "Dettagli del server", "Fornitore", "ID server", "Indirizzo IP", "Posizione", "Tipo di server", "Non disponibile", "Informativa sulla privacy", "Chiudi"],
  "pt-BR": ["Privacidade", "Seu conteúdo pessoal está protegido no seu próprio servidor virtual privado (VPS). Você decide quem pode acessá-lo.", "O Hey Hermes cuida da operação e dos backups. O suporte só acessa com sua autorização.", "Detalhes do servidor", "Provedor", "ID do servidor", "Endereço IP", "Localização", "Tipo de servidor", "Não disponível", "Política de privacidade", "Fechar"],
  ja: ["プライバシー", "あなたの個人的なコンテンツは、あなた専用の仮想プライベートサーバー（VPS）で保護されています。誰がアクセスできるかは、あなたが決めます。", "Hey Hermesが運用とバックアップを行います。サポートによるアクセスには、あなたの許可が必要です。", "サーバー情報", "プロバイダー", "サーバーID", "IPアドレス", "所在地", "サーバーの種類", "利用不可", "プライバシーポリシー", "閉じる"],
  ko: ["개인정보 보호", "개인 콘텐츠는 전용 가상 사설 서버(VPS)에서 보호됩니다. 누가 접근할 수 있는지는 직접 결정합니다.", "Hey Hermes가 운영과 백업을 담당합니다. 지원팀은 사용자의 승인하에만 접근합니다.", "서버 정보", "제공업체", "서버 ID", "IP 주소", "위치", "서버 유형", "사용할 수 없음", "개인정보 처리방침", "닫기"],
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
  return Boolean(identity && identity.workspaceId === workspaceId && identity.provider && identity.serverId);
}
export function workspacePrivacyCopy(locale: AppLocale, serverConfirmed = false): PrivacyCopy {
  const [title, body, support, details, provider, serverId, ip, location, serverType, unavailable, policy, close] = words[locale];
  return { title, body: serverConfirmed ? body : unconfirmed[locale], support, details, provider, serverId, ip, location, serverType, unavailable, policy, close };
}
