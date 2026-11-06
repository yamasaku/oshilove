import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {spawn} from "node:child_process";
import {parseArgs} from "node:util";
import {createInterface} from "node:readline/promises";
import {prepareSeries, hash, colours} from "./materials-lib.mjs";

const root = fileURLToPath(new URL("../",import.meta.url));
const workRoot = path.join(root,".material-work");
const catalogFile = path.join(root,"resources-data.json");
const planFile = path.join(workRoot,"pending.json");
const cli = path.join(root,"node_modules/wrangler/bin/wrangler.js");
const config = JSON.parse(fs.readFileSync(path.join(root,"wrangler.jsonc"),"utf8"));
const profile = "oshilove";
const {values:options} = parseArgs({options:Object.fromEntries([
  ...["folder","series","title","type","theme","date","color"].map(key=>[key,{type:"string"}]),
  ...["prepare","publish","resume","yes","help"].map(key=>[key,{type:"boolean"}])
])});

async function run(args) {
  return new Promise((resolve,reject)=>{
    const child = spawn(process.execPath,args,{cwd:root,windowsHide:true,env:{...process.env,CLOUDFLARE_ACCOUNT_ID:config.account_id}});
    let output = "";
    child.stdout.on("data",data=>{process.stdout.write(data);output+=data;});
    child.stderr.on("data",data=>{process.stderr.write(data);output+=data;});
    child.on("error",reject);
    child.on("close",code=>code===0?resolve(output):reject(Error("操作未完成。修正問題後可重新執行更新工具，選擇繼續上次發佈。")));
  });
}
const savePlan = plan => fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+"\n");
async function publish(plan) {
  const currentHash = hash(fs.readFileSync(catalogFile));
  if (![plan.baseHash,hash(Buffer.from(JSON.stringify(plan.catalog,null,2)+"\n"))].includes(currentHash)) throw Error("素材清單已被其他更新更改，請重新匯入，避免覆蓋新內容。");
  console.log("\n每次顯示 Upload complete 代表一個檔案已上載。請保持視窗開啟，直至顯示「已上線！」。\n");
  for (const job of plan.jobs) {
    if (job.done) continue;
    await run([cli,"r2","object","put",config.r2_buckets[0].bucket_name+"/"+job.key,"--file",job.file,"--content-type",job.type,"--cache-control","public, max-age=31536000, immutable","--remote","--profile",profile]);
    job.done = true;
    savePlan(plan);
  }
  console.log("\n素材檔案已全部上載，正在發佈網站及更新素材清單…\n");
  for (const preview of plan.previews) fs.copyFileSync(preview.file,path.join(root,"material-previews",preview.name));
  fs.writeFileSync(catalogFile,JSON.stringify(plan.catalog,null,2)+"\n");
  await run([path.join(root,"tools/build-site.mjs")]);
  if (!plan.version) {
    const output = await run([cli,"versions","upload","--config","wrangler.jsonc","--profile",profile]);
    plan.version = /Worker Version ID:\s*([a-f0-9-]{36})/i.exec(output)?.[1];
    if (!plan.version) throw Error("未取得 Cloudflare 版本編號；請重新執行更新工具。");
    savePlan(plan);
  }
  await run([cli,"versions","deploy",plan.version+"@100%","--yes","--config","wrangler.jsonc","--profile",profile]);
  // Verify the deployed catalogue; edge propagation can take a few seconds.
  let verified = false;
  for (let attempt=0;attempt<5;attempt++) {
    const response = await fetch("https://oshilovepocket.com/resources-data.json?verify="+Date.now(),{signal:AbortSignal.timeout(20000)});
    if (response.ok && JSON.stringify(await response.json())===JSON.stringify(plan.catalog)) { verified=true;break; }
    await new Promise(resolve=>setTimeout(resolve,2000));
  }
  if (!verified) throw Error("版本已部署，但尚未確認公開清單更新；請稍後選擇繼續上次發佈再檢查。");
  plan.completed = true;
  savePlan(plan);
  console.log("\n已上線！素材頁、日曆及首頁精選已同步更新。\nhttps://oshilovepocket.com/resources");
}

async function main() {
  if (options.help) {
    console.log('雙擊「更新素材.cmd」使用引導模式。\n指令：node tools/materials.mjs --folder "D:\\X material\\新系列" --title "素材名稱" --type stamp --theme daily --prepare\n正式發佈加 --publish；重試上次發佈用 --resume --publish。');
    return;
  }
  fs.mkdirSync(workRoot,{recursive:true});
  const interactive = !options.folder && !options.resume;
  const input = interactive || (!options.yes && options.publish) ? createInterface({input:process.stdin,output:process.stdout}) : null;
  try {
    if (options.resume) {
      if (!fs.existsSync(planFile)) throw Error("沒有待發佈的素材更新。");
      if (!options.publish) throw Error("繼續上次發佈請加 --publish。");
      return await publish(JSON.parse(fs.readFileSync(planFile,"utf8")));
    }
    const catalog = JSON.parse(fs.readFileSync(catalogFile,"utf8"));
    if (interactive) {
      console.log("\n素材更新：只會讀取原檔；-oshideco 與 .stamp 一律略過。\n");
      if (fs.existsSync(planFile)) {
        const pending = JSON.parse(fs.readFileSync(planFile,"utf8"));
        if (!pending.completed && (await input.question("有上次未發佈的更新。繼續發佈？[Y/n] ")).trim().toLowerCase()!=="n") return await publish(pending);
      }
      catalog.items.forEach((item,index)=>console.log(`${index+1}. ${item.titles?.["zh-tw"] || item.title}`));
      const choice = (await input.question("\n輸入系列編號（新增系列請輸入 0）：")).trim();
      if (!/^\d+$/.test(choice) || Number(choice)>catalog.items.length) throw Error("請輸入清單中的編號。");
      if (Number(choice)>0) options.series = catalog.items[Number(choice)-1].id;
      options.folder = (await input.question("PNG 資料夾路徑（可以拖入資料夾）：")).trim().replace(/^"|"$/g,"");
    }
    const previous = catalog.items.find(item=>item.id===options.series);
    if (options.series && !previous && !options.title) throw Error("新增系列請提供 --title。");
    const folder = path.resolve(options.folder);
    const metadata = {
      id:options.series || "material-"+hash(Buffer.from(folder+Date.now())).slice(0,10),
      title:options.title || previous?.title || path.basename(folder),
      type:options.type || previous?.type || "stamp", theme:options.theme || previous?.theme || "daily",
      eventDate:options.date!==undefined ? options.date || null : previous?.eventDate || null
    };
    if (interactive && !previous) {
      metadata.title = (await input.question(`素材名稱 [${metadata.title}]：`)).trim() || metadata.title;
      const type = (await input.question("類型：1 貼圖／2 相框 [1]：")).trim();
      if (!["","1","2"].includes(type)) throw Error("類型請選擇 1 或 2。");
      metadata.type = type==="2" ? "frame" : "stamp";
      const theme = (await input.question("主題：1 日常／2 紀念日／3 萬聖節 [1]：")).trim();
      if (!["","1","2","3"].includes(theme)) throw Error("主題請選擇 1、2 或 3。");
      metadata.theme = ({"2":"anniversary","3":"halloween"})[theme] || "daily";
      metadata.eventDate = (await input.question("每年紀念日（MM-DD，例如 11-04；沒有請留空）：")).trim() || null;
    }
    const work = fs.mkdtempSync(path.join(workRoot,"import-"));
    const result = await prepareSeries({folder,metadata,previous,work,
      resolveColour: async file=>{
        if (options.color) return options.color;
        if (!input) return;
        console.log("\n未能辨認顏色："+path.basename(file));
        colours.forEach((colour,index)=>console.log(`${index+1}. ${colour}`));
        return colours[Number((await input.question("請選顏色編號：")).trim())-1];
      },
      fetchOriginal:async variant=>{
        const response = await fetch("https://oshilovepocket.com"+variant.url,{signal:AbortSignal.timeout(20000)});
        if (!response.ok) throw Error("無法讀取現有原檔："+variant.downloadName);
        return Buffer.from(await response.arrayBuffer());
      }
    });
    if (previous) catalog.items[catalog.items.indexOf(previous)] = result.item;
    else catalog.items.push(result.item);
    catalog.featured = [metadata.id,...(catalog.featured || []).filter(id=>id!==metadata.id)].slice(0,3);
    const plan = {...result,catalog,baseHash:hash(fs.readFileSync(catalogFile)),completed:false};
    savePlan(plan);
    console.log(`\n${metadata.title}：${result.item.variants.length} 張 PNG（新增 ${result.newCount} 張），略過 ${result.ignored} 個 -oshideco 路徑。\n原檔保持不變；現有其他素材會保留。首頁會顯示這個系列。`);
    if (options.prepare) { console.log("預覽及 ZIP 已準備好，尚未更改公開清單或上載。\n確認後可用 --resume --publish 繼續。");return; }
    const confirmed = options.yes || input && (await input.question("\n將以上更新上載 R2 並發佈網站？輸入 Y 繼續：")).trim().toLowerCase()==="y";
    if (confirmed && (options.publish || interactive)) await publish(plan);
    else console.log("已保留待發佈更新，尚未上載。下次開啟工具可繼續。");
  } finally { input?.close(); }
}
main().catch(error=>{
  console.error("\n"+error.message);
  if (process.env.OSHI_MATERIALS_LAUNCH_LOG) {
    try { fs.appendFileSync(process.env.OSHI_MATERIALS_LAUNCH_LOG, `Error: ${error.message}\n`); } catch {}
  }
  process.exitCode=1;
});
