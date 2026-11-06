// Order: Japanese, Hong Kong Traditional Chinese, Taiwan Traditional Chinese, Simplified Chinese.
const rows = {
  privacyDetails: ['閲覧端末からCloudflareへIP等が送信され、検索名はFxEmbedへ送信されます。画像の提供元にもIP等が送信されます。検索名はURL・履歴に残り、フォロー・既読・最大60件の保存結果は端末に期限なく保存されます。共有端末では記録を削除してください。エクスポートファイルにはフォロー一覧が含まれます。広告は未導入です。同意した場合のみGoogle Analyticsを読み込み、Cookie・端末情報を利用します。検索名は送信しません。フッターの解析設定で撤回できます。','瀏覽器會向 Cloudflare 傳送 IP 等技術資料，搜尋名稱會傳到 FxEmbed，圖片來源亦會收到 IP 等資料。搜尋名稱會留喺網址及瀏覽記錄；收藏、已讀同每帳戶最多60篇快照保留喺裝置，冇自動到期。共用裝置請清除記錄，匯出檔含追蹤名單。目前未載入廣告。只有同意後先載入 Google Analytics，使用 Cookie 同裝置資料；Google 會處理連線 IP 等技術資料，唔傳送搜尋名稱。可喺頁尾分析設定撤回。','瀏覽器會向 Cloudflare 傳送 IP 等技術資料，搜尋名稱會傳到 FxEmbed，圖片來源也會收到 IP 等資料。搜尋名稱會保留在網址與瀏覽記錄；收藏、已讀與每帳號最多60篇快照儲存在裝置，無自動到期。共用裝置請清除記錄，匯出檔包含追蹤名單。目前未載入廣告。僅同意後載入 Google Analytics，使用 Cookie 與裝置資料；Google 會處理連線 IP 等技術資料，不傳送搜尋名稱。可在頁尾分析設定撤回。','浏览器会向 Cloudflare 传送 IP 等技术数据，搜索名称会传到 FxEmbed，图片来源也会收到 IP 等数据。搜索名称保留在网址及浏览历史；关注、已读和每账号最多60篇快照保存在设备，无自动到期。共用设备请清除记录，导出文件包含关注列表。目前未加载广告。仅同意后加载 Google Analytics，使用 Cookie 与设备数据；Google 会处理连接 IP 等技术数据，不传送搜索名称。可在页尾分析设置撤回。'],
  LOCAL_RATE_LIMITED: ['リクエストが多すぎます。1分後にお試しください。','查詢太頻密，請一分鐘後再試。','查詢過於頻繁，請一分鐘後再試。','查询过于频繁，请一分钟后重试。'],
  uncertainMerch: ['物販・要確認','物販／待確認','物販／待確認','物贩／待确认'],
  goods: ['グッズ','周邊','周邊','周边'],
  homeTitle: ['Xアカウントの情報整理','X 帳戶內容整理','X 帳號內容整理','X 账号内容整理'],
  contactX: ['不具合・お問い合わせ：X @skr_oshilove ↗','遇到問題？透過 X 聯絡 @skr_oshilove ↗','遇到問題？透過 X 聯絡 @skr_oshilove ↗','遇到问题？通过 X 联系 @skr_oshilove ↗'],
  backToTop: ['ページの先頭へ','返回頁頂','回到頂端','返回顶部'],
  appPromoTitle: ['推し活を、アプリでも。','用 App 記低追星日常','用 App 記錄追星日常','用 App 记录追星日常'],
  appLoveDescription: ['予定、記念日、日記、写真をひとつに。','整理日程、紀念日、日記同相片。','整理日程、紀念日、日記與相片。','整理日程、纪念日、日记与照片。'],
  appPocketDescription: ['ライブ・特典会の記録と、チケット・グッズなどの支出管理。','記低演出、特典會，同門票、周邊等開支。','記錄演出、特典會，以及門票、周邊等開支。','记录演出、特典会，以及门票、周边等开支。'],
  appPromoNote: ['iOS · アカウント登録不要 · 記録は端末内に','iOS · 毋須註冊 · 記錄存在裝置內','iOS · 無須註冊 · 記錄儲存在裝置內','iOS · 无需注册 · 记录保存在设备内'],
  appDetails: ['アプリについて ↗','了解 App ↗','了解 App ↗','了解 App ↗'],
  appStore: ['App Storeで見る ↗','喺 App Store 睇 ↗','在 App Store 查看 ↗','在 App Store 查看 ↗'],
  menu: ['メニュー','選單','選單','菜单'],
  postsView: ['ポスト','貼文','貼文','帖子'],
  exportFollowing: ['フォローをエクスポート','匯出追蹤名單','匯出追蹤名單','导出关注列表'],
  importFollowing: ['フォローをインポート','匯入追蹤名單','匯入追蹤名單','导入关注列表'],
  imported: ['フォローを読み込みました。','已匯入追蹤名單。','已匯入追蹤名單。','已导入关注列表。'],
  invalidImport: ['有効なフォローファイルを選んでください。','請揀有效嘅追蹤名單檔案。','請選擇有效的追蹤名單檔案。','请选择有效的关注列表文件。'],
  title: ['推し Radar — 推しの大切な瞬間を、ひとつに。','推し Radar — 每個重要時刻，都跟得上。','推し Radar — 每個重要時刻，都跟得上。','推し Radar — 每个重要时刻，都跟得上。'],
  skip: ['コンテンツへ','跳到內容','跳到內容','跳到内容'],
  discover: ['アカウントを探す','發現帳戶','探索帳號','发现账号'],
  following: ['フォロー中','我的追蹤','我的追蹤','我的关注'],
  emptyFollowing: ['まだフォローしていません。\n推しを検索して、フォローしよう。','仲未有追蹤帳戶。\n搜尋你嘅推し，按「追蹤」就得。','還沒有追蹤帳號。\n搜尋你的推し，按下「追蹤」。','还没有关注账号。\n搜索你的推し，点击「关注」。'],
  base: ['あなたの、小さな推し活基地','你嘅小小追星基地','你的小小追星基地','你的小小追星基地'],
  localOnly: ['ログイン不要・このブラウザに保存','免登入・收藏保存在此瀏覽器','免登入・收藏儲存在此瀏覽器','免登录・收藏保存在此浏览器'],
  how: ['使い方 ↗','點樣運作 ↗','使用方式 ↗','使用方式 ↗'],
  hero: ['探す時間を、<br><span class="orange-word">推す時間に。</span><span class="spark">✳</span>','少啲碌，<br>多啲<span class="orange-word">追到。</span><span class="spark">✳</span>','少滑一點，<br>多點<span class="orange-word">陪伴。</span><span class="spark">✳</span>','少刷一点，<br>多点<span class="orange-word">陪伴。</span><span class="spark">✳</span>'],
  intro: ['ライブ、MV、チケ発。<br>大切なお知らせを、ひとつの場所に。','演出、MV、チケ発。<br>你在意嘅消息，一個地方睇清楚。','演出、MV、售票情報。<br>你在意的消息，一個地方看清楚。','演出、MV、售票信息。<br>你在意的消息，一个地方看清楚。'],
  input: ['X / Twitter のURL、または @ユーザー名','貼上 X / Twitter 帳戶網址或 @username','貼上 X / Twitter 帳號網址或 @username','粘贴 X / Twitter 账号链接或 @username'],
  search: ['まとめる ↗','開始整理 ↗','開始整理 ↗','开始整理 ↗'],
  publicHint: ['公開アカウントのみ。Xへのログインは不要です。','只需公開帳戶，毋須 X 登入。','僅限公開帳號，不需要登入 X。','仅限公开账号，无需登录 X。'],
  example: ['試してみる @EVOL__official ↗','試吓 @EVOL__official ↗','試試 @EVOL__official ↗','试试 @EVOL__official ↗'],
  loadingTitle: ['最新のお知らせを受信中…','幫你接收最新消息…','正在接收最新消息…','正在接收最新消息…'],
  loadingText: ['公開ポストを取得して、予定・MV・チケ発を整理します。','讀取公開貼文，再整理日程、MV 同售票資訊。','讀取公開貼文，整理日程、MV 與售票資訊。','读取公开帖子，整理日程、MV 与售票信息。'],
  welcomeTitle: ['機能紹介','功能介紹','功能介紹','功能介绍'],
  featureSchedule: ['ライブ・イベント・撮影会・特典会','演出／活動／撮影會／特典會','演出／活動／攝影會／特典會','演出／活动／摄影会／特典会'],
  featureVideo: ['映像のお知らせ','影像更新','影像更新','影像更新'],
  featureTicket: ['チケット情報','售票情報','售票情報','售票信息'],
  scheduleText: ['開催日を見つけてカレンダーへ。\n次に会える日を、すぐ確認。','將活動日期抽出嚟，\n下一場見面，唔使再搵。','整理活動日期，\n下一場見面，不必再找。','整理活动日期，\n下一场见面，不必再找。'],
  videoText: ['新しいMV、ティザー、ライブ映像。\nゆっくり観たい瞬間のために。','新 MV、teaser、現場映像，\n留返俾想好好睇嘅時候。','新 MV、預告、現場影像，\n留給想好好欣賞的時候。','新 MV、预告、现场影像，\n留给想好好欣赏的时候。'],
  ticketText: ['発売日、抽選締切、購入リンク。\n大事なチャンスをひと目で。','開售時間、抽選截止、購票連結，\n重要消息一眼睇到。','開賣時間、抽選截止、購票連結，\n重要消息一目了然。','开售时间、抽选截止、购票链接，\n重要消息一目了然。'],
  welcomeNote: ['フォローして、次回もここから。 お気に入りはこのブラウザに保存。更新にはキャッシュがあり、リアルタイム通知ではありません。','追蹤一次，下次繼續。 收藏帳戶後，返嚟就可以接住睇。資料更新有快取，唔代表即時通知。','追蹤一次，下次繼續。 收藏帳號後，下次就能接著看。更新有快取，並非即時通知。','关注一次，下次继续。 收藏账号后，下次就能接着看。更新有缓存，并非实时通知。'],
  follow: ['＋ フォローする','＋ 追蹤帳戶','＋ 追蹤帳號','＋ 关注账号'],
  unfollow: ['✓ フォロー中 · 解除','✓ 已追蹤 · 取消','✓ 已追蹤 · 取消','✓ 已关注 · 取消'],
  followed: ['フォローしました。次回もここからチェックできます。','已加入追蹤，下次返嚟可以接住睇。','已加入追蹤，下次可以接著看。','已加入关注，下次可以接着看。'],
  unfollowed: ['フォローを解除しました。','已取消追蹤。','已取消追蹤。','已取消关注。'],
  maxFollows: ['最大50件までフォローできます。','最多收藏 50 個帳戶。','最多收藏 50 個帳號。','最多收藏 50 个账号。'],
  followerCount: ['{n} フォロワー','{n} 位追蹤者','{n} 位追蹤者','{n} 位关注者'],
  feedTitle: ['最新情報','最新動態','最新動態','最新动态'],
  refresh: ['↻ 更新する','↻ 更新消息','↻ 更新消息','↻ 更新消息'],
  fetched: ['取得','取得資料','取得資料','获取数据'],
  saved: ['前回の保存','上次保存','上次儲存','上次保存'],
  cached: ['約15分キャッシュ','約 15 分鐘快取','約 15 分鐘快取','约 15 分钟缓存'],
  newCount: ['前回の閲覧後に初めて表示したポスト {n}件','{n} 則上次瀏覽後首次見到嘅貼文','{n} 則上次瀏覽後首次出現的貼文','{n} 条上次浏览后首次出现的帖子'],
  all: ['すべて','全部','全部','全部'],
  other: ['その他','其他','其他','其他'],
  filter: ['読み込んだポストを検索','搜尋已載入內容','搜尋已載入內容','搜索已加载内容'],
  reposts: ['リポストを含む','包含轉發','包含轉發','包含转发'],
  upcoming: ['これからの日付のみ','只睇未來日期','只看未來日期','只看未来日期'],
  latest: ['新しいポスト順','最新貼文','最新貼文','最新帖子'],
  dateSort: ['関連日付が近い順','相關日期：由近至遠','相關日期：由近至遠','相关日期：由近至远'],
  classification: ['本文から自動分類。年の省略は推定、画像内の文字は未解析です。時刻は日本時間（JST）。必ず原文をご確認ください。','按文字自動分類；一年未寫明時會推算年份。海報內資料未作辨識，時間按日本時間（JST），請以原文為準。','依文字自動分類；未標示年份時會推算。尚未辨識海報內容，時間為日本時間（JST），請以原文為準。','按文字自动分类；未标明年份时会推算。尚未识别海报内容，时间为日本时间（JST），请以原文为准。'],
  emptyTitle: ['該当するポストがありません','暫時未有符合嘅內容','暫時沒有符合的內容','暂时没有符合的内容'],
  emptyText: ['分類や絞り込みを変えるか、以前のポストを読み込んでください。','試吓其他分類、清除篩選，或者載入較舊貼文。','試試其他分類、清除篩選，或載入較舊貼文。','试试其他分类、清除筛选，或加载较早的帖子。'],
  loadMore: ['以前のポストを読み込む ↓','載入較舊貼文 ↓','載入較舊貼文 ↓','加载较早帖子 ↓'],
  count: ['表示 {shown} / 読み込み済み {total}件','顯示 {shown} / 已載入 {total} 則','顯示 {shown} / 已載入 {total} 則','显示 {shown} / 已加载 {total} 条'],
  pageLimit: [' · 今回は5ページまで。更新で最新情報を取得できます。',' · 今次已載入 5 頁，可更新最近消息',' · 本次已載入 5 頁，可更新最近消息',' · 本次已加载 5 页，可更新最近消息'],
  next: ['NEXT UP / 次の予定','NEXT UP / 下一個日程','NEXT UP / 下一個日程','NEXT UP / 下一个日程'],
  ticketWatch: ['NEXT TICKET SALE / 次のチケット発売','NEXT TICKET SALE / 下次門票開售','NEXT TICKET SALE / 下次門票開賣','NEXT TICKET SALE / 下次门票开售'],
  noEvent: ['今後の予定は未検出です','暫未辨識到未來活動','暫未辨識到未來活動','暂未识别到未来活动'],
  noTicket: ['今後の発売・締切は未検出です','暫未辨識到未來開售／截止','暫未辨識到未來開賣／截止','暂未识别到未来开售／截止'],
  loadedDates: ['読み込んだ本文の日付のみ','只計已載入貼文內嘅文字日期','僅計算已載入貼文的文字日期','仅计算已加载帖子的文字日期'],
  inferred: ['年は推定','年份推算','年份推算','年份推算'],
  original: ['Xで原文を見る ↗','查看 X 原文 ↗','查看 X 原文 ↗','查看 X 原文 ↗'],
  verify: ['原文で確認 ↗','核對原文 ↗','核對原文 ↗','核对原文 ↗'],
  repostBy: ['↻ @{name} のリポスト','↻ 轉發自 @{name}','↻ 轉發自 @{name}','↻ 转发自 @{name}'],
  expand: ['全文を表示 ＋','展開全文 ＋','展開全文 ＋','展开全文 ＋'],
  collapse: ['折りたたむ −','收起全文 −','收起全文 −','收起全文 −'],
  quote: ['@{name} の引用ポスト','引用 @{name} 嘅貼文','引用 @{name} 的貼文','引用 @{name} 的帖子'],
  eventDate: ['開催日','活動日期','活動日期','活动日期'],
  deadline: ['申込締切','售票／抽選截止','售票／抽選截止','售票／抽选截止'],
  addCalendar: ['＋ 保存','＋ 日曆','＋ 日曆','＋ 日历'],
  calendarExport: ['終日予定を保存','匯出全日活動提示','匯出全日活動提示','导出全天活动提醒'],
  calendarSaved: ['終日予定を保存しました。日付・時刻は原文でご確認ください。','已匯出全日活動提示，請核對原文日期及時間。','已匯出全日活動提示，請核對原文日期及時間。','已导出全天活动提醒，请核对原文日期及时间。'],
  moreDates: ['ほかの日付は原文をご確認ください。','更多日期請查看原文。','更多日期請查看原文。','更多日期请查看原文。'],
  watch: ['▷ 映像を見る','▷ 觀看影片','▷ 觀看影片','▷ 观看视频'],
  buy: ['↗ チケット','↗ 購票連結','↗ 購票連結','↗ 购票链接'],
  images: ['画像 {n}枚 ↗','{n} 張圖片 ↗','{n} 張圖片 ↗','{n} 张图片 ↗'],
  image: ['画像を見る ↗','查看原圖 ↗','查看原圖 ↗','查看原图 ↗'],
  storageError: ['ブラウザに保存できませんでした。保存設定や空き容量をご確認ください。','瀏覽器儲存空間不足或未開啟，收藏可能未能保留。','瀏覽器儲存空間不足或未開啟，收藏可能無法保留。','浏览器存储空间不足或未开启，收藏可能无法保留。'],
  cacheToast: ['キャッシュを表示中。取得から約15分後に再取得します。','已讀取快取結果；取得資料約 15 分鐘後會重新讀取。','已讀取快取結果；取得資料約 15 分鐘後會重新讀取。','已读取缓存；获取数据约 15 分钟后会重新读取。'],
  refreshed: ['更新しました。','消息已更新。','消息已更新。','消息已更新。'],
  stale: [' 前回の結果を表示しています。最新情報ではありません。',' 下面保留上次取得嘅結果，唔代表最新消息。',' 以下保留上次取得的結果，不代表最新消息。',' 以下保留上次获取的结果，不代表最新消息。'],
  SOURCE_UNAVAILABLE: ['無料データソースに接続できません。しばらくしてからお試しください。','免費資料來源暫時無法回應，請稍後再試。','免費資料來源暫時無法回應，請稍後再試。','免费数据源暂时无法响应，请稍后重试。'],
  INVALID_HANDLE: ['有効なXプロフィールURLか @ユーザー名を入力してください。','請輸入有效嘅 X 帳戶網址或 @帳戶名稱。','請輸入有效的 X 帳號網址或 @帳號名稱。','请输入有效的 X 账号链接或 @账号名称。'],
  INVALID_CURSOR: ['ページ情報が無効です。再検索してください。','分頁資料無效，請重新搜尋。','分頁資料無效，請重新搜尋。','分页数据无效，请重新搜索。'],
  NOT_FOUND: ['公開アカウントが見つかりません。ユーザー名をご確認ください。','搵唔到呢個公開帳戶，請檢查名稱。','找不到這個公開帳號，請檢查名稱。','找不到此公开账号，请检查名称。'],
  PRIVATE_ACCOUNT: ['非公開アカウントは表示できません。','呢個係私人帳戶，只支援公開帳戶。','這是私人帳號，僅支援公開帳號。','这是私密账号，仅支持公开账号。'],
  RATE_LIMITED: ['無料データソースが混雑しています。1分後にお試しください。','免費資料來源暫時繁忙，請一分鐘後再試。','免費資料來源暫時忙碌，請一分鐘後再試。','免费数据源暂时繁忙，请一分钟后重试。'],
  TIMELINE_UNAVAILABLE: ['アカウントは見つかりましたが、ポストを取得できません。後ほどお試しください。','已找到帳戶，但暫時讀取唔到時間線。請稍後再試。','已找到帳號，但暫時無法讀取時間軸。請稍後再試。','已找到账号，但暂时无法读取时间线。请稍后重试。'],
  footer: ['待ち遠しい、その瞬間のために。','為每一次期待而整理。','為每一次期待而整理。','为每一次期待而整理。'],
  source: ['データ提供：FxEmbed ↗','資料由 FxEmbed 提供 ↗','資料由 FxEmbed 提供 ↗','数据由 FxEmbed 提供 ↗'],
  privacy: ['プライバシー・説明','私隱與說明','隱私與說明','隐私与说明'],
  aboutTitle: ['使い方','使用說明','使用說明','使用说明'],
  aboutIntro: ['公開Xアカウントの最近のポストを、オープンソースのFxEmbed公開サービス経由で取得し、本文のルールで分類します。有料X APIや有料AIは使用しません。','透過開源 FxEmbed 公開服務取得最近貼文，按文字規則整理演出、MV 同售票資訊。無使用付費 X API 或付費 AI。','透過開源 FxEmbed 公開服務取得最近貼文，依文字規則整理演出、MV 與售票資訊。未使用付費 X API 或付費 AI。','通过开源 FxEmbed 公共服务获取最近帖子，按文字规则整理演出、MV 与售票信息。不使用付费 X API 或付费 AI。'],
  aboutFollowTitle: ['保存と更新','收藏同更新','收藏與更新','收藏与更新'],
  aboutFollow: ['フォロー、既読、最近の結果はこのブラウザに保存します。データを消すと失われ、他の端末には同期しません。アカウントを開くか更新すると取得します。閉じた後の監視や通知はありません。','追蹤名單、已讀記錄及最近結果只存在呢個瀏覽器。清除資料就會移除，其他裝置唔會同步。開啟帳戶或按更新時先查詢，關閉後唔會持續監察或發通知。','追蹤名單、已讀記錄與最近結果只儲存在此瀏覽器。清除資料即會移除，不支援跨裝置同步。開啟帳號或按更新時查詢，關閉後不會監控或通知。','关注列表、已读记录与最近结果仅保存在此浏览器。清除数据即会移除，不支持跨设备同步。打开账号或点击更新时查询，关闭后不会监控或通知。'],
  aboutFreshTitle: ['データの新しさ','資料有幾新？','資料有多新？','数据有多新？'],
  aboutFresh: ['約15分キャッシュします。上流にも遅延があり、全履歴は保証しません。障害時は保存済みの結果を明示して表示します。','結果快取約 15 分鐘，上游亦可能有延遲，唔保證完整歷史。來源失效時會標示並顯示本機上次結果。','結果快取約 15 分鐘，上游也可能延遲，不保證完整歷史。來源失效時會標示並顯示本機上次結果。','结果缓存约 15 分钟，上游也可能延迟，不保证完整历史。来源失效时会标明并显示本机上次结果。'],
  aboutDatesTitle: ['分類・カレンダー','分類與月曆','分類與月曆','分类与日历'],
  aboutDates: ['複数分類に対応。省略された年は投稿日から推定し、画像の文字は解析しません。カレンダーは読み込んだ本文の日付のみ。保存は終日予定となり、開演時刻を推測しません。原文でご確認ください。','一篇可屬多個分類。未註明年份會按發文日期推算，圖片文字未辨識。月曆只包含已載入文字日期；匯出為全日提示，唔會猜演出時間，請核對原文。','一篇可屬多個分類。省略年份會依發文日期推算，尚未辨識圖片文字。月曆僅包含已載入文字日期；匯出為全日提示，不猜測演出時間，請核對原文。','一篇可属多个分类。省略年份会按发帖日期推算，尚未识别图片文字。日历仅包含已加载文字日期；导出为全天提醒，不猜测演出时间，请核对原文。'],
  aboutPrivacyTitle: ['プライバシーと提供元','私隱與來源','隱私與來源','隐私与来源'],
  aboutPrivacy: ['XのパスワードやCookieは不要です。検索名はCloudflare WorkerとFxEmbedへ送信し、画像はXのメディアサービス等から取得します。提供元は技術的ログを処理する場合があります。X・アーティストの公式サービスではありません。','唔需要 X 密碼或 cookies。搜尋名稱會傳到 Cloudflare Worker 及 FxEmbed；圖片由 X 等媒體服務載入。供應商可能處理技術記錄。本站與 X 及藝人並無官方關係。','不需要 X 密碼或 cookies。搜尋名稱會傳到 Cloudflare Worker 與 FxEmbed；圖片由 X 等媒體服務載入。供應商可能處理技術記錄。本站與 X 及藝人無官方關係。','不需要 X 密码或 cookies。搜索名称会传到 Cloudflare Worker 和 FxEmbed；图片由 X 等媒体服务加载。供应商可能处理技术日志。本站与 X 及艺人无官方关系。'],
  clear: ['このブラウザの記録を削除','清除本機收藏與記錄','清除本機收藏與記錄','清除本机收藏与记录'],
  clearConfirm: ['このブラウザのフォロー・既読・保存データをすべて削除しますか？','清除呢個瀏覽器嘅全部追蹤帳戶、已讀記錄同快取？','清除此瀏覽器的全部追蹤帳號、已讀記錄與快取？','清除此浏览器的全部关注账号、已读记录与缓存？'],
  cleared: ['ブラウザの記録を削除しました。','本機收藏與記錄已清除。','本機收藏與記錄已清除。','本机收藏与记录已清除。'],
  close: ['閉じる','關閉','關閉','关闭'],
  calendarTitle: ['会える日を、ひと目で。','幾時見面，一眼睇到。','見面的日子，一目了然。','见面的日子，一目了然。'],
  calendar: ['カレンダー','月曆','月曆','日历'],
  today: ['今日','今日','今天','今天'],
  prevMonth: ['前の月','上個月','上個月','上个月'],
  nextMonth: ['次の月','下個月','下個月','下个月'],
  events: ['ライブ・予定','演出／活動','演出／活動','演出／活动'],
  ticketDates: ['チケ発・締切','開售／截止','開賣／截止','开售／截止'],
  dayEmpty: ['この日の予定は未検出です。以前のポストの読み込みもお試しください。','呢日暫未辨識到日程，可以試吓載入較舊貼文。','這天尚未辨識到日程，可以試試載入較舊貼文。','这天尚未识别到日程，可以试试加载较早帖子。'],
  calendarHint: ['読み込んだ本文から抽出・JST。日付を選ぶと詳細を表示します。','由已載入文字抽取・JST。撳日期睇詳情。','由已載入文字抽取・JST。點日期看詳情。','从已加载文字提取・JST。点击日期看详情。'],
  entries: ['{n}件','{n} 項','{n} 項','{n} 项'],
  icsNote: ['本文から抽出した日付です。年や時刻は原文でご確認ください。この予定は終日リマインダーです。','由貼文文字抽取嘅日期。請核對原文年份及時間。此項為全日提示。','由貼文文字抽取的日期。請核對原文年份與時間。此項為全日提示。','从帖子文字提取的日期。请核对原文年份与时间。此项为全天提醒。'],
};
const english = {
  "privacyDetails": "Account names are sent to Cloudflare and FxEmbed and may remain in your URL and browser history. Image providers receive connection details such as your IP address. Follows, read markers and recent results stay in this browser until you clear them. Exports contain your follow list. Google Analytics is not loaded on Radar pages.",
  "LOCAL_RATE_LIMITED": "Too many requests. Please try again in a minute.",
  "uncertainMerch": "Merch · check source",
  "goods": "Merch",
  "video": "Video",
  "homeTitle": "Organise updates from X",
  "contactX": "Help: X @skr_oshilove ↗",
  "backToTop": "Back to top",
  "appPromoTitle": "Keep your oshi records in the apps",
  "appLoveDescription": "Plans, anniversaries, diaries and photos.",
  "appPocketDescription": "Events and expenses, from tickets to merch.",
  "appPromoNote": "iOS · No account needed · Records on your device",
  "appDetails": "Explore the apps ↗",
  "appStore": "View on the App Store ↗",
  "menu": "Menu",
  "postsView": "Posts",
  "exportFollowing": "Export follows",
  "importFollowing": "Import follows",
  "migration": "Move follows from the old site ↗",
  "imported": "Follows imported.",
  "invalidImport": "Choose a valid follow export file.",
  "title": "Oshi Radar | Organise X events, tickets and videos",
  "skip": "Skip to content",
  "discover": "Find an account",
  "following": "Following",
  "emptyFollowing": "No follows yet.\nSearch for an account to save it here.",
  "base": "Your oshi updates",
  "localOnly": "No login · Saved in this browser",
  "how": "How it works ↗",
  "hero": "Organise updates from X",
  "intro": "Find events, videos and ticket announcements in one place.",
  "input": "X profile URL or @username",
  "search": "Search ↗",
  "publicHint": "Public accounts only. No X login needed.",
  "example": "Try @EVOL__official ↗",
  "loadingTitle": "Loading public updates…",
  "loadingText": "Fetching posts and organising events, videos and tickets.",
  "welcomeTitle": "What you can find",
  "featureSchedule": "Live shows and events",
  "featureVideo": "Video updates",
  "featureTicket": "Ticket announcements",
  "scheduleText": "View dates found in posts on a calendar.",
  "videoText": "Filter posts with videos, music videos and teasers.",
  "ticketText": "Find sale dates, deadlines and purchase links.",
  "welcomeNote": "Save accounts to return to them here. Results are cached; this is not a live notification service.",
  "follow": "＋ Follow",
  "unfollow": "✓ Following · Unfollow",
  "followed": "Account saved to this browser.",
  "unfollowed": "Account removed from follows.",
  "maxFollows": "You can follow up to 50 accounts.",
  "followerCount": "{n} followers",
  "feedTitle": "Latest updates",
  "refresh": "↻ Refresh",
  "fetched": "Fetched",
  "saved": "Saved result",
  "cached": "Cached for about 15 minutes",
  "newCount": "{n} posts first seen since your last visit",
  "all": "All",
  "other": "Other",
  "filter": "Search loaded posts",
  "reposts": "Include reposts",
  "upcoming": "Upcoming dates only",
  "latest": "Newest posts",
  "dateSort": "Nearest related date",
  "classification": "Classified from post text. Missing years are estimated; text in images is not read. Times use Japan Standard Time (JST). Check the original post.",
  "emptyTitle": "No matching posts",
  "emptyText": "Change filters or load older posts.",
  "loadMore": "Load older posts ↓",
  "count": "Showing {shown} of {total} loaded posts",
  "pageLimit": " · Up to 5 pages per visit. Refresh to get newer posts.",
  "next": "Next event",
  "ticketWatch": "Next ticket sale",
  "noEvent": "No upcoming events found",
  "noTicket": "No upcoming sales or deadlines found",
  "loadedDates": "Dates from loaded post text only",
  "inferred": "Year estimated",
  "original": "View original on X ↗",
  "verify": "Check original ↗",
  "repostBy": "↻ Reposted by @{name}",
  "expand": "Read more ＋",
  "collapse": "Show less −",
  "quote": "Quoted post by @{name}",
  "eventDate": "Event date",
  "deadline": "Deadline",
  "addCalendar": "＋ Save",
  "calendarExport": "Save all-day event",
  "calendarSaved": "All-day event saved. Check the original date and time.",
  "moreDates": "Check the original for more dates.",
  "watch": "▷ Watch video",
  "buy": "↗ Tickets",
  "images": "{n} images ↗",
  "image": "View image ↗",
  "storageError": "Could not save in this browser. Check storage settings and free space.",
  "cacheToast": "Showing a cached result. New data can be fetched about 15 minutes after the last request.",
  "refreshed": "Updated.",
  "stale": " Showing a previously saved result, not current information.",
  "SOURCE_UNAVAILABLE": "The free data source is unavailable. Please try again later.",
  "INVALID_HANDLE": "Enter a valid X profile URL or @username.",
  "INVALID_CURSOR": "Invalid page information. Search again.",
  "NOT_FOUND": "Public account not found. Check the username.",
  "PRIVATE_ACCOUNT": "Private accounts are not supported.",
  "RATE_LIMITED": "The free data source is busy. Try again in a minute.",
  "TIMELINE_UNAVAILABLE": "Account found, but posts could not be loaded. Try again later.",
  "footer": "Keep track of your oshi updates.",
  "source": "Data by FxEmbed ↗",
  "privacy": "Privacy and details",
  "aboutTitle": "How it works",
  "aboutIntro": "Recent posts from public X accounts are retrieved through FxEmbed and classified using text rules. No paid X API or AI is used.",
  "aboutFollowTitle": "Saving and updates",
  "aboutFollow": "Follows, read markers and recent results are stored in this browser. Clearing browser data removes them. They do not sync across devices. Updates are fetched when you open an account or refresh; there is no background monitoring or notification.",
  "aboutFreshTitle": "How current is the data?",
  "aboutFresh": "Results are cached for about 15 minutes. The provider may also have delays or incomplete history. Previously saved results are clearly marked during outages.",
  "aboutDatesTitle": "Categories and calendar",
  "aboutDates": "Posts can have multiple categories. Missing years are estimated from post dates. Text in images is not read. Calendar entries use dates found in loaded text and export as all-day reminders. Check original dates and times.",
  "aboutPrivacyTitle": "Privacy and sources",
  "aboutPrivacy": "No X password or cookies are needed. Searched account names go to Cloudflare and FxEmbed. Image providers may process connection details. Radar is not affiliated with X or the featured artists.",
  "clear": "Clear Radar data in this browser",
  "clearConfirm": "Delete all follows, read markers and saved results in this browser?",
  "cleared": "Radar data cleared.",
  "close": "Close",
  "calendarTitle": "Event calendar",
  "calendar": "Calendar",
  "today": "Today",
  "prevMonth": "Previous month",
  "nextMonth": "Next month",
  "events": "Events",
  "ticketDates": "Sales and deadlines",
  "dayEmpty": "No dates found for this day. Try loading older posts.",
  "calendarHint": "Dates extracted from loaded text · JST. Select a day for details.",
  "entries": "{n} items",
  "icsNote": "Date extracted from post text. Verify the year and time in the original. This is an all-day reminder."
};
for(const [key,value] of Object.entries(english)){ if(rows[key]) rows[key][4]=value; else rows[key]=[value,value,value,value,value]; }
rows.video=['動画','影片','影片','视频','Video'];
rows.migration=['旧サイトのフォローを移す ↗','搬移舊站收藏 ↗','搬移舊站收藏 ↗','搬移旧站收藏 ↗','Move follows from the old site ↗'];
rows.privacyDetails[0]='検索名はCloudflareとFxEmbedに送信され、URLや閲覧履歴に残る場合があります。画像の提供元にもIP等が送信されます。フォロー・既読・保存結果はこのブラウザに保存されます。RadarページではGoogle Analyticsを読み込みません。';
rows.privacyDetails[2]='搜尋名稱會傳送至 Cloudflare 與 FxEmbed，並可能保留在網址及瀏覽記錄中。圖片來源亦可能處理 IP 等連線資料。收藏、已讀記錄及最近結果只儲存在此瀏覽器。Radar 頁不會載入 Google Analytics。';
export const LANGUAGES = ['ja', 'zh-HK', 'zh-TW', 'zh-CN', 'en'];
export function detectLanguage(preferences = []) {
  for (const value of preferences) {
    const tag = String(value).replaceAll('_', '-').toLowerCase();
    if (tag === 'ja' || tag.startsWith('ja-')) return 'ja';
    if (!/^zh(?:-|$)/.test(tag)) continue;
    if (/(?:^|-)(hk|mo)(?:-|$)/.test(tag)) return 'zh-HK';
    if (/(?:^|-)(tw)(?:-|$)/.test(tag)) return 'zh-TW';
    if (/(?:^|-)(cn|sg|hans)(?:-|$)/.test(tag)) return 'zh-CN';
    if (/(?:^|-)hant(?:-|$)/.test(tag)) return 'zh-TW';
    return 'zh-CN';
  }
  return 'ja';
}
let language = typeof document === 'undefined' ? 'ja' : ({ja:'ja','zh-tw':'zh-TW',en:'en'}[document.documentElement.dataset.fixedLanguage] || 'ja');
export function getLanguage() { return language; }
export function setLanguage(value) { if (!LANGUAGES.includes(value)) return; language = value; try { localStorage.setItem('oshi-language', value); } catch {} }
export function t(key, vars = {}) {
  let text = rows[key]?.[LANGUAGES.indexOf(language)] || rows.SOURCE_UNAVAILABLE[LANGUAGES.indexOf(language)];
  for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}
export function categoryLabel(category) { return category === 'video' ? t('video') : category === 'goods' ? t('goods') : category === 'other' ? t('other') : category === 'schedule' ? 'Schedule' : category === 'tickets' ? 'チケ発' : 'MV / Video'; }
export function applyLanguage() {
  document.documentElement.lang = language;
  const put = (selector, key, html = false) => { const el = document.querySelector(selector); if (el) el[html ? 'innerHTML' : 'textContent'] = t(key); };
  for (const [selector, key] of Object.entries({ '.skip':'skip','.follow-heading .eyebrow':'following','#about-open':'how','.sidebar-bottom>span':'base','#search-submit':'search','.search-hint>span':'publicHint','#example':'example','#loading strong':'loadingTitle','#loading p':'loadingText','.section-heading h2':'welcomeTitle','.welcome-note p':'welcomeNote','.feed-heading h2':'feedTitle','#refresh':'refresh','.classification-note':'classification','#empty h3':'emptyTitle','#empty p':'emptyText','#load-more':'loadMore','#privacy-open':'privacy','#about h2':'aboutTitle','#clear-local':'clear','.calendar-heading h2':'calendar','#calendar-today':'today','.calendar-note':'calendarHint' })) put(selector,key);
  put('.hero h1','homeTitle'); put('.intro','intro',true);
  document.querySelector('.side-home').innerHTML = `<span>⌕</span>${t('discover')}<span class="small-arrow">↗</span>`;
  const local = document.createElement('small'); local.textContent = t('localOnly'); document.querySelector('.sidebar-bottom>span').append(local);
  const features = document.querySelectorAll('.feature');
  ['featureSchedule','featureVideo','featureTicket'].forEach((k,i) => { features[i].querySelector('h3 small').textContent=t(k); features[i].querySelector('p').textContent=t(['scheduleText','videoText','ticketText'][i]); });
  for (const id of ['account-input','filter']) { $(id).placeholder=t(id==='filter'?'filter':'input'); $(id).setAttribute('aria-label',t(id==='filter'?'filter':'input')); }
  document.querySelector('label[for="account-input"]').textContent=t('input');
  document.querySelector('.search-section').setAttribute('aria-label',t('discover'));
  for (const [id,key] of [['reposts','reposts'],['calendar-reposts','reposts'],['upcoming','upcoming'],['calendar-events','events'],['calendar-tickets','ticketDates']]) { const el=$(id); if(el){const label=el.parentElement; [...label.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove()); label.append(document.createTextNode(` ${t(key)}`));} }
  $('sort').options[0].textContent=t('latest'); $('sort').options[1].textContent=t('dateSort');
  const headings = document.querySelectorAll('#about h3');
  ['aboutFollowTitle','aboutFreshTitle','aboutDatesTitle','aboutPrivacyTitle'].forEach((k,i)=>headings[i].textContent=t(k));
  const paragraphs = document.querySelectorAll('#about>p:not(#storage-message)');
  ['aboutIntro','aboutFollow','aboutFresh','aboutDates','aboutPrivacy'].forEach((k,i)=>paragraphs[i].textContent=t(k));
  document.querySelector('.dialog-close').setAttribute('aria-label',t('close'));
  $('following').setAttribute('aria-label',t('following')); $('feed').setAttribute('aria-label',t('all')); $('tabs').setAttribute('aria-label',t('all'));
  document.querySelector('.sort-label .sr-only').textContent=t('dateSort');
  for(const [id,key] of [['calendar-prev','prevMonth'],['calendar-next','nextMonth']]) $(id)?.setAttribute('aria-label',t(key));
  $('language').value=language;
  put('#privacy-details','privacyDetails');
  put('#contact-x','contactX');
  put('#app-promo-title','appPromoTitle'); put('#app-love-description','appLoveDescription'); put('#app-pocket-description','appPocketDescription'); put('#app-promo-note','appPromoNote'); put('#app-details','appDetails');
  document.querySelectorAll('.app-store-link').forEach(el=>el.textContent=t('appStore'));
  $('app-details').href=language==='ja'?'/':language==='en'?'/en':'/zh-tw';
  $('language-current').textContent=t('menu'); put('#migration-link','migration');
  put('#menu-label','menu'); put('#menu-privacy','privacy'); put('#view-posts','postsView'); put('#view-calendar','calendar'); put('#export-following','exportFollowing'); put('#import-following','importFollowing');
}
function $(id) { return document.getElementById(id); }
export const localeKeys = Object.keys(rows);
export const localeRows = rows;
