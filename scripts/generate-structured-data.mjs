#!/usr/bin/env node
/**
 * government_support 콘텐츠에 structured_data 일괄 생성
 * body 텍스트에서 핵심 정보 파싱
 */

const SUPABASE_URL = 'https://mvvnmzypxvjqpuvqrxlo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dm5tenlweHZqcXB1dnFyeGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ1NDg0MiwiZXhwIjoyMDg2MDMwODQyfQ.4acg8D0Q0jwqdLjnJG_pbUm0pEfvEwv_-ZgIG5EWAd0';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

function extractStructuredData(title, body, summary) {
  const data = {};
  const text = body || '';
  
  // 지원금액 추출
  const amountPatterns = [
    /지원금액[:\s]*(.+?)(?:\n|$)/,
    /💰\s*지원금액[:\s]*(.+?)(?:\n|$)/,
    /지원내용[:\s]*(.+?)(?:\n|$)/,
    /(\d+만원[^\n]*)/,
  ];
  for (const p of amountPatterns) {
    const m = text.match(p);
    if (m) {
      let val = m[1].trim().replace(/^[:\s]+/, '');
      if (val.length > 5 && val.length < 200) {
        data['지원금액'] = val;
        break;
      }
    }
  }
  
  // 지원대상 추출
  const targetPatterns = [
    /지원대상[:\s]*(.+?)(?:\n|$)/,
    /💼\s*지원대상[:\s]*(.+?)(?:\n|$)/,
    /대상[:\s]*(.+?)(?:\n|$)/,
  ];
  for (const p of targetPatterns) {
    const m = text.match(p);
    if (m) {
      let val = m[1].trim().replace(/^[:\s]+/, '');
      if (val.length > 3 && val.length < 200) {
        data['대상'] = val;
        break;
      }
    }
  }
  
  // 신청방법/신청처
  const applyPatterns = [
    /신청방법[:\s]*(.+?)(?:\n|$)/,
    /신청\s*장소[:\s]*(.+?)(?:\n|$)/,
    /발급처[:\s]*(.+?)(?:\n|$)/,
  ];
  for (const p of applyPatterns) {
    const m = text.match(p);
    if (m) {
      let val = m[1].trim().replace(/^[:\s]+/, '');
      if (val.length > 3 && val.length < 200) {
        data['신청처'] = val;
        break;
      }
    }
  }
  
  // 신청기간
  const periodPatterns = [
    /신청\s*기간[:\s]*\n?(.+?)(?:\n|$)/,
    /사용기간[:\s]*(.+?)(?:\n|$)/,
    /발급기간[:\s]*(.+?)(?:\n|$)/,
  ];
  for (const p of periodPatterns) {
    const m = text.match(p);
    if (m) {
      let val = m[1].trim().replace(/^[:\s]+/, '');
      if (val.length > 3 && val.length < 200) {
        data['신청기간'] = val;
        break;
      }
    }
  }
  
  // 사용처
  const usagePatterns = [
    /사용처[:\s]*(.+?)(?:\n|$)/,
    /사용\s*가능[:\s]*(.+?)(?:\n|$)/,
  ];
  for (const p of usagePatterns) {
    const m = text.match(p);
    if (m) {
      let val = m[1].trim().replace(/^[:\s]+/, '');
      if (val.length > 3 && val.length < 200) {
        data['사용처'] = val;
        break;
      }
    }
  }
  
  // 특이사항 (출처 URL)
  const sourceMatch = text.match(/출처[:\s]*(https?:\/\/[^\s\n]+)/);
  if (sourceMatch) {
    data['출처'] = sourceMatch[1];
  }
  
  // 담당부서
  const deptMatch = text.match(/담당부서[:\s]*(.+?)(?:\n|$)/);
  if (deptMatch) {
    data['담당부서'] = deptMatch[1].trim();
  }

  // 지역 출산지원금의 경우 첫째/둘째/셋째 금액 추출
  const childAmounts = [];
  const firstChild = text.match(/첫째[^:]*[:\s]*(\d+만원[^\n]*)/);
  const secondChild = text.match(/둘째[^:]*[:\s]*(\d+만원[^\n]*)/);
  const thirdChild = text.match(/셋째[^:]*[:\s]*(\d+만원[^\n]*)/);
  if (firstChild) childAmounts.push(`첫째 ${firstChild[1].trim()}`);
  if (secondChild) childAmounts.push(`둘째 ${secondChild[1].trim()}`);
  if (thirdChild) childAmounts.push(`셋째 ${thirdChild[1].trim()}`);
  if (childAmounts.length > 0 && !data['지원금액']) {
    data['지원금액'] = childAmounts.join(' / ');
  } else if (childAmounts.length > 0) {
    data['자녀별 금액'] = childAmounts.join(' / ');
  }

  return Object.keys(data).length >= 2 ? data : null;
}

async function main() {
  // Fetch all government_support without structured_data
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/contents?category=eq.government_support&structured_data=is.null&select=id,title,body,summary&limit=300`,
    { headers }
  );
  const records = await res.json();
  console.log(`Found ${records.length} records without structured_data`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const rec of records) {
    const data = extractStructuredData(rec.title, rec.body, rec.summary);
    if (!data) {
      skipped++;
      continue;
    }
    
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/contents?id=eq.${rec.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ structured_data: data }),
      }
    );
    
    if (updateRes.ok) {
      updated++;
      if (updated % 20 === 0) console.log(`Updated ${updated}...`);
    } else {
      console.error(`Failed to update ${rec.id}: ${updateRes.status}`);
    }
  }
  
  console.log(`Done! Updated: ${updated}, Skipped (not enough data): ${skipped}`);
}

main().catch(console.error);
