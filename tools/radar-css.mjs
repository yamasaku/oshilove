import fs from 'node:fs';
import postcss from 'postcss';
import selectors from 'postcss-selector-parser';

export function buildRadarCSS(root, output) {
  const css=postcss.parse(['style.css','calendar.css'].map(f=>fs.readFileSync(root+'/radar-assets/'+f,'utf8')).join('\n'));
  css.walkAtRules('import',r=>r.remove());
  css.walkRules(rule=>{
    if(rule.parent.type==='atrule' && /keyframes$/i.test(rule.parent.name))return;
    rule.selector=selectors(ast=>ast.each(selector=>{
      let anchored=false;
      selector.walk(node=>{
        if((node.type==='tag'&&['html','body'].includes(node.value))||(node.type==='pseudo'&&node.value===':root')){
          node.replaceWith(selectors.className({value:'radar-app'}));anchored=true;
        }
      });
      if(!anchored){selector.prepend(selectors.combinator({value:' '}));selector.prepend(selectors.className({value:'radar-app'}));}
    })).processSync(rule.selector);
  });
  css.walkDecls(d=>{if(d.value.includes('gradient('))d.remove();if(d.prop==='font-family')d.value='var(--site-font)';});
  fs.writeFileSync(output,css.toString()+'\n'+fs.readFileSync(root+'/radar-assets/theme.css','utf8'));
}
