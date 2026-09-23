// HPD-606, visible part (Release 34, Build 46): the Fin Hermes workflow suggestions.
//
// Generated from the catalog in ohlhaver/hey-hermes PR #858
// (apps/api/src/finhermes-suggestions.ts at e41d2d8d2f73, catalog version
// 2026-09-04.1): the seventy in-product entries in pool order (power + clarity
// + buildability, then appeal, then uniqueness, then id) with the fields the
// visible surfaces need. Ranking, server-side states and the guided
// three-question flow follow in Release 35; until then the page and the chat
// carousel read this list and keep their states on the device.
//
// Nothing here creates anything. A tap only puts an editable sentence into the
// composer; the customer sends it or not.

export type FinHermesSuggestionFamily = "watch" | "react" | "research" | "build" | "remember" | "trade";
export type FinHermesSuggestionForm = "prompt" | "dialog" | "skill";

export interface FinHermesSuggestion {
  id: string;
  family: FinHermesSuggestionFamily;
  /** Visible headline, a sentence. */
  title: string;
  /** What the customer would get, one or two sentences. */
  promise: string;
  /** First-person, editable conversation start. */
  opener: string;
  form: FinHermesSuggestionForm;
  sources: readonly string[];
  /** Position among the ten showcase stories, or null. */
  showcaseRank: number | null;
}

export const FINHERMES_SUGGESTIONS_CATALOG_VERSION = "2026-09-04.1";

/** Appended to every draft, as in the catalog. The customer can delete it. */
export const FINHERMES_SUGGESTION_DRAFT_GUARD =
  "Ask me first and propose before you build. Do not create pages, monitors, jobs, connections or orders until I confirm, and treat any broker action as a prepared proposal that needs my explicit approval.";

export const FINHERMES_SUGGESTIONS: readonly FinHermesSuggestion[] = Object.freeze([
  {
    "id": "second_opinion",
    "family": "research",
    "title": "What am I missing?",
    "promise": "Paste your reasoning before you buy. It checks it against research, fundamentals and what the crowd says, and tells you what you missed.",
    "opener": "Before I buy, I want to know what I'm missing. Ask me for the name and my reasoning, then check it against research, fundamentals and what the crowd says.",
    "form": "prompt",
    "sources": [
      "research",
      "fundamentals",
      "social",
      "news"
    ],
    "showcaseRank": null
  },
  {
    "id": "trade_journal",
    "family": "remember",
    "title": "Every trade gets a why, and it remembers.",
    "promise": "Each fill gets one question: why? The answer and your conviction are recorded, and the journal becomes the record you review later.",
    "opener": "I'd like every trade I make to get a short \"why\" recorded, so I can look back honestly later. Ask me how you should catch me.",
    "form": "skill",
    "sources": [
      "broker",
      "portfolio",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "post_mortem",
    "family": "remember",
    "title": "Learn from a closed position.",
    "promise": "After you close a position: what you believed, what happened, what the sources said along the way, and what to change.",
    "opener": "I closed a position and want to learn from it honestly. Ask me which one, what I believed at the start, and what I think went right or wrong.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "research",
      "news",
      "market_data",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "analyst_digest",
    "family": "research",
    "title": "Every morning: what Wall Street analysts wrote about your stocks yesterday.",
    "promise": "The institutional research on your holdings and your watchlist, summarized, every morning. Rating and target changes with the arguments behind them, and where two houses disagree about one of your companies, who needs what to be right.",
    "opener": "Every morning I'd like to know what analysts wrote about my stocks the day before. Ask me which names and how much detail.",
    "form": "skill",
    "sources": [
      "research",
      "watchlist",
      "portfolio"
    ],
    "showcaseRank": 10
  },
  {
    "id": "bear_case",
    "family": "research",
    "title": "The strongest case against your position.",
    "promise": "The best counter-arguments to a position you hold, with sources, refreshed monthly if you want.",
    "opener": "I'd like the strongest case against one of my positions, with sources. Ask me which one and whether I want it refreshed later.",
    "form": "dialog",
    "sources": [
      "research",
      "news",
      "social"
    ],
    "showcaseRank": null
  },
  {
    "id": "thesis_memo",
    "family": "research",
    "title": "Write down why you own it, properly.",
    "promise": "The reasons, what to watch, what would prove you wrong, with sources, saved into your vault.",
    "opener": "I'd like to write down properly why I own one of my positions: the reasons, what I watch, what would prove me wrong. Ask me which one and what I already believe.",
    "form": "dialog",
    "sources": [
      "fundamentals",
      "research",
      "news",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "pre_mortem",
    "family": "research",
    "title": "Imagine the trade failed. Why?",
    "promise": "Before you buy: it is a year later and it went wrong. The most likely reasons, with evidence.",
    "opener": "Before I buy, imagine it's a year later and it failed. Ask me for the name and my reasoning, then tell me the most likely reasons, with evidence.",
    "form": "prompt",
    "sources": [
      "research",
      "news",
      "fundamentals"
    ],
    "showcaseRank": null
  },
  {
    "id": "pretrade_check",
    "family": "research",
    "title": "What this trade does to your portfolio.",
    "promise": "Before you place a trade: concentration, sector, beta and liquidity after it, against your own rules.",
    "opener": "Before I place a trade I'd like to see what it does to my portfolio: concentration, sector, beta, liquidity. Ask me for the trade.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "portfolio_archive",
    "family": "watch",
    "title": "A history of your portfolio that you own.",
    "promise": "A nightly snapshot of positions, prices and cash saved on your own server. A history nobody can take away.",
    "opener": "I'd like a nightly snapshot of my positions and prices saved on my own server, so I have my own history. Ask me what to include.",
    "form": "skill",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "gap_explainer",
    "family": "react",
    "title": "Why a holding gapped before the open.",
    "promise": "A held name gaps pre-market: the why, from news, research and social, pushed before you can ask.",
    "opener": "When one of my stocks gaps before the open, I want the why before I can ask. Ask me which positions and how big a gap.",
    "form": "skill",
    "sources": [
      "market_data",
      "news",
      "research",
      "social",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "accountability_partner",
    "family": "remember",
    "title": "A weekly question about your own rules.",
    "promise": "Once a week, plainly: did you keep to your own investing rules, and where did you not?",
    "opener": "I'd like a weekly check-in against my own investing rules, asked plainly. Ask me what my rules are.",
    "form": "skill",
    "sources": [
      "portfolio",
      "broker",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "risk_rules",
    "family": "watch",
    "title": "Your own limits, checked every day.",
    "promise": "\"No single stock above 15%. Crypto at most 20%. Tell me if I am down more than 10% from the high.\" Say it once. It checks your real holdings daily and tells you the day a rule is broken, with a suggested fix ready to approve.",
    "opener": "I'd like my own portfolio rules checked against what I actually hold. Ask me what the rules are and what should happen when one is broken.",
    "form": "skill",
    "sources": [
      "portfolio",
      "market_data",
      "broker"
    ],
    "showcaseRank": null
  },
  {
    "id": "screener",
    "family": "build",
    "title": "A screen you describe, run every day.",
    "promise": "Describe what you are looking for. It becomes a screen that runs daily and keeps a results page; a push only on new hits.",
    "opener": "I'd like a custom stock screen that runs every day and keeps a results page. Ask me what I'm screening for.",
    "form": "skill",
    "sources": [
      "fundamentals",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "you_said_you_would",
    "family": "remember",
    "title": "Your stated plans, watched.",
    "promise": "\"If it drops below 100, I'll add.\" \"Review this in three months.\" It remembers what you said and reminds you when it comes.",
    "opener": "When I say I'll do something at a price or a date, I'd like you to remember it and remind me when it comes. Ask me what I've already said.",
    "form": "skill",
    "sources": [
      "memory",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "pre_open_note",
    "family": "watch",
    "title": "A short note before the open.",
    "promise": "Overnight moves, new research on your names and the news, ranked by what it means for your portfolio, before the bell.",
    "opener": "I'd like a short note before the open: overnight moves, new research on my names, news, ranked by impact on my portfolio. Ask me what to include.",
    "form": "skill",
    "sources": [
      "market_data",
      "research",
      "news",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "street_expects",
    "family": "react",
    "title": "What the Street expects before the print.",
    "promise": "Three days before a holding reports: the expectations, the key debates, and what would surprise.",
    "opener": "Three days before one of my stocks reports, I want to know what the Street expects and what would surprise. Ask me which names.",
    "form": "skill",
    "sources": [
      "research",
      "fundamentals",
      "web"
    ],
    "showcaseRank": null
  },
  {
    "id": "watchlist_triage",
    "family": "research",
    "title": "Which watchlist names hit your price, and whether the story still holds.",
    "promise": "A daily look at your watchlist: what reached the price you wanted, and whether research and news still support the reason you watch it.",
    "opener": "I'd like a daily check of my watchlist: which names reached my price, and whether the story behind them still holds. Ask me for my prices.",
    "form": "skill",
    "sources": [
      "watchlist",
      "market_data",
      "research",
      "news"
    ],
    "showcaseRank": null
  },
  {
    "id": "weekend_pack",
    "family": "watch",
    "title": "Your week, in one page, on Saturday.",
    "promise": "What happened to your book, what research changed, next week's events, and the questions still open.",
    "opener": "On Saturday I'd like one page with my week: what happened to my book, research changes, next week's events. Ask me what to include.",
    "form": "skill",
    "sources": [
      "portfolio",
      "research",
      "fundamentals",
      "news",
      "web"
    ],
    "showcaseRank": null
  },
  {
    "id": "move_forensics",
    "family": "react",
    "title": "Why did it move.",
    "promise": "After an unusual move: the candidate causes from every source, and which one the market and portfolio data actually support.",
    "opener": "Something I own moved unusually and I want to understand why. Ask me which asset and when, then weigh the possible explanations against the data.",
    "form": "prompt",
    "sources": [
      "market_data",
      "news",
      "research",
      "social"
    ],
    "showcaseRank": null
  },
  {
    "id": "initiation_alert",
    "family": "research",
    "title": "New coverage on your watchlist.",
    "promise": "An analyst starts covering a name you watch: the rating and the one-line argument.",
    "opener": "I'd like to know when an analyst starts covering a name on my watchlist. Ask me which names and how to tell me.",
    "form": "skill",
    "sources": [
      "research",
      "watchlist"
    ],
    "showcaseRank": null
  },
  {
    "id": "behavioral_guardrails",
    "family": "remember",
    "title": "It learns your bad habits and speaks up before you repeat them.",
    "promise": "It sees your own trades over time. If you tend to buy after a stock has already jumped 20%, or sell winners after the first 10% gain, it says so, at the moment you are about to do it again.",
    "opener": "I'd like you to learn my trading habits and warn me before I repeat the bad ones. Ask me first what I suspect about myself.",
    "form": "skill",
    "sources": [
      "portfolio",
      "broker",
      "market_data",
      "memory"
    ],
    "showcaseRank": 7
  },
  {
    "id": "earnings_playbook",
    "family": "react",
    "title": "Before your stock reports earnings, you have a plan. After, it updates itself.",
    "promise": "Three days before: what analysts expect, what would count as a surprise, and what you said you would do in each case. At the print: which case happened and what your plan says. Next morning: your notes on the company updated.",
    "opener": "One of my stocks reports earnings soon and I'd rather have a plan than react. Ask me which one, what I expect, and what I'd do in each case.",
    "form": "skill",
    "sources": [
      "fundamentals",
      "research",
      "web",
      "market_data",
      "news",
      "social"
    ],
    "showcaseRank": 6
  },
  {
    "id": "overnight_report",
    "family": "watch",
    "title": "While you sleep, it watches your holdings. At 7 a.m., one page.",
    "promise": "Which of your stocks will open up or down and why, what crypto did overnight, what news came out on your companies, and what the analysts published this morning. Read it in two minutes before the market opens.",
    "opener": "I want one page waiting for me before the market opens: what moved overnight and what it means for my holdings. Ask me what to include and when.",
    "form": "skill",
    "sources": [
      "market_data",
      "news",
      "social",
      "research",
      "portfolio"
    ],
    "showcaseRank": 9
  },
  {
    "id": "portfolio_health",
    "family": "watch",
    "title": "Your portfolio, watched the way a fund watches its book.",
    "promise": "Every day: how much sits in one stock, one sector, one currency or in crypto, what you hold twice through your ETFs, and each company's health: revenue, margins, debt, estimate cuts, insider selling. Each holding gets a verdict: Fine, Watch, Deteriorating, with the reason. It speaks up when something deteriorates, not every day.",
    "opener": "I'd like you to keep an eye on my portfolio the way a fund's risk desk would: concentration, hidden overlaps, and whether the companies I own are still healthy. Ask me first what matters to me.",
    "form": "skill",
    "sources": [
      "portfolio",
      "web",
      "fundamentals",
      "research",
      "news"
    ],
    "showcaseRank": 2
  },
  {
    "id": "reasons_on_watch",
    "family": "research",
    "title": "It watches the reasons you bought, not just the price.",
    "promise": "You bought a stock for two or three reasons. Each reason becomes a check across research, news and filings. You hear the moment one stops being true, even when the price has not moved yet.",
    "opener": "I want to know when the reasons I bought a stock stop being true, not just when the price falls. Ask me which position and why I own it.",
    "form": "skill",
    "sources": [
      "research",
      "news",
      "web",
      "fundamentals",
      "market_data"
    ],
    "showcaseRank": 5
  },
  {
    "id": "what_changed",
    "family": "remember",
    "title": "Only what changed since you last looked.",
    "promise": "When you come back: the material changes since your last visit, and nothing else.",
    "opener": "When I come back I only want to see what really changed since I last looked. Ask me what counts as material for me.",
    "form": "skill",
    "sources": [
      "memory",
      "research",
      "news",
      "portfolio",
      "broker"
    ],
    "showcaseRank": null
  },
  {
    "id": "one_name_desk",
    "family": "research",
    "title": "Everything about one stock, on one page that stays current.",
    "promise": "Price, fundamentals, research, news, social and your own notes on one company, in one place.",
    "opener": "I'd like one page for one stock with everything that matters: price, fundamentals, research, news, social, my notes. Ask me which one.",
    "form": "dialog",
    "sources": [
      "market_data",
      "fundamentals",
      "research",
      "news",
      "social",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "read_across",
    "family": "research",
    "title": "Research on another company that touches yours.",
    "promise": "A report on a supplier, customer or competitor says something about a company you own. Hermes makes the link.",
    "opener": "When research on another company says something about one of mine, a supplier or a competitor, I want to know. Ask me which holdings to start with.",
    "form": "skill",
    "sources": [
      "research",
      "portfolio",
      "web"
    ],
    "showcaseRank": null
  },
  {
    "id": "base_rates",
    "family": "remember",
    "title": "How often your own calls worked.",
    "promise": "Your calls by conviction level, against what happened. Your own base rates.",
    "opener": "I'd like to know how often my own calls actually worked, by conviction level. Ask me what history you can use.",
    "form": "dialog",
    "sources": [
      "memory",
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "buy_ladder",
    "family": "trade",
    "title": "Your buy list, at your prices, watched around the clock.",
    "promise": "You have cash and a list: this name under 150, that one under 380. It watches, and when a price is reached it checks whether the drop has a bad reason, then hands you the order to approve. It does not buy by itself.",
    "opener": "I have cash and a list of names I'd buy at certain prices. I'd like them watched, and the order prepared when a price is reached, after checking the drop has no bad reason. Ask me for the list.",
    "form": "skill",
    "sources": [
      "watchlist",
      "market_data",
      "news",
      "research",
      "broker"
    ],
    "showcaseRank": null
  },
  {
    "id": "letter_to_yourself",
    "family": "remember",
    "title": "A quarterly letter written from your own journal.",
    "promise": "Once a quarter: a letter to yourself in the style of a fund letter, written from your journal and results, mistakes included.",
    "opener": "Each quarter I'd like a letter to myself, written from my own journal and results, in the style of a fund letter. Ask me what it should never leave out.",
    "form": "skill",
    "sources": [
      "memory",
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "morning_meeting",
    "family": "remember",
    "title": "A two-minute morning meeting with yourself.",
    "promise": "The questions a fund manager gets asked each morning, asked of you, with your answers recorded.",
    "opener": "I'd like a two-minute morning meeting where you ask me the questions a fund manager gets asked, and record my answers. Ask me what questions matter to me.",
    "form": "skill",
    "sources": [
      "portfolio",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "thesis_vault",
    "family": "remember",
    "title": "Your reasons, evidence and numbers as linked notes.",
    "promise": "For each position: the reasons, the evidence with sources, the numbers, as notes you own and can link.",
    "opener": "I'd like my reasons for each position, the evidence and the numbers kept as linked notes I own. Ask me where to start.",
    "form": "dialog",
    "sources": [
      "research",
      "fundamentals",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "why_on_watchlist",
    "family": "research",
    "title": "Why did you add this, and does it still hold?",
    "promise": "For every name on your watchlist: the reason you added it, remembered, and whether it still holds.",
    "opener": "For the names on my watchlist, I'd like to be reminded why I added them, and whether that still holds. Ask me about the ones you don't know.",
    "form": "skill",
    "sources": [
      "watchlist",
      "market_data",
      "research",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "catalyst_calendar",
    "family": "react",
    "title": "Every upcoming event tied to what you would do.",
    "promise": "Earnings, ex-dates and other events on your names, each connected to the decision it needs, not just a reminder.",
    "opener": "I'd like my upcoming catalysts connected to what I'd actually do at each. Ask me which events are coming and which positions they touch.",
    "form": "dialog",
    "sources": [
      "web",
      "portfolio",
      "research",
      "news"
    ],
    "showcaseRank": null
  },
  {
    "id": "close_attribution",
    "family": "watch",
    "title": "What drove your result today.",
    "promise": "After the close: which positions, which sectors, and how much of it was just the market, on a page you can scroll back through.",
    "opener": "After the close I'd like to know what actually drove my day: which positions, which sectors, how much was just the market. Ask me how I'd want it presented.",
    "form": "skill",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "earnings_week",
    "family": "react",
    "title": "Sunday: this week's earnings on your names, with prep status.",
    "promise": "Which of your names report this week and where you stand on each.",
    "opener": "On Sundays I'd like to see which of my names report this week and where I stand on each. Ask me what \"prepared\" means to me.",
    "form": "skill",
    "sources": [
      "web",
      "portfolio",
      "watchlist"
    ],
    "showcaseRank": null
  },
  {
    "id": "meme_shield",
    "family": "react",
    "title": "When a small holding becomes a social target.",
    "promise": "A small cap you own starts trending: you hear early, with a plan ready if you want one.",
    "opener": "I hold some smaller names and want to know if one becomes a social-media target. Ask me which ones and what you should prepare if it happens.",
    "form": "skill",
    "sources": [
      "social",
      "market_data",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "rumor_triage",
    "family": "react",
    "title": "Is there a source behind that rumor.",
    "promise": "A rumor about one of your companies is checked against news and filings before it reaches you. Corroborated: a push. Not: a log entry.",
    "opener": "When a rumor about one of my companies goes around, I want to know if it has a source before I react. Ask me how you should reach me when it does.",
    "form": "skill",
    "sources": [
      "social",
      "news",
      "web",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "social_spike",
    "family": "react",
    "title": "When the crowd suddenly talks about your stock.",
    "promise": "Social volume spikes on one of your names: what is being said, and whether there is real news behind it.",
    "opener": "I want to know when social chatter about one of my stocks spikes, and whether there is real news behind it. Ask me which names and what counts as a spike.",
    "form": "skill",
    "sources": [
      "social",
      "news",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "weekend_crypto",
    "family": "react",
    "title": "What crypto did over the weekend, before Monday.",
    "promise": "Sunday night: what moved in crypto and what it might mean for your crypto-linked stocks on Monday.",
    "opener": "On Sunday night I'd like to know what crypto did over the weekend and what it might mean for Monday. Ask me what to include.",
    "form": "skill",
    "sources": [
      "market_data",
      "social",
      "news",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "analyst_disagreement",
    "family": "research",
    "title": "Where analysts really disagree on your stock.",
    "promise": "Not the consensus: where the houses disagree fundamentally, and what each side needs to be right.",
    "opener": "Where do analysts really disagree on a stock I hold, and what does each side need to be right? Ask me which name.",
    "form": "prompt",
    "sources": [
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "counter_narrative",
    "family": "research",
    "title": "What the crowd believes versus what research says.",
    "promise": "On one of your stocks: the story on social media, the story in the research, and where they clash.",
    "opener": "On one of my stocks, what does the crowd believe and what does the research say, and where do they clash? Ask me which name.",
    "form": "prompt",
    "sources": [
      "social",
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "month_letter",
    "family": "remember",
    "title": "Explain my month like a fund manager would.",
    "promise": "Your month, explained the way a fund manager writes to investors: what drove the result and what it means.",
    "opener": "Explain my month to me the way a fund manager writes to investors: what drove the result and what it means. Ask me which month.",
    "form": "prompt",
    "sources": [
      "portfolio",
      "market_data",
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "shock_lab",
    "family": "watch",
    "title": "Run your own what-if scenarios against your real portfolio.",
    "promise": "\"Bitcoin down 20%, oil up 30%, Nasdaq down 8%.\" Your scenario, your positions, the numbers, and a reaction plan you talk through.",
    "opener": "I'd like to run a few what-if scenarios against my actual portfolio. Ask me which scenarios I have in mind and which positions matter most.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "investment_committee",
    "family": "remember",
    "title": "A regular sitting with yourself.",
    "promise": "Open decisions, new evidence, counter-arguments and deteriorations, collected for a monthly sitting with yourself.",
    "opener": "I'd like a regular investment committee with myself: open decisions, new evidence, counter-arguments. Ask me how often and what belongs on the table.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "research",
      "news",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "post_earnings_update",
    "family": "react",
    "title": "Update your notes after the print.",
    "promise": "After a company you own reports: what changed, what held, written into your notes the next morning.",
    "opener": "After a company I own reports, I'd like my notes on it updated: what changed, what held. Ask me where my notes live.",
    "form": "skill",
    "sources": [
      "research",
      "fundamentals",
      "news",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "research_for_you",
    "family": "research",
    "title": "The daily research flow, ranked for you.",
    "promise": "More research each day than anyone can read, ranked by what matters to your portfolio and your interests.",
    "opener": "There is more research each day than I can read. I'd like it ranked by what matters to my portfolio and interests. Ask me what I care about most.",
    "form": "skill",
    "sources": [
      "research",
      "portfolio",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "review_rota",
    "family": "remember",
    "title": "The positions you have not looked at in the longest.",
    "promise": "Each week: the three positions you reviewed least recently, with their health and news since you last looked.",
    "opener": "Each week I'd like to review the positions I've looked at least recently. Ask me how many and how deep.",
    "form": "skill",
    "sources": [
      "portfolio",
      "fundamentals",
      "news",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "trusted_voices",
    "family": "research",
    "title": "The accounts you trust, and how their calls aged.",
    "promise": "A digest of what the voices you follow said, and a track record of how their past calls turned out.",
    "opener": "There are a few accounts on X whose calls I follow. I'd like a digest of what they say and how their past calls turned out. Ask me who.",
    "form": "skill",
    "sources": [
      "social",
      "market_data",
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "compounding_notes",
    "family": "remember",
    "title": "What you concluded last time comes back.",
    "promise": "When a name comes up again, what you concluded about it last time comes back with it.",
    "opener": "When a name comes up again, I'd like what I concluded last time to come back with it. Ask me how you should show that.",
    "form": "skill",
    "sources": [
      "memory"
    ],
    "showcaseRank": null
  },
  {
    "id": "days_to_exit",
    "family": "watch",
    "title": "How long it would take to get out of each position.",
    "promise": "From your size, the spreads and the daily volume: how many days to exit each holding without moving the price.",
    "opener": "I want to know how fast I could actually get out of each of my positions. Ask me what share of daily volume I'd be comfortable being.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "dividend_screen",
    "family": "research",
    "title": "A dividend screen with research on each hit.",
    "promise": "Your dividend-growth criteria, run monthly, and what research says about every name that passes.",
    "opener": "I'd like a dividend-growth screen where every hit also shows what research says about it. Ask me for my criteria.",
    "form": "skill",
    "sources": [
      "fundamentals",
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "fx_drag",
    "family": "watch",
    "title": "How much of your return was currency.",
    "promise": "Your foreign holdings in your home currency: how much of the result was the companies and how much was the exchange rate.",
    "opener": "I'd like to know how much of my return is really currency. Ask me which currency I think in.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "guidance_gap",
    "family": "research",
    "title": "Guidance, consensus and your number, side by side.",
    "promise": "For a company you own: what management guided, what the Street expects, and your own number, per line item.",
    "opener": "For a company I own I'd like to see guidance, consensus and my own number side by side. Ask me which one and what my number is.",
    "form": "dialog",
    "sources": [
      "fundamentals",
      "web"
    ],
    "showcaseRank": null
  },
  {
    "id": "income_calendar",
    "family": "watch",
    "title": "Dividends and cash coming in, and what you would do with them.",
    "promise": "Ex-dates, expected cash over the next months, and your reinvestment plan, on one page.",
    "opener": "I'd like to see the dividends and cash coming to me over the next months and plan what to do with them. Ask me how I like to reinvest.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "fundamentals",
      "watchlist"
    ],
    "showcaseRank": null
  },
  {
    "id": "income_ledger",
    "family": "watch",
    "title": "Dividends and interest received, against what you expected.",
    "promise": "A running ledger of what actually arrived, checked against what was due.",
    "opener": "I'd like a running ledger of dividends and interest I actually receive, checked against what was expected. Ask me where the payments show up.",
    "form": "skill",
    "sources": [
      "broker",
      "portfolio",
      "fundamentals"
    ],
    "showcaseRank": null
  },
  {
    "id": "insider_lockup",
    "family": "react",
    "title": "Insider sales and lock-up expiries on your names.",
    "promise": "Insider transactions above a size you choose, and lock-up expiries, on your holdings.",
    "opener": "I want to hear about insider sales and lock-up expiries on my holdings. Ask me what size matters.",
    "form": "skill",
    "sources": [
      "web",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "kpi_tracker",
    "family": "research",
    "title": "The numbers your reasons depend on, quarter by quarter.",
    "promise": "For one position: the three numbers that matter, actual against your expectation against consensus, every quarter.",
    "opener": "For one position I'd like to track the few numbers my reasons depend on, quarter by quarter. Ask me which position and which numbers.",
    "form": "dialog",
    "sources": [
      "fundamentals",
      "web"
    ],
    "showcaseRank": null
  },
  {
    "id": "midday_check",
    "family": "watch",
    "title": "One quiet check at midday.",
    "promise": "Anything on your list moving or trading unusually at midday; otherwise silence.",
    "opener": "I'd like one check at midday: anything on my list moving or trading unusually, otherwise silence. Ask me what unusual means to me.",
    "form": "skill",
    "sources": [
      "market_data",
      "portfolio",
      "watchlist"
    ],
    "showcaseRank": null
  },
  {
    "id": "peer_tracker",
    "family": "research",
    "title": "Your holding against its peers.",
    "promise": "Performance, estimate revisions and valuation of one holding against the five companies it really competes with.",
    "opener": "I'd like to see one of my holdings against its real peers: performance, estimate revisions, valuation. Ask me which holding and who the peers are.",
    "form": "dialog",
    "sources": [
      "market_data",
      "fundamentals",
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "sentiment_turn",
    "family": "research",
    "title": "When sentiment on a holding turns.",
    "promise": "Weekly: which of your holdings saw social sentiment turn, and the posts that drove it.",
    "opener": "I'd like to know when social sentiment on one of my holdings turns, with the posts that drove it. Ask me which names and how often.",
    "form": "skill",
    "sources": [
      "social",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "simple_signals",
    "family": "build",
    "title": "Simple momentum and mean-reversion reads on your names.",
    "promise": "Honest, simple signals on your names, presented as observations, not as calls.",
    "opener": "I'd like simple, honest signals on my names: momentum, mean reversion, nothing fancy, presented as observations. Ask me which names.",
    "form": "skill",
    "sources": [
      "market_data",
      "watchlist",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "position_sizing",
    "family": "watch",
    "title": "A position size you can explain.",
    "promise": "Your conviction, the stock's volatility, what else you own that moves with it, and your risk budget, combined into a size and the reasoning behind it.",
    "opener": "I want help sizing a position I'm considering. Ask me about the idea, my conviction, my risk budget, and what else I hold that is related.",
    "form": "dialog",
    "sources": [
      "portfolio",
      "market_data",
      "research"
    ],
    "showcaseRank": null
  },
  {
    "id": "seasonality",
    "family": "build",
    "title": "Is there a seasonal pattern, honestly?",
    "promise": "The seasonal pattern in one stock, with the sample size that says whether it means anything.",
    "opener": "Is there a seasonal pattern in one of my stocks, and is the sample big enough to mean anything? Ask me which one.",
    "form": "prompt",
    "sources": [
      "market_data"
    ],
    "showcaseRank": null
  },
  {
    "id": "realized_gains",
    "family": "watch",
    "title": "Realized gains and losses, on demand.",
    "promise": "Year to date, per position, per account, prepared for your tax advisor.",
    "opener": "Show me my realized gains and losses this year, per position. Ask me which accounts and what you might be missing.",
    "form": "prompt",
    "sources": [
      "broker",
      "portfolio"
    ],
    "showcaseRank": null
  },
  {
    "id": "signal_lab",
    "family": "build",
    "title": "Describe a trading rule in plain English. It becomes a running signal.",
    "promise": "\"Tell me when a stock on my watchlist drops 15% in a week while analysts still rate it a buy.\" It codes that, tests it against five years of data, shows you how often it would have fired, and then runs it for you every day. Paper first. Real orders only if you say so.",
    "opener": "I have a trading rule in my head I'd like to turn into a running signal. Ask me to describe it in plain words first, then tell me honestly what data it needs and what a paper version would look like.",
    "form": "skill",
    "sources": [
      "market_data",
      "fundamentals",
      "research",
      "watchlist"
    ],
    "showcaseRank": 3
  },
  {
    "id": "war_room",
    "family": "react",
    "title": "When one of your stocks moves hard, it opens a war room.",
    "promise": "One of your stocks is down 8% at 9:35. Instead of an alert you get a page: what analysts said this morning, what news and X are saying, whether it is the sector or just this name, what it does to your portfolio, and prepared actions you approve or ignore.",
    "opener": "I want a war room for when one of my stocks moves hard: not an alert, a page that tells me why and what my options are. Ask me first which positions and what counts as a hard move.",
    "form": "skill",
    "sources": [
      "market_data",
      "research",
      "news",
      "social",
      "portfolio"
    ],
    "showcaseRank": 1
  },
  {
    "id": "idea_inbox",
    "family": "research",
    "title": "New stock ideas, found for you, sorted by how you invest.",
    "promise": "Every day it reads the institutional research, the news, and what is trending on X and StockTwits. Ideas that fit your style land in one inbox. You keep, skip, or file them. Filed ones come back only if the facts change.",
    "opener": "I'd like new stock ideas to find me, filtered for how I actually invest. Ask me first what my style is and what I never want to see.",
    "form": "skill",
    "sources": [
      "research",
      "news",
      "social",
      "watchlist",
      "memory"
    ],
    "showcaseRank": 4
  },
  {
    "id": "own_etf",
    "family": "build",
    "title": "Build your own ETF around any idea. It tracks and rebalances it.",
    "promise": "\"Companies that make money from AI data centers.\" It builds the basket, gives it its own page with live performance and what is driving it, and prepares the rebalancing trades when weights drift. You approve; it does not trade on its own.",
    "opener": "I'd like to build my own basket around a theme and have it tracked like an ETF. Ask me what the theme is and how I'd weight it.",
    "form": "skill",
    "sources": [
      "market_data",
      "fundamentals",
      "research",
      "watchlist",
      "broker"
    ],
    "showcaseRank": 8
  }
]);

/** The editable sentence a tap puts into the composer. */
export function finHermesSuggestionDraft(suggestion: Pick<FinHermesSuggestion, "id" | "opener">): string {
  return `${suggestion.opener} ${FINHERMES_SUGGESTION_DRAFT_GUARD} (suggestion: ${suggestion.id})`;
}
