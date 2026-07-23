// 공정위 원본 TSV(../../data/ftc_raw_*.tsv)를 파싱해 src/content/companies/*.json 을 생성한다.
// 손으로 옮겨 적지 않고 스크립트로만 생성 — 숫자 오기입으로 인한 법적 리스크를 원천 차단하기 위함.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../data');
const files = readdirSync(dataDir).filter((f) => f.startsWith('ftc_raw_') && f.endsWith('.tsv'));
if (files.length === 0) throw new Error('ftc_raw_*.tsv 파일을 data/ 에서 찾을 수 없습니다.');
const srcFile = files.sort().at(-1); // 가장 최근 스냅샷 사용
const asOfDate = srcFile.match(/ftc_raw_(\d{4}-\d{2}-\d{2})/)[1];
const raw = readFileSync(path.join(dataDir, srcFile), 'utf-8');
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);

// 5번째 줄(index 4)까지가 헤더(제목+병합 컬럼), 실제 데이터는 6번째 줄(index 5)부터
const rows = lines.slice(5).map((l) => l.split('\t'));

const num = (s) => {
  if (s === undefined || s === '' || s === null) return null;
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const dateStr = (s) => {
  if (!s || s.length !== 8) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
};
const slugify = (name, regNo) =>
  regNo
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '');

const outDir = path.join(__dirname, '../src/content/companies');
mkdirSync(outDir, { recursive: true });
// 이전 실행분 정리 후 재생성 (중복/구버전 잔존 방지)
for (const f of readdirSync(outDir)) {
  if (f.endsWith('.json')) unlinkSync(path.join(outDir, f));
}

let count = 0;
let capitalErosionFull = 0; // 완전자본잠식 (자본총계 < 0)
let capitalErosionPartial = 0; // 부분자본잠식 (0 <= 자본총계 < 자본금)
const summaryRows = [];

for (const cols of rows) {
  if (cols.length < 38) continue;
  const status = cols[10]?.trim();
  if (status !== '정상영업') continue; // 정상영업 상태만 사이트에 게시 (제외 범위: 폐업/취소 업체는 별도 처리)

  const name = cols[0]?.trim();
  const regNo = cols[2]?.trim();
  if (!name || !regNo) continue;

  const totalAssets = num(cols[21]);
  const totalLiabilities = num(cols[24]);
  const totalEquity = num(cols[25]);
  const capital = num(cols[26]);
  const totalPrepayment = num(cols[31]);
  const guaranteeRatio = num(cols[32]);

  let capitalStatus = '정상';
  if (totalEquity !== null) {
    if (totalEquity < 0) { capitalStatus = '완전자본잠식'; capitalErosionFull++; }
    else if (capital !== null && totalEquity < capital) { capitalStatus = '부분자본잠식'; capitalErosionPartial++; }
  }

  const entry = {
    name,
    ceoNameMasked: cols[1]?.trim() || null,
    regNumber: regNo,
    regDate: dateStr(cols[3]?.trim()),
    corpRegNumber: cols[4]?.trim() || null,
    bizRegNumber: cols[5]?.trim() || null,
    corpAddress: cols[6]?.trim() || null,
    officeAddress: cols[7]?.trim() || null,
    phone: cols[8]?.trim() || null,
    email: cols[9]?.trim() || null,
    status,
    businessStartDate: dateStr(cols[11]?.trim()),
    finance: {
      currentAssets: num(cols[19]),
      fixedAssets: num(cols[20]),
      totalAssets,
      currentLiabilities: num(cols[22]),
      nonCurrentLiabilities: num(cols[23]),
      totalLiabilities,
      totalEquity,
      capital,
      capitalStatus,
      solvencyRatioCompany: num(cols[27]),
      solvencyRatioAverage: num(cols[28]),
      debtRatioCompany: num(cols[29]),
      debtRatioAverage: num(cols[30]),
    },
    prepayment: {
      totalPrepayment,
      guaranteeRatio,
      guaranteeInstitution: cols[33]?.trim() || null,
      guaranteeType: cols[34]?.trim() || null,
      guaranteeAmount: num(cols[35]),
      guaranteeInstitutionDetail: cols[36]?.trim() || null,
    },
    source: {
      name: '공정거래위원회 선불식할부거래사업자 정보공개',
      url: 'https://www.ftc.go.kr/www/selectBizPpitOpenList.do?key=250',
      asOfDate,
    },
  };

  const slug = slugify(name, regNo);
  writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(entry, null, 2), 'utf-8');
  summaryRows.push({ name, regNo, totalEquity, capital, capitalStatus, totalPrepayment, guaranteeRatio });
  count++;
}

console.log(`생성 완료: ${count}개 업체 (기준일 ${asOfDate})`);
console.log(`완전자본잠식(자본총계<0): ${capitalErosionFull}개`);
console.log(`부분자본잠식(0<=자본총계<자본금): ${capitalErosionPartial}개`);

writeFileSync(
  path.join(__dirname, '../src/content/companies-summary.json'),
  JSON.stringify({ asOfDate, count, capitalErosionFull, capitalErosionPartial, rows: summaryRows }, null, 2),
  'utf-8'
);
