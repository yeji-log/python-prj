import { CONCEPT_TEMPLATES } from "./conceptData";
import { Concept, ExtractResult } from "./types";

const MAX_EXCERPT_LINES = 6;
const MAX_EXCERPT_CHARS = 260;
const MIN_EXCERPT_CHARS = 15;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 단순 문자열 포함(includes) 검사는 "int(" 가 "print(" 안에,
 * ".dict(" 가 "predict(" 안에 들어있는 것처럼 단어 중간과 우연히 겹치는
 * 오탐이 생긴다. 키워드 앞에 영문자/숫자/밑줄이 붙어있지 않을 때만
 * 매칭되도록 해서 이런 오탐을 막는다.
 */
function keywordAppears(lowerText: string, lowerKeyword: string): boolean {
  const pattern = new RegExp(`(?<![a-z0-9_])${escapeRegExp(lowerKeyword)}`, "i");
  return pattern.test(lowerText);
}

/**
 * 원문에서 keywords 중 하나가 들어있는 줄을 찾아, 그 줄부터
 * 빈 줄이 나오거나 줄 수/글자 수 한도에 닿을 때까지 이어붙여
 * "자료에서 가져온 설명"으로 사용한다. 못 찾으면 null.
 */
function findExcerpt(lines: string[], keywords: string[]): string | null {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const startIdx = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lowerKeywords.some((k) => keywordAppears(lower, k));
  });
  if (startIdx === -1) return null;

  const collected: string[] = [];
  let chars = 0;
  for (let i = startIdx; i < lines.length && collected.length < MAX_EXCERPT_LINES; i += 1) {
    const line = lines[i].trim();
    if (line === "" && collected.length > 0) break; // 문단 끝
    if (line === "") continue; // 시작 전 빈 줄은 건너뜀
    collected.push(line);
    chars += line.length;
    if (chars >= MAX_EXCERPT_CHARS) break;
  }

  const excerpt = collected.join(" ").slice(0, MAX_EXCERPT_CHARS).trim();
  if (excerpt.length < MIN_EXCERPT_CHARS) return null;
  return excerpt;
}

/**
 * 붙여넣은 수업 자료(rawMaterial)에서 파이썬 개념을 추출한다.
 * - 빈 입력 -> { ok:false, reason:'empty' } (실패 케이스 1)
 * - 어떤 개념 키워드도 매칭되지 않음 -> { ok:false, reason:'no-match' } (실패 케이스 2)
 */
export function extractConcepts(rawMaterial: string): ExtractResult {
  const trimmed = rawMaterial.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const lower = trimmed.toLowerCase();
  const lines = trimmed.split(/\r?\n/);

  const concepts: Concept[] = [];
  for (const tpl of CONCEPT_TEMPLATES) {
    const matched = tpl.keywords.some((k) => keywordAppears(lower, k.toLowerCase()));
    if (!matched) continue;

    const excerpt = findExcerpt(lines, tpl.keywords);
    concepts.push({
      id: tpl.id,
      title: tpl.title,
      explanation: excerpt ?? tpl.defaultExplanation,
      explanationSource: excerpt ? "material" : "default",
      questionBank: tpl.questionBank,
    });
  }

  if (concepts.length === 0) {
    return { ok: false, reason: "no-match" };
  }

  return { ok: true, concepts };
}
