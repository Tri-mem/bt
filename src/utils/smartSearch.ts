import { Product } from '../types';

export interface SmartKeywordSuggestion {
  keyword: string;
  categoryLabel: string;
  matchCount: number;
  type: 'keyword' | 'category' | 'brand' | 'price' | 'feature';
}

export interface ParsedSearchIntent {
  rawQuery: string;
  cleanedQuery: string;
  normalizedQuery: string;
  tokens: string[];
  isMidRangeIntent: boolean;
  isBudgetIntent: boolean;
  isPremiumIntent: boolean;
  minPriceConstraint?: number;
  maxPriceConstraint?: number;
  inferredCategory?: string;
}

/**
 * Strips Vietnamese diacritics, normalizes phonetic spoken variations (from Web Speech API),
 * and collapses whitespace for accurate Vietnamese + English tech search.
 */
export function normalizeVietnameseSearchText(input: string): string {
  if (!input) return '';
  let text = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd');

  // Map common Vietnamese voice-recognition phonetic transcriptions to standard tech terms
  const phoneticReplacements: Array<[RegExp, string]> = [
    [/\bi\s*phone\b/g, 'iphone'],
    [/\bai\s*phon(e)?\b/g, 'iphone'],
    [/\bi\s*pad\b/g, 'ipad'],
    [/\bai\s*pat\b/g, 'ipad'],
    [/\bmac\s*book\b/g, 'macbook'],
    [/\bmac\s*buc\b/g, 'macbook'],
    [/\bair\s*pod(s)?\b/g, 'airpods'],
    [/\be\s*pot\b/g, 'airpods'],
    [/\bsam\s*sung\b/g, 'samsung'],
    [/\bxia\s*o\s*mi\b/g, 'xiaomi'],
    [/\bsao\s*mi\b/g, 'xiaomi'],
    [/\bxac\b/g, 'sac'],
    [/\btai\s*phone\b/g, 'tai nghe'],
    [/\bhead\s*phone(s)?\b/g, 'tai nghe'],
    [/\bsmart\s*watch\b/g, 'dong ho'],
    [/\bapple\s*watch\b/g, 'apple watch'],
    [/\bmuoi\s*sau\b/g, '16'],
    [/\bmuoi\s*lam\b/g, '15'],
    [/\bmuoi\s*bon\b/g, '14'],
    [/\bmuoi\s*ba\b/g, '13'],
  ];

  for (const [pattern, replacement] of phoneticReplacements) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/[^a-z0-9\s.+%-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans conversational filler words often captured by Web Speech API
 * (e.g., "tìm cho tôi điện thoại samsung dưới 10 triệu" -> "điện thoại samsung")
 * while extracting price/segment constraints.
 */
export function parseSmartSearchQuery(rawQuery: string): ParsedSearchIntent {
  const trimmed = rawQuery.trim();
  const normFull = normalizeVietnameseSearchText(trimmed);

  // Detect price segment intents
  const isMidRangeIntent =
    normFull.includes('trung binh') ||
    normFull.includes('tam trung') ||
    normFull.includes('gia trung binh') ||
    normFull.includes('mid-range') ||
    normFull.includes('midrange') ||
    normFull.includes('vua tui tien');

  const isBudgetIntent =
    normFull.includes('gia re') ||
    normFull.includes('binh dan') ||
    normFull.includes('hoc sinh') ||
    normFull.includes('sinh vien') ||
    normFull.includes('tiet kiem');

  const isPremiumIntent =
    normFull.includes('cao cap') ||
    normFull.includes('flagship') ||
    normFull.includes('xin nhat') ||
    normFull.includes('dat nhat');

  let minPriceConstraint: number | undefined;
  let maxPriceConstraint: number | undefined;

  // Extract natural language price constraints (e.g. "duoi 5 trieu", "tren 10 trieu", "tu 2 den 5 trieu")
  const rangeMatch = normFull.match(
    /(?:tu\s+)?(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m)?\s*(?:den|toi|-)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|nghin|k)/
  );
  if (rangeMatch) {
    const unit = rangeMatch[3];
    const multiplier = unit === 'nghin' || unit === 'k' ? 1000 : 1000000;
    minPriceConstraint = Math.round(parseFloat(rangeMatch[1].replace(',', '.')) * multiplier);
    maxPriceConstraint = Math.round(parseFloat(rangeMatch[2].replace(',', '.')) * multiplier);
  } else {
    const underMatch = normFull.match(
      /(?:duoi|nho hon|thap hon|toi da|khoang)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|nghin|k)/
    );
    if (underMatch) {
      const unit = underMatch[2];
      const multiplier = unit === 'nghin' || unit === 'k' ? 1000 : 1000000;
      maxPriceConstraint = Math.round(parseFloat(underMatch[1].replace(',', '.')) * multiplier);
    }

    const overMatch = normFull.match(
      /(?:tren|lon hon|tu)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|nghin|k)/
    );
    if (overMatch) {
      const unit = overMatch[2];
      const multiplier = unit === 'nghin' || unit === 'k' ? 1000 : 1000000;
      minPriceConstraint = Math.round(parseFloat(overMatch[1].replace(',', '.')) * multiplier);
    }
  }

  // Strip conversational voice prefixes & price phrases so the remaining product keywords match cleanly
  let cleanedNorm = normFull
    .replace(
      /^(tim kiem|tim cho toi|tim giup toi|tim giup|cho toi xem|toi muon mua|muon mua|can mua|tim|mua|xem|shop oi|co ban)\s+/g,
      ''
    )
    .replace(
      /(?:tu\s+)?(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|m)?\s*(?:den|toi|-)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|nghin|k)/g,
      ' '
    )
    .replace(
      /(?:duoi|nho hon|thap hon|toi da|khoang|tren|lon hon|tu)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|nghin|k)/g,
      ' '
    )
    .replace(
      /\b(gia trung binh|trung binh|tam trung|mid-range|midrange|vua tui tien|gia re|binh dan|cao cap|flagship|chinh hang)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  // Map category synonyms for voice/text search
  let inferredCategory: string | undefined;
  if (/\b(dien thoai|smartphone|phone|di dong|dt)\b/.test(cleanedNorm)) {
    inferredCategory = 'phone';
  } else if (/\b(laptop|may tinh|macbook|man hinh|vivobook|ultrasharp|mac mini|ipad|may tinh bang|tablet)\b/.test(cleanedNorm)) {
    inferredCategory = 'laptop';
  } else if (/\b(tai nghe|loa|am thanh|airpods|earbuds|headphone|marshall|jbl|soundcore|beats|homepod)\b/.test(cleanedNorm)) {
    inferredCategory = 'audio';
  } else if (/\b(dong ho|smartwatch|watch|garmin|vong đeo|band)\b/.test(cleanedNorm)) {
    inferredCategory = 'watch';
  } else if (/\b(sac|pin du phong|cap|ban phim|chuot|phu kien|magsafe|airtag| the nho|ssd|gia do|but)\b/.test(cleanedNorm)) {
    inferredCategory = 'accessory';
  } else if (/\b(gaming|choi game|ps5|playstation|nintendo|switch|steam deck|tay cam|rog)\b/.test(cleanedNorm)) {
    inferredCategory = 'gaming';
  }

  // Remove generic category filler words if there are more specific brand/model tokens
  const rawTokens = cleanedNorm.split(' ').filter((t) => t.length > 0);
  const stopWords = new Set(['san', 'pham', 'may', 'chiec', 'cai', 'loai', 'nao', 'tot', 'nhat', 'cho', 'voi']);
  const meaningfulTokens = rawTokens.filter((t) => !stopWords.has(t));

  return {
    rawQuery: trimmed,
    cleanedQuery: cleanedNorm,
    normalizedQuery: normFull,
    tokens: meaningfulTokens,
    isMidRangeIntent,
    isBudgetIntent,
    isPremiumIntent,
    minPriceConstraint,
    maxPriceConstraint,
    inferredCategory,
  };
}

/**
 * Computes a relevance score (>= 0) for how well a Product matches the parsed search intent.
 * Returns 0 if the product does not match.
 */
export function scoreProductMatch(product: Product, intent: ParsedSearchIntent): number {
  if (!intent.rawQuery) return 1;

  // Check explicit spoken/typed price constraints first
  if (intent.minPriceConstraint !== undefined && product.price < intent.minPriceConstraint) {
    return 0;
  }
  if (intent.maxPriceConstraint !== undefined && product.price > intent.maxPriceConstraint) {
    return 0;
  }

  // Check price segment intents
  if (intent.isMidRangeIntent && (product.price < 2000000 || product.price > 13500000)) {
    // Allow if the product explicitly matches remaining specific tokens
    if (intent.tokens.length === 0) return 0;
  }
  if (intent.isBudgetIntent && product.price > 3500000 && intent.tokens.length === 0) {
    return 0;
  }
  if (intent.isPremiumIntent && product.price < 15000000 && intent.tokens.length === 0) {
    return 0;
  }

  // If the query was purely a price/segment phrase (e.g. "dưới 5 triệu", "giá trung bình", "tầm trung")
  if (intent.tokens.length === 0) {
    if (intent.isMidRangeIntent) {
      return product.price >= 2000000 && product.price <= 13500000 ? 60 : 0;
    }
    if (intent.isBudgetIntent) {
      return product.price <= 3500000 ? 60 : 0;
    }
    if (intent.isPremiumIntent) {
      return product.price >= 15000000 ? 60 : 0;
    }
    if (intent.minPriceConstraint !== undefined || intent.maxPriceConstraint !== undefined) {
      return 60;
    }
    return 0;
  }

  const normName = normalizeVietnameseSearchText(product.name);
  const normCategory = normalizeVietnameseSearchText(product.categoryName);
  const normDesc = normalizeVietnameseSearchText(product.description);
  const normHighlights = normalizeVietnameseSearchText((product.highlights || []).join(' '));
  const normSpecs = normalizeVietnameseSearchText(Object.values(product.specs || {}).join(' '));
  const normColors = normalizeVietnameseSearchText((product.colors || []).join(' '));
  const normBadge = normalizeVietnameseSearchText(product.badge || '');

  const combinedCorpus = `${normName} ${normCategory} ${normHighlights} ${normDesc} ${normSpecs} ${normColors} ${normBadge}`;

  let score = 0;

  // 1. Direct phrase match boost
  if (intent.cleanedQuery && normName.includes(intent.cleanedQuery)) {
    score += 120;
    if (normName.startsWith(intent.cleanedQuery)) {
      score += 40;
    }
  } else if (intent.cleanedQuery && normCategory.includes(intent.cleanedQuery)) {
    score += 80;
  } else if (intent.cleanedQuery && combinedCorpus.includes(intent.cleanedQuery)) {
    score += 55;
  }

  // 2. Token-by-token matching (ignore generic words like "dien", "thoai" if category matches)
  const genericCategoryTokens = new Set(['dien', 'thoai', 'may', 'tinh', 'bang', 'dong', 'ho', 'phu', 'kien']);
  let matchedTokenCount = 0;
  let requiredTokenCount = 0;

  for (const token of intent.tokens) {
    const isGenericCatWord =
      genericCategoryTokens.has(token) && intent.inferredCategory === product.category;

    if (isGenericCatWord) {
      score += 15;
      continue;
    }

    requiredTokenCount += 1;

    if (normName.includes(token)) {
      matchedTokenCount += 1;
      score += 35;
    } else if (normCategory.includes(token) || (intent.inferredCategory && intent.inferredCategory === product.category)) {
      matchedTokenCount += 1;
      score += 22;
    } else if (normHighlights.includes(token) || normSpecs.includes(token)) {
      matchedTokenCount += 1;
      score += 18;
    } else if (normDesc.includes(token) || normColors.includes(token) || normBadge.includes(token)) {
      matchedTokenCount += 1;
      score += 12;
    }
  }

  // If multiple specific tokens were entered, require at least all (for <=2 tokens) or >=75% of tokens to match
  if (requiredTokenCount > 0) {
    const minRequired = requiredTokenCount <= 2 ? requiredTokenCount : Math.ceil(requiredTokenCount * 0.75);
    if (matchedTokenCount < minRequired) {
      return 0;
    }
  }

  // Category alignment bonus
  if (intent.inferredCategory && product.category === intent.inferredCategory) {
    score += 25;
  }

  // Mid-range / budget / premium bonus when combined with keywords
  if (intent.isMidRangeIntent && product.price >= 2000000 && product.price <= 13500000) {
    score += 30;
  }

  return score;
}

const CURATED_SMART_SUGGESTIONS: Array<{
  keyword: string;
  categoryLabel: string;
  type: SmartKeywordSuggestion['type'];
  aliases: string[];
}> = [
  {
    keyword: 'Galaxy S24 Ultra',
    categoryLabel: 'Flagship AI',
    type: 'brand',
    aliases: ['samsung', 's24', 'galaxy', 'dien thoai samsung', 'ai phone'],
  },
  {
    keyword: 'Galaxy Z Fold6',
    categoryLabel: 'Điện thoại gập',
    type: 'brand',
    aliases: ['fold', 'z fold', 'dien thoai gap', 'samsung gap'],
  },
  {
    keyword: 'Galaxy A55 5G',
    categoryLabel: 'Tầm trung bán chạy',
    type: 'brand',
    aliases: ['a55', 'samsung tam trung', 'dien thoai tam trung'],
  },
  {
    keyword: 'Redmi Note 13 Pro+',
    categoryLabel: 'Camera 200MP • Sạc 120W',
    type: 'brand',
    aliases: ['redmi', 'note 13', 'xiaomi', 'dien thoai xiaomi'],
  },
  {
    keyword: 'POCO X6 Pro 5G',
    categoryLabel: 'Hiệu năng Gaming',
    type: 'brand',
    aliases: ['poco', 'x6', 'dien thoai choi game'],
  },
  {
    keyword: 'MacBook Pro 16 M3 Max',
    categoryLabel: 'Laptop Đồ họa & AI',
    type: 'brand',
    aliases: ['macbook', 'laptop apple', 'm3 max', 'mac'],
  },
  {
    keyword: 'Mac mini M4',
    categoryLabel: 'Máy tính Apple M4',
    type: 'brand',
    aliases: ['mac mini', 'm4', 'apple mac'],
  },
  {
    keyword: 'iPad Gen 10',
    categoryLabel: 'Máy tính bảng học tập',
    type: 'brand',
    aliases: ['ipad', 'may tinh bang', 'tablet apple'],
  },
  {
    keyword: 'iPad mini A17 Pro',
    categoryLabel: 'iPad nhỏ gọn Apple Intelligence',
    type: 'brand',
    aliases: ['ipad mini', 'a17 pro', 'ipad nho'],
  },
  {
    keyword: 'ASUS Vivobook 15',
    categoryLabel: 'Laptop văn phòng mỏng nhẹ',
    type: 'brand',
    aliases: ['asus', 'vivobook', 'laptop van phong', 'laptop sinh vien'],
  },
  {
    keyword: 'Màn hình Dell 4K',
    categoryLabel: 'Màn hình đồ họa USB-C',
    type: 'feature',
    aliases: ['man hinh', 'dell', 'ultrasharp', '4k', 'monitor'],
  },
  {
    keyword: 'Màn hình Gaming OLED',
    categoryLabel: 'Tần số quét 240Hz',
    type: 'feature',
    aliases: ['rog', 'oled', 'man hinh cong', 'man hinh gaming', 'aoc'],
  },
  {
    keyword: 'AirPods 4',
    categoryLabel: 'Tai nghe Apple chống ồn',
    type: 'brand',
    aliases: ['airpods', 'tai nghe apple', 'tai nghe bluetooth', 'khong day'],
  },
  {
    keyword: 'Tai nghe chống ồn Sony',
    categoryLabel: 'Pin 50 giờ • ANC',
    type: 'feature',
    aliases: ['sony', 'wh-ch720n', 'wh-ch520', 'tai nghe chong on', 'chup tai'],
  },
  {
    keyword: 'Loa Bluetooth Marshall',
    categoryLabel: 'Âm thanh cổ điển Anh Quốc',
    type: 'brand',
    aliases: ['marshall', 'stanmore', 'emberton', 'loa bluetooth', 'loa nghe nhac'],
  },
  {
    keyword: 'Loa JBL chống nước',
    categoryLabel: 'Pin khỏe dã ngoại',
    type: 'brand',
    aliases: ['jbl', 'flip 6', 'go 4', 'loa di dong', 'loa chong nuoc'],
  },
  {
    keyword: 'Apple Watch Series 10',
    categoryLabel: 'Đồng hồ thông minh Apple',
    type: 'brand',
    aliases: ['apple watch', 'watch se', 'dong ho apple', 'smartwatch'],
  },
  {
    keyword: 'Đồng hồ thể thao Garmin',
    categoryLabel: 'GPS đa băng tần • Pin bền',
    type: 'brand',
    aliases: ['garmin', 'forerunner', 'fenix', 'dong ho chay bo', 'the thao'],
  },
  {
    keyword: 'Sạc dự phòng 145W',
    categoryLabel: 'Sạc nhanh Laptop & Điện thoại',
    type: 'feature',
    aliases: ['sac du phong', 'pin du phong', 'cuktech', 'ugreen', 'shargeek', 'xiaomi 50w'],
  },
  {
    keyword: 'Sạc nhanh GaN 65W',
    categoryLabel: 'Củ sạc đa cổng nhỏ gọn',
    type: 'feature',
    aliases: ['cu sac', 'sac nhanh', 'anker', 'ugreen nexode', 'sac 35w', 'cap sac'],
  },
  {
    keyword: 'Phụ kiện MagSafe',
    categoryLabel: 'Sạc & Ví từ tính iPhone',
    type: 'feature',
    aliases: ['magsafe', 'baseus', 'moft', 'sac khong day', 'airtag'],
  },
  {
    keyword: 'PlayStation 5 Slim',
    categoryLabel: 'Máy chơi game 4K 120Hz',
    type: 'brand',
    aliases: ['ps5', 'playstation', 'may choi game', 'sony ps5'],
  },
  {
    keyword: 'Nintendo Switch OLED',
    categoryLabel: 'Handheld Gaming gia đình',
    type: 'brand',
    aliases: ['nintendo', 'switch', 'switch lite', 'steam deck'],
  },
  {
    keyword: 'Dưới 2 triệu',
    categoryLabel: 'Tìm theo ngân sách tiết kiệm',
    type: 'price',
    aliases: ['duoi 2 trieu', 'duoi 1 trieu', 'gia re', 'binh dan', 'phu kien gia re'],
  },
  {
    keyword: 'Giá trung bình',
    categoryLabel: 'Phân khúc 2 - 13.5 triệu',
    type: 'price',
    aliases: ['tam trung', 'vua tui tien', 'tu 3 den 10 trieu', 'duoi 10 trieu'],
  },
];

/**
 * Generates contextual smart keyword suggestions while the user is typing or using voice search.
 */
export function generateSmartKeywordSuggestions(
  rawQuery: string,
  products: Product[],
  limit = 8
): SmartKeywordSuggestion[] {
  const qNorm = normalizeVietnameseSearchText(rawQuery);
  const results: Array<SmartKeywordSuggestion & { relevance: number }> = [];
  const seenKeywords = new Set<string>();

  const countMatchesForKeyword = (kw: string): number => {
    const intent = parseSmartSearchQuery(kw);
    return products.filter((p) => scoreProductMatch(p, intent) > 0).length;
  };

  if (!qNorm) {
    // Return top popular smart suggestions when input is empty
    for (const item of CURATED_SMART_SUGGESTIONS.slice(0, limit)) {
      const count = countMatchesForKeyword(item.keyword);
      if (count > 0) {
        results.push({
          keyword: item.keyword,
          categoryLabel: item.categoryLabel,
          matchCount: count,
          type: item.type,
          relevance: 10,
        });
      }
    }
    return results.slice(0, limit);
  }

  // 1. Match against curated smart keyword dictionary (prefix, substring, and alias matching)
  for (const item of CURATED_SMART_SUGGESTIONS) {
    const kwNorm = normalizeVietnameseSearchText(item.keyword);
    const aliasMatched = item.aliases.some((al) => {
      const alNorm = normalizeVietnameseSearchText(al);
      return alNorm.includes(qNorm) || qNorm.includes(alNorm);
    });

    let relevance = 0;
    if (kwNorm.startsWith(qNorm)) {
      relevance = 100;
    } else if (kwNorm.includes(qNorm)) {
      relevance = 85;
    } else if (aliasMatched) {
      relevance = 70;
    } else {
      // Check token overlap
      const qTokens = qNorm.split(' ').filter(Boolean);
      const hitTokens = qTokens.filter(
        (t) =>
          kwNorm.includes(t) ||
          item.aliases.some((al) => normalizeVietnameseSearchText(al).includes(t))
      );
      if (hitTokens.length > 0) {
        relevance = 45 + hitTokens.length * 15;
      }
    }

    if (relevance > 0 && !seenKeywords.has(kwNorm)) {
      const count = countMatchesForKeyword(item.keyword);
      if (count > 0) {
        seenKeywords.add(kwNorm);
        results.push({
          keyword: item.keyword,
          categoryLabel: item.categoryLabel,
          matchCount: count,
          type: item.type,
          relevance,
        });
      }
    }
  }

  // 2. Dynamically extract matching product names / model phrases from catalog if needed
  for (const prod of products) {
    const prodNameNorm = normalizeVietnameseSearchText(prod.name);
    // Extract concise model name (before "—" or "(")
    const shortName = prod.name.split(/[—(]/)[0].trim();
    const shortNorm = normalizeVietnameseSearchText(shortName);

    if (shortNorm && !seenKeywords.has(shortNorm)) {
      if (shortNorm.startsWith(qNorm) || prodNameNorm.includes(qNorm)) {
        seenKeywords.add(shortNorm);
        results.push({
          keyword: shortName,
          categoryLabel: prod.categoryName,
          matchCount: 1,
          type: 'keyword',
          relevance: shortNorm.startsWith(qNorm) ? 90 : 65,
        });
      }
    }
  }

  // 3. If user typed a number (e.g. "5", "10", "15"), suggest smart price queries
  const numMatch = qNorm.match(/^(\d{1,2})$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 50) {
      const priceKw = `Dưới ${num} triệu`;
      const priceKwNorm = normalizeVietnameseSearchText(priceKw);
      if (!seenKeywords.has(priceKwNorm)) {
        const count = countMatchesForKeyword(priceKw);
        if (count > 0) {
          seenKeywords.add(priceKwNorm);
          results.push({
            keyword: priceKw,
            categoryLabel: 'Lọc nhanh theo ngân sách',
            matchCount: count,
            type: 'price',
            relevance: 95,
          });
        }
      }
    }
  }

  return results
    .sort((a, b) => b.relevance - a.relevance || b.matchCount - a.matchCount)
    .slice(0, limit)
    .map(({ relevance: _r, ...rest }) => rest);
}
