#!/usr/bin/env node
/**
 * BebeCare 공공 데이터 수집 스크립트
 * 
 * 데이터는 이미 수동으로 수집/작성되어 data/ 디렉토리에 저장되어 있습니다.
 * 이 스크립트는 데이터 검증 및 리포트를 위한 유틸리티입니다.
 * 
 * 실행: node scripts/collect-data.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

const files = [
  { file: 'vaccinations.json', countKey: 'vaccinations' },
  { file: 'birth-grants.json', countKey: 'grants' },
  { file: 'health-checkups.json', countKey: null },
  { file: 'government-benefits.json', countKey: 'benefits' },
];

console.log('=== BebeCare 공공 데이터 리포트 ===\n');

for (const { file, countKey } of files) {
  try {
    const data = JSON.parse(readFileSync(join(dataDir, file), 'utf-8'));
    const count = countKey ? data[countKey]?.length : 
      `영유아검진 ${data.infant_checkups?.length}회 + 구강검진 ${data.infant_oral_checkups?.length}회 + 산전검진 ${data.prenatal_checkups?.length}개 트리메스터`;
    console.log(`✅ ${file}`);
    console.log(`   제목: ${data.title}`);
    console.log(`   레코드: ${count}`);
    console.log(`   수집일: ${data.collected_at}`);
    console.log();
  } catch (e) {
    console.log(`❌ ${file}: ${e.message}\n`);
  }
}
