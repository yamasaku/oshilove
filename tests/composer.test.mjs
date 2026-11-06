import test from "node:test";
import assert from "node:assert/strict";
import {photoPlacement,outputSize} from "../composer-core.mjs";

test("portrait and landscape photos always cover the full frame",()=>{
  for(const [photoWidth,photoHeight] of [[4000,3000],[3000,4000],[1080,1920]]) {
    for(const zoom of [1,1.5,3])for(const x of [-1,0,1])for(const y of [-1,0,1]) {
      const result=photoPlacement(1080,1920,photoWidth,photoHeight,zoom,x,y);
      assert.ok(result.left<=0.000001 && result.top<=0.000001);
      assert.ok(result.left+result.width>=1079.999999 && result.top+result.height>=1919.999999);
    }
  }
});

test("position and zoom are clamped without exposing empty canvas edges",()=>{
  assert.deepEqual(photoPlacement(1080,1920,1080,1920,0,-99,99),photoPlacement(1080,1920,1080,1920,1,-1,1));
  assert.deepEqual(photoPlacement(1080,1920,1000,1000,100,99,-99),photoPlacement(1080,1920,1000,1000,3,1,-1));
});

test("export keeps story resolution and bounds unusually large images",()=>{
  assert.deepEqual(outputSize(1080,1920),{width:1080,height:1920});
  const large=outputSize(10000,10000);
  assert.ok(large.width<=4096 && large.height<=4096 && large.width*large.height<8005000);
});
