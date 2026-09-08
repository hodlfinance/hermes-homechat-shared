import type { AppLocale, CuratedModelTruthItem, ModelFactValue } from "./types";

const copy = {
  en: ["Intelligence", "Speed", "Price", "approx.", "Unknown", "Current legacy selection", "Benchmark index and output speed relative to Default; speed excludes thinking time. Price estimates a 50:50 input/output provider mix, excluding cache/tools; it is not a bill or a guaranteed speed/price combination. * Intelligence is estimated.", "The Gemini slot uses this version for future runs:"],
  de: ["Intelligenz", "Tempo", "Preis", "ca.", "Unbekannt", "Bestehende Auswahl", "Benchmarkindex und Ausgabetempo relativ zum Default; Tempo ohne Denkwartezeit. Der Preis schätzt einen 50:50-Mix aus Ein-/Ausgabetokens im Providerpool, ohne Cache/Tools; keine Abrechnung und keine garantierte Tempo-Preis-Kombination. * Intelligenz geschätzt.", "Der Gemini-Slot nutzt für künftige Runs diese Version:"],
  fr: ["Intelligence", "Vitesse", "Prix", "env.", "Inconnu", "Sélection existante", "Indice et vitesse de sortie relatifs au modèle par défaut, hors temps de réflexion. Prix estimé pour un mélange fournisseur entrée/sortie 50:50, hors cache/outils ; ni facture ni combinaison vitesse/prix garantie. * Intelligence estimée.", "La sélection Gemini utilise cette version pour les prochaines exécutions :"],
  es: ["Inteligencia", "Velocidad", "Precio", "aprox.", "Desconocido", "Selección existente", "Índice y velocidad de salida relativos al modelo predeterminado, sin tiempo de reflexión. Precio estimado para una mezcla de proveedores de entrada/salida 50:50, sin caché/herramientas; no es una factura ni una combinación garantizada. * Inteligencia estimada.", "La selección Gemini usa esta versión en futuras ejecuciones:"],
  it: ["Intelligenza", "Velocità", "Prezzo", "circa", "Sconosciuto", "Selezione esistente", "Indice e velocità di output relativi al modello predefinito, senza tempo di ragionamento. Prezzo stimato per un mix di provider input/output 50:50, senza cache/strumenti; non è una fattura né una combinazione garantita. * Intelligenza stimata.", "La selezione Gemini usa questa versione per le prossime esecuzioni:"],
  "pt-BR": ["Inteligência", "Velocidade", "Preço", "aprox.", "Desconhecido", "Seleção existente", "Índice e velocidade de saída relativos ao padrão, sem tempo de raciocínio. Preço estimado para um mix de provedores de entrada/saída 50:50, sem cache/ferramentas; não é cobrança nem combinação garantida. * Inteligência estimada.", "A seleção Gemini usa esta versão nas próximas execuções:"],
  ja: ["知能", "速度", "価格", "約", "不明", "既存の選択", "既定モデルに対するベンチマーク指数と出力速度です。思考待ち時間は含みません。価格はプロバイダーの入力・出力50:50の推定で、キャッシュ・ツールは除外。請求額や速度と価格の同時保証ではありません。* 知能は推定値。", "今後の実行でGeminiの選択が使用するバージョン："],
  ko: ["지능", "속도", "가격", "약", "알 수 없음", "기존 선택", "기본 모델 대비 벤치마크 지수와 출력 속도이며 사고 대기 시간은 제외합니다. 가격은 제공업체 입력/출력 50:50 추정치이며 캐시/도구는 제외합니다. 청구액이나 속도와 가격의 동시 보장이 아닙니다. * 지능은 추정치입니다.", "향후 실행에서 Gemini 선택이 사용하는 버전:"],
} satisfies Record<AppLocale, string[]>;

export function modelComparisonCopy(locale: AppLocale) {
  const c = copy[locale] ?? copy.en;
  return { intelligence: c[0]!, speed: c[1]!, price: c[2]!, approximate: c[3]!, unknown: c[4]!, legacySelected: c[5]!, explanation: c[6]!, versionChange: c[7]! };
}

export function modelComparisonPresentation(model: CuratedModelTruthItem, locale: AppLocale) {
  const c = modelComparisonCopy(locale);
  const comparison = model.defaultComparison;
  const number = (value: ModelFactValue | undefined, digits: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value) : null;
  const percent = (value: ModelFactValue | undefined) => {
    const formatted = number(value, 0);
    return formatted === null ? c.unknown : `${formatted}%`;
  };
  const factor = number(comparison?.estimatedPriceFactor, 2);
  return {
    summary: `${c.intelligence}${comparison?.intelligenceEstimated ? "*" : ""} ${percent(comparison?.intelligencePercent)} · ${c.speed} ${percent(comparison?.speedPercent)} · ${c.price} ${factor === null ? c.unknown : `${c.approximate} ${factor}×`}`,
    details: `${model.quality.sourceName} ${model.quality.retrievedAt} · ${model.cost.sourceName} ${model.cost.retrievedAt}${model.slot === "gemini" ? `\n${c.versionChange} ${model.modelName}` : ""}`,
  };
}
