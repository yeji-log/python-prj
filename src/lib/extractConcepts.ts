import { CONCEPT_TEMPLATES } from "./conceptData";
import { Concept, ExtractResult } from "./types";

const MAX_EXCERPT_LINES = 6;
const MAX_EXCERPT_CHARS = 260;
const MIN_EXCERPT_CHARS = 15;

/**
 * 원문에서 keywords 중 하나가 들어있는 줄을 찾아, 그 줄부터
 * 빈 줄이 나오거나 줄 수/글자 수 한도에 닿을 때까지 이어붙여
 * "자료에서 가져온 설명"으로 사용한다. 못 찾으면 null.
 */
function findExcerpt(lines: string[], keywords: string[]): string | null {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  const startIdx = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lowerKeywords.some((k) => lower.includes(k));
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
    const matched = tpl.keywords.some((k) => lower.includes(k.toLowerCase()));
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
