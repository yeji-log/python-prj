export type NotebookParseResult =
  | { ok: true; text: string }
  | { ok: false; reason: "invalid-json" | "invalid-notebook" | "empty" };

interface RawNotebookCell {
  cell_type?: string;
  source?: string[] | string;
}

interface RawNotebook {
  cells?: RawNotebookCell[];
}

/**
 * .ipynb(코랩/주피터 노트북) 파일 내용을 개념 추출기가 읽을 수 있는
 * 평문 텍스트로 변환한다. 마크다운 셀은 설명 문단으로, 코드 셀은
 * 코드 그대로 이어붙여 키워드 매칭(for, if, def ...)에 활용한다.
 */
export function parseNotebookToText(rawJson: string): NotebookParseResult {
  let parsed: RawNotebook;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (!parsed || !Array.isArray(parsed.cells)) {
    return { ok: false, reason: "invalid-notebook" };
  }

  const parts: string[] = [];
  for (const cell of parsed.cells) {
    const source = cell?.source;
    const text = Array.isArray(source)
      ? source.join("")
      : typeof source === "string"
        ? source
        : "";
    const trimmed = text.trim();
    if (trimmed) parts.push(trimmed);
  }

  const combined = parts.join("\n\n").trim();
  if (!combined) {
    return { ok: false, reason: "empty" };
  }
  return { ok: true, text: combined };
}
