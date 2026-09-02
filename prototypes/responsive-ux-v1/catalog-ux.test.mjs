import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html=fs.readFileSync(new URL("./index.html",import.meta.url),"utf8");

function section(source,start,end){
  const i=source.indexOf(start);
  const j=source.indexOf(end,i);
  assert.ok(i>=0&&j>i,"missing section "+start);
  return source.slice(i,j);
}

test("catalog pagination returns ten quizzes per page and clamps page numbers",()=>{
  const match=html.match(/function paginateCatalog\(items,page\)\{[^}]+\}\}/);
  assert.ok(match,"paginateCatalog helper must exist");
  const paginate=Function("const CATALOG_PAGE_SIZE=10;"+match[0]+";return paginateCatalog")();
  const items=Array.from({length:21},(_,index)=>index+1);
  assert.deepEqual(paginate(items,1),{pageCount:3,safePage:1,items:[1,2,3,4,5,6,7,8,9,10]});
  assert.deepEqual(paginate(items,2),{pageCount:3,safePage:2,items:[11,12,13,14,15,16,17,18,19,20]});
  assert.deepEqual(paginate(items,99),{pageCount:3,safePage:3,items:[21]});
});

test("detail has localized back-to-catalog control",()=>{
  assert.match(html,/class="catalogBack"/);
  assert.match(html,/Back to all quizzes/);
  assert.ok(html.includes("\\u8fd4\\u56de\\u5168\\u90e8\\u6e2c\\u9a57")||html.includes("返回全部測驗"));
});

test("catalog has semantic conditional pagination and primary quiz actions",()=>{
  assert.match(html,/class="catalogPagination"/);
  assert.match(html,/aria-current="page"/);
  assert.match(html,/class="catalogCta primary"/);
});
