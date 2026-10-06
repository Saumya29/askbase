import type { RetrievedChunk } from './retrieval';

export type AnswerClaim = { text: string; evidence: { sourceIndex: number; quote: string }[] };
export const OUT_OF_SCOPE = 'The available documents do not cover that question. Upload a relevant document or ask about one listed in the sidebar.';
const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

export function validateEvidence(claims: AnswerClaim[], sources: RetrievedChunk[]) {
  return claims.filter(claim => claim.text.trim() && claim.evidence.length && claim.evidence.every(e => {
    const source = sources[e.sourceIndex - 1];
    return source && normalize(e.quote).length >= 12 && normalize(source.content).includes(normalize(e.quote));
  }));
}

export function renderGroundedAnswer(claims: AnswerClaim[], sources: RetrievedChunk[]) {
  const used: RetrievedChunk[] = [];
  const lines = claims.map(claim => {
    const refs = [...new Set(claim.evidence.map(e => {
      const source = sources[e.sourceIndex - 1];
      let index = used.findIndex(s => s.id === source.id);
      if (index < 0) {
        index = used.length;
        used.push({ ...source, content: claim.evidence.filter(q => q.sourceIndex === e.sourceIndex).map(q => q.quote).join('\n\n') });
      } else {
        for (const q of claim.evidence.filter(q => q.sourceIndex === e.sourceIndex)) {
          if (!used[index].content.includes(q.quote)) used[index].content += '\n\n' + q.quote;
        }
      }
      return index + 1;
    }))];
    return `${claim.text.replace(/\[\d+\]/g, '').trim()} ${refs.map(n => `[${n}]`).join('')}`;
  });
  return { text: lines.length ? lines.join('\n\n') : OUT_OF_SCOPE, sources: used };
}
