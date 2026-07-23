import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    category: z.string(),
    heroImage: z.string().optional(),
  }),
});

const financeSchema = z.object({
  currentAssets: z.number().nullable(),
  fixedAssets: z.number().nullable(),
  totalAssets: z.number().nullable(),
  currentLiabilities: z.number().nullable(),
  nonCurrentLiabilities: z.number().nullable(),
  totalLiabilities: z.number().nullable(),
  totalEquity: z.number().nullable(),
  capital: z.number().nullable(),
  // 자본총계 < 0 이면 완전자본잠식, 0 <= 자본총계 < 자본금 이면 부분자본잠식 — 공정위 공시 수치를 그대로 계산한 결과이며 자체 평가가 아님
  capitalStatus: z.enum(['정상', '부분자본잠식', '완전자본잠식']),
  solvencyRatioCompany: z.number().nullable(),
  solvencyRatioAverage: z.number().nullable(),
  debtRatioCompany: z.number().nullable(),
  debtRatioAverage: z.number().nullable(),
});

const prepaymentSchema = z.object({
  totalPrepayment: z.number().nullable(),
  guaranteeRatio: z.number().nullable(),
  guaranteeInstitution: z.string().nullable(),
  guaranteeType: z.string().nullable(),
  guaranteeAmount: z.number().nullable(),
  guaranteeInstitutionDetail: z.string().nullable(),
});

const companies = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    ceoNameMasked: z.string().nullable(),
    regNumber: z.string(),
    regDate: z.string().nullable(),
    corpRegNumber: z.string().nullable(),
    bizRegNumber: z.string().nullable(),
    corpAddress: z.string().nullable(),
    officeAddress: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    status: z.string(),
    businessStartDate: z.string().nullable(),
    finance: financeSchema,
    prepayment: prepaymentSchema,
    source: z.object({
      name: z.string(),
      url: z.string(),
      asOfDate: z.string(),
    }),
  }),
});

export const collections = { posts, companies };
