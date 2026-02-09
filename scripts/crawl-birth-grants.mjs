import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.childcare.go.kr';
const LIST_URL = `${BASE}/web/board/BD_board.list.do?bbsCd=9091`;
const DETAIL_URL = `${BASE}/web/board/BD_board.view.do?bbsCd=9091`;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchHTML(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Step 1: Collect all seq IDs + titles from list pages
async function collectAllItems() {
  const items = [];
  let page = 1;
  const totalPages = 24; // 231 items / 10 per page = 24 pages

  for (page = 1; page <= totalPages; page++) {
    console.log(`📄 Fetching list page ${page}/${totalPages}...`);
    try {
      const html = await fetchHTML(`${LIST_URL}&q_currPage=${page}`);
      const $ = cheerio.load(html);

      // Extract jsView calls: jsView('9091', 'SEQ', ...)
      const matches = html.matchAll(/jsView\('9091',\s*'(\d+)',\s*'[^']*',\s*'[^']*'\)/g);
      for (const m of matches) {
        const seq = m[1];
        // Find the title near this jsView call
        const idx = html.indexOf(m[0]);
        const chunk = html.substring(idx, idx + 500);
        const titleMatch = chunk.match(/>\s*([^<]+출산지원금[^<]*)\s*</);
        const title = titleMatch ? titleMatch[1].trim() : '';

        // Skip notice (the one without a number)
        // Check if this is a notice by looking at the surrounding context
        items.push({ seq, title });
      }
    } catch (err) {
      console.error(`❌ Failed page ${page}: ${err.message}`);
    }
    await delay(500);
  }

  // Deduplicate by seq (notices appear on every page)
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!seen.has(item.seq)) {
      seen.add(item.seq);
      unique.push(item);
    }
  }
  return unique;
}

// Step 2: Parse detail page
function parseDetail(html, seq) {
  const $ = cheerio.load(html);

  const title = $('h3').first().text().trim();

  // The content is in td with raw HTML/text after the title row
  // Find the main content area - it's in a div or td containing the grant info
  let rawContent = '';

  // The content appears to be in a specific pattern in the HTML
  // Looking for the large content block with [첫만남 이용권] etc.
  const contentMatch = html.match(/\[첫만남[^\]]*\][\s\S]*?\[등록일[^\]]*\]/);
  if (contentMatch) {
    // Clean HTML tags
    rawContent = contentMatch[0].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  } else {
    // Fallback: get all text from the view area
    const viewArea = html.match(/<td[^>]*class="[^"]*"[^>]*>([\s\S]*?\[등록일[\s\S]*?\])/);
    if (viewArea) {
      rawContent = viewArea[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    }
  }

  if (!rawContent) {
    // Another fallback: find content between specific markers
    const allText = $('body').text();
    const startIdx = allText.indexOf('[첫만남');
    const endIdx = allText.indexOf('[등록일');
    if (startIdx !== -1 && endIdx !== -1) {
      rawContent = allText.substring(startIdx, endIdx + allText.substring(endIdx).indexOf(']') + 1).trim();
    }
  }

  // Parse region from title: "서울 강남구 출산지원금" or "세종특별자치시 출산지원금"
  let region_province = '';
  let region_city = '';
  const regionMatch = title.match(/^(.+?)\s+(.+?)\s+출산지원금/);
  if (regionMatch) {
    region_province = regionMatch[1];
    region_city = regionMatch[2];
  } else {
    const singleRegion = title.match(/^(.+?)\s*출산지원금/);
    if (singleRegion) {
      region_province = singleRegion[1];
      region_city = '';
    }
  }

  // Parse first baby grant
  let first_baby_grant = '';
  const firstBabyMatch = rawContent.match(/\[첫만남 이용권\]([\s\S]*?)(?=\n\n\[|$)/);
  if (firstBabyMatch) {
    first_baby_grant = firstBabyMatch[0].trim();
  }

  // Parse local grants - sections like [출산축하금], [출산장려금], etc.
  const local_grants = [];
  const grantSections = rawContent.matchAll(/\[([^\]]*(?:출산|축하|장려|양육|산모|다자녀|다둥이|셋째|넷째|첫째|둘째|임산부|신생아|태아)[^\]]*)\]([\s\S]*?)(?=\n\n\[|$)/g);
  for (const gs of grantSections) {
    const name = gs[1].trim();
    const body = gs[2].trim();

    // Try to extract amount
    const amountMatch = body.match(/(?:금액|지원내용|지원금액)\s*[:：]?\s*([^\n]+)/);
    const conditionMatch = body.match(/(?:지원대상|대상)\s*[:：]?\s*([^\n]+)/);

    local_grants.push({
      name,
      amount: amountMatch ? amountMatch[1].trim() : '',
      condition: conditionMatch ? conditionMatch[1].trim() : '',
      detail: body
    });
  }

  // Other benefits - sections that don't match the above
  const other_benefits = [];
  const otherSections = rawContent.matchAll(/\[([^\]]+)\]/g);
  for (const os of otherSections) {
    const name = os[1].trim();
    if (name.includes('첫만남') || name.includes('등록일') ||
        local_grants.some(g => g.name === name)) continue;
    other_benefits.push(name);
  }

  // Extract updated_at
  const dateMatch = rawContent.match(/\[등록일\s*(\d{4})\.\s*(\d{2})\.\s*(\d{2})\]/);
  const updated_at = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';

  return {
    region_province,
    region_city,
    title,
    first_baby_grant,
    local_grants,
    other_benefits,
    raw_content: rawContent,
    source_url: `${DETAIL_URL}&seq=${seq}`,
    updated_at
  };
}

async function main() {
  console.log('🚀 Starting crawl...');

  // Step 1: Collect items
  const items = await collectAllItems();
  console.log(`\n📋 Collected ${items.length} unique items from list pages`);

  // Filter out the notice item (공지) - it typically has a different seq pattern or title
  // The notice "2026년 지자체 출산지원금 업데이트 진행중" should be excluded
  const dataItems = items.filter(i => !i.title.includes('업데이트 진행중') && !i.title.includes('업데이트'));

  console.log(`📋 ${dataItems.length} items after filtering notices\n`);

  // Step 2: Fetch detail pages
  const results = [];
  const failed = [];

  for (let i = 0; i < dataItems.length; i++) {
    const item = dataItems[i];
    console.log(`📖 [${i + 1}/${dataItems.length}] ${item.title || item.seq}...`);
    try {
      const html = await fetchHTML(`${DETAIL_URL}&seq=${item.seq}`);
      const parsed = parseDetail(html, item.seq);
      if (!parsed.title && item.title) parsed.title = item.title;
      results.push(parsed);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      failed.push({ seq: item.seq, title: item.title, error: err.message });
    }
    await delay(500);
  }

  // Step 3: Save
  const output = {
    source: 'https://www.childcare.go.kr/?menuno=279',
    collected_at: new Date().toISOString(),
    total_count: results.length,
    failed_count: failed.length,
    failed,
    data: results
  };

  const outPath = resolve(__dirname, '..', 'data', 'birth-grants-crawled.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Done! ${results.length} items saved to data/birth-grants-crawled.json`);
  if (failed.length > 0) {
    console.log(`⚠️  ${failed.length} items failed:`);
    failed.forEach(f => console.log(`   - ${f.title} (${f.seq}): ${f.error}`));
  }
}

main().catch(console.error);
