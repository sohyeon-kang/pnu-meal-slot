import test from 'node:test';
import assert from 'node:assert/strict';
import { restaurants } from '../docs/data.js';
import { filterRestaurants, drawRestaurant, normalizeFilters, EMPTY_FILTERS } from '../docs/engine.js';
const sample=[
  {id:'a',cuisine:'한식',tastes:['매콤'],meals:['밥'],reviewCount:500},
  {id:'b',cuisine:'중식',tastes:['매콤','진한'],meals:['밥','면'],reviewCount:1000},
  {id:'c',cuisine:'일식',tastes:['담백'],meals:['밥'],reviewCount:99},
  {id:'d',cuisine:'한식',tastes:['매콤'],meals:['밥'],reviewCount:null},
];
test('every restaurant has unique identity, explicit evidence status and supported tags',()=>{
  assert.ok(restaurants.length>74,'Requested additions must be retained');
  for(const key of ['id','name','naverPlaceUrl'])assert.equal(new Set(restaurants.map(r=>r[key])).size,restaurants.length,key);
  for(const r of restaurants){
    if(r.naverVerified) assert.equal(r.sourceName,'네이버 지도',r.name);
    else {
      assert.equal(r.verificationStatus,'naver_pending',r.name);
      assert.equal(r.rating,null,r.name);
      assert.equal(r.reviewCount,null,r.name);
      assert.ok(!r.reviewCountText && r.evidence.length,r.name);
    }
    assert.match(r.naverPlaceUrl,/^https:\/\/(map|m\.place)\.naver\.com\//,r.name);
    assert.ok(r.rating===null||Number.isFinite(r.rating)&&r.rating>=0&&r.rating<=5,r.name);
    assert.ok(r.reviewCount===null||Number.isInteger(r.reviewCount)&&r.reviewCount>=0,r.name);
    assert.ok(r.menu&&r.address&&r.checkedAt,r.name);
    assert.ok(['한식','중식','양식','일식','아시안','분식'].includes(r.cuisine),r.name);
    assert.ok(r.tastes.length&&r.tastes.every(v=>['매콤','달콤','담백','진한'].includes(v)),r.name);
    assert.ok(r.meals.length&&r.meals.every(v=>['밥','면','고기','빵','분식'].includes(v)),r.name);
  }
});
test('dinner and pending-lunch places remain searchable but cannot be drawn, including from favorites',()=>{
  const evening={...sample[0],lunchEligible:false};
  assert.deepEqual(filterRestaurants([evening,sample[1]],EMPTY_FILTERS),[sample[1]]);
  assert.deepEqual(filterRestaurants([evening],{...EMPTY_FILTERS,favoritesOnly:true},['a']),[]);
  assert.equal(drawRestaurant([evening]),null);
  assert.equal(drawRestaurant([evening,sample[1]],[],false,()=>0).restaurant.id,'b');
});
test('all user-mentioned restaurants are present while the explicit exclusion stays out',()=>{
  for(const name of ['마마도마','육수재','동동국밥','덮밥장사장','안다미로','수수굉','지마미','곁집','니노마에','키무엔','스스키노']) {
    assert.ok(restaurants.some(r=>[r.name,...(r.aliases||[])].some(n=>n.includes(name))),name);
  }
  assert.ok(!restaurants.some(r=>r.name.includes('밥집오빠')));
  assert.equal(restaurants.find(r=>r.name==='자마미등갈비').lunchEligible,false);
});
test('empty filters include restaurants without a numeric review count',()=>assert.deepEqual(filterRestaurants(sample,EMPTY_FILTERS),sample));
test('abbreviated Naver counts retain their display text while supporting broad review filters',()=>{
  const popular={...sample[0],reviewCount:null,reviewCountText:'1.1만'};
  assert.deepEqual(filterRestaurants([popular],{...EMPTY_FILTERS,minReviews:1000}),[popular]);
});
test('OR within categories, AND across categories; missing counts never meet a review threshold',()=>{
  const filters={...EMPTY_FILTERS,cuisines:['한식','중식'],tastes:['매콤'],meals:['밥'],minReviews:500};
  assert.deepEqual(filterRestaurants(sample,filters),sample.slice(0,2));
  assert.deepEqual(filterRestaurants(sample,{...filters,meals:['면']}),[sample[1]]);
  assert.deepEqual(filterRestaurants(sample,{...filters,minReviews:1000}),[sample[1]]);
});
test('favorites constrain the draw; empty favorites cannot produce a result',()=>{
  const filters={...EMPTY_FILTERS,favoritesOnly:true};
  assert.deepEqual(filterRestaurants(sample,filters),[]);
  assert.deepEqual(filterRestaurants(sample,filters,['b','unknown']),[sample[1]]);
  assert.equal(drawRestaurant([]),null);
});
test('recent candidates are excluded; exhausted candidates fall back with an explicit flag',()=>{
  const two=sample.slice(0,2);
  assert.equal(drawRestaurant(two,['a'],true,()=>0).restaurant.id,'b');
  const result=drawRestaurant(two,['a','b'],true,()=>.99);
  assert.equal(result.restaurant.id,'b');assert.equal(result.recycled,true);
  assert.equal(drawRestaurant(two,['a'],false,()=>0).restaurant.id,'a');
});
test('equal-width random intervals select every candidate regardless of popularity',()=>{
  for(let i=0;i<sample.length;i++)assert.equal(drawRestaurant(sample,[],false,()=>(i+.5)/sample.length).restaurant.id,sample[i].id);
});
test('old rating filters and corrupt stored values migrate safely without losing valid preferences',()=>{
  assert.deepEqual(normalizeFilters({cuisines:'한식',tastes:['가짜','매콤','매콤'],minRating:4.5,minReviews:999,favoritesOnly:'yes'}),{...EMPTY_FILTERS,tastes:['매콤']});
  assert.deepEqual(normalizeFilters({cuisines:['한식'],minReviews:500,favoritesOnly:true,avoidRecent:false}),{...EMPTY_FILTERS,cuisines:['한식'],minReviews:500,favoritesOnly:true,avoidRecent:false});
});
