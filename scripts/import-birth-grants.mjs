import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// Load env
const envContent = readFileSync(resolve(PROJECT_ROOT, '.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const API = `${SUPABASE_URL}/rest/v1`;

// Load crawled data
const raw = JSON.parse(readFileSync(resolve(PROJECT_ROOT, 'data/birth-grants-crawled.json'), 'utf-8'));
const items = raw.data;

console.log(`📦 Loaded ${items.length} items`);

// --- Helpers ---

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\[등록일[^\]]*\]/g, '').trim();
}

function buildBody(item) {
  const { raw_content, local_grants, title } = item;

  if (!raw_content || raw_content.trim().length === 0) {
    return `${title}\n\n자세한 출산지원금 정보는 해당 지자체에 문의하시기 바랍니다.`;
  }

  let body = '';

  // 첫만남이용권 section (common across all)
  const firstBabyMatch = raw_content.match(/\[첫만남 이용권\]([\s\S]*?)(?=\n\n\[|$)/);
  if (firstBabyMatch) {
    body += '## 첫만남 이용권 (공통)\n\n';
    body += cleanText(firstBabyMatch[1]).split('\n').filter(l => l.trim()).join('\n') + '\n\n';
  }

  // Local grants from parsed data
  if (local_grants && local_grants.length > 0) {
    for (const grant of local_grants) {
      body += `## ${grant.name}\n\n`;
      if (grant.amount) body += `💰 지원금액: ${grant.amount}\n`;
      if (grant.condition) body += `👤 지원대상: ${grant.condition}\n\n`;
      if (grant.detail) {
        // Extract detail lines but skip what we already showed
        const lines = cleanText(grant.detail).split('\n').filter(l => l.trim());
        body += lines.join('\n') + '\n\n';
      }
    }
  } else {
    // No parsed local_grants — use raw_content sections after 첫만남이용권
    const afterFirst = raw_content.replace(/\[첫만남 이용권\][\s\S]*?(?=\n\n\[)/, '').trim();
    const sections = afterFirst.match(/\[[^\]]+\][\s\S]*?(?=\n\n\[|$)/g);
    if (sections) {
      for (const sec of sections) {
        const nameMatch = sec.match(/^\[([^\]]+)\]/);
        if (nameMatch && !nameMatch[1].startsWith('등록일')) {
          body += `## ${nameMatch[1]}\n\n`;
          body += cleanText(sec.replace(/^\[[^\]]+\]\s*/, '')) + '\n\n';
        }
      }
    }
  }

  // other_benefits mention
  if (item.other_benefits && item.other_benefits.length > 0) {
    // Check if already covered in local_grants
    const coveredNames = (local_grants || []).map(g => g.name);
    const uncovered = item.other_benefits.filter(b => !coveredNames.includes(b));
    // These are usually already in raw_content, handled above
  }

  return body.trim() || cleanText(raw_content);
}

function buildSummary(item) {
  const { region_province, region_city, local_grants } = item;
  const region = region_city ? `${region_province} ${region_city}` : region_province;

  if (local_grants && local_grants.length > 0) {
    const amounts = local_grants.map(g => g.amount).filter(Boolean);
    if (amounts.length > 0) {
      return `${region} 출산지원금: ${amounts[0]}`;
    }
  }

  return `${region} 출산지원금 안내 (첫만남이용권 포함)`;
}

function toRow(item) {
  const tags = ['출산지원금', item.region_province];
  if (item.region_city) tags.push(item.region_city);

  return {
    category: 'government_support',
    subcategory: '출산지원금',
    stage: null,
    title: item.title,
    body: buildBody(item),
    summary: buildSummary(item),
    source_url: item.source_url || null,
    region_filter: item.region_province,
    tags,
    priority: 3,
  };
}

// --- Main ---

async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res;
}

async function main() {
  // 1. Delete existing 출산지원금 data
  console.log('🗑️  Deleting existing subcategory=출산지원금 ...');
  await supabaseFetch('/contents?subcategory=eq.출산지원금', { method: 'DELETE' });
  console.log('✅ Deleted');

  // 2. Transform all items
  const rows = items.map(toRow);
  console.log(`📝 Transformed ${rows.length} rows`);

  // 3. Batch insert (50 at a time)
  let inserted = 0;
  let failed = 0;
  const regionCount = {};

  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    try {
      await supabaseFetch('/contents', {
        method: 'POST',
        body: JSON.stringify(batch),
      });
      inserted += batch.length;
      for (const r of batch) {
        regionCount[r.region_filter] = (regionCount[r.region_filter] || 0) + 1;
      }
      console.log(`  ✅ Batch ${Math.floor(i / 50) + 1}: ${batch.length} rows`);
    } catch (err) {
      failed += batch.length;
      console.error(`  ❌ Batch ${Math.floor(i / 50) + 1} failed:`, err.message);
    }
  }

  // 4. Report
  console.log('\n📊 결과 리포트');
  console.log('='.repeat(40));
  console.log(`총 insert: ${inserted}건`);
  console.log(`실패: ${failed}건`);
  console.log(`\n지역별 건수:`);
  for (const [region, count] of Object.entries(regionCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${region}: ${count}건`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
