export const clamp = (value,min,max) => Math.min(max,Math.max(min,value));

export function outputSize(width,height) {
  const scale = Math.min(1,4096/Math.max(width,height),Math.sqrt(8000000/(width*height)));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}

export function photoPlacement(width,height,photoWidth,photoHeight,zoom=1,x=0,y=0) {
  const scale = Math.max(width/photoWidth,height/photoHeight)*clamp(zoom,1,3);
  const drawWidth = photoWidth*scale, drawHeight = photoHeight*scale;
  const panX = Math.max(0,(drawWidth-width)/2), panY = Math.max(0,(drawHeight-height)/2);
  return {width:drawWidth,height:drawHeight,left:(width-drawWidth)/2+clamp(x,-1,1)*panX,top:(height-drawHeight)/2+clamp(y,-1,1)*panY,panX,panY};
}
