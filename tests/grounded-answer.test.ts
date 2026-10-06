import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEvidence, renderGroundedAnswer, OUT_OF_SCOPE } from '../lib/grounded-answer';
const sources = [
  {id:'policy',document_id:'p',content:'Every reply requires approval.',similarity:0.8},
  {id:'brief',document_id:'b',content:'No public launch date has been approved.',similarity:0.7},
];
test('fabricated quotes or quotes attributed to the wrong passage cannot become citations', () => {
  assert.deepEqual(validateEvidence([{text:'No approved date.',evidence:[{sourceIndex:1,quote:sources[1].content}]}],sources),[]);
});
test('only supporting sources are shown and numbers are assigned by the renderer', () => {
  const claims = validateEvidence([{text:'No public date is approved [99].',evidence:[{sourceIndex:2,quote:sources[1].content}]}],sources);
  const answer = renderGroundedAnswer(claims,sources);
  assert.equal(answer.sources.length,1);
  assert.equal(answer.sources[0].id,'brief');
  assert.match(answer.text,/\[1\]/);
  assert.ok(!answer.text.includes('[99]'));
});
test('unsupported questions have no source cards', () => {
  assert.deepEqual(renderGroundedAnswer([],sources),{text:OUT_OF_SCOPE,sources:[]});
});
