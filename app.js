
(() => {
  const { useState, useEffect, useMemo } = React;

  // ---- Safe helpers ----
  const LS_KEYS = { JOBS: "ssw_jobs_v1", SETTINGS: "ssw_settings_v1" };
  const DEFAULT_CATEGORIES = [
    "介護","ビルクリーニング","素形材産業","産業機械製造業","電気・電子情報関連産業",
    "建設","造船・舶用工業","自動車整備","航空","宿泊","農業","漁業","飲食料品製造業","外食業",
    "（15）その他","（16）その他",
  ];
  const safeParse = (json, fb) => { try { return JSON.parse(json); } catch { return fb; } };
  const loadJobs = () => {
    try { const raw = window.localStorage.getItem(LS_KEYS.JOBS); const d = safeParse(raw, []); return Array.isArray(d) ? d : []; }
    catch { return []; }
  };
  const normalizeCategories = (input) => {
    let arr = [];
    if (Array.isArray(input)) arr = input;
    else if (input && Array.isArray(input.categories)) arr = input.categories;
    const out = [...(arr || [])];
    while (out.length < 16) out.push(`（${String(out.length + 1).padStart(2, '0')}）その他`);
    if (out.length > 16) out.length = 16;
    return out.map(v => (typeof v === 'string' && v.trim()) ? v.trim() : 'その他');
  };
  const loadCategories = () => {
    try { const raw = window.localStorage.getItem(LS_KEYS.SETTINGS); return normalizeCategories(safeParse(raw, DEFAULT_CATEGORIES)); }
    catch { return DEFAULT_CATEGORIES; }
  };

  // ---- ErrorBoundary (class) ----
  class ErrorBoundary extends React.Component {
    constructor(p){ super(p); this.state = { hasError:false, message:"" }; }
    static getDerivedStateFromError(err){ return { hasError:true, message: String(err?.message || err) }; }
    componentDidCatch(err, info){ console.error(err, info); }
    render(){
      if (this.state.hasError){
        return React.createElement("div", {className:"border-2 border-dashed rounded-2xl p-6 text-sm text-red-600"},
          "画面の描画中にエラーが発生しました。上部の「初期化」をお試しください。",
          React.createElement("br"),
          React.createElement("span", {className:"text-xs text-slate-500"}, this.state.message)
        );
      }
      return this.props.children;
    }
  }

  function Segmented({ value, onChange, items }){
    return React.createElement("div", {className:"inline-flex rounded-lg border bg-white overflow-hidden"},
      items.map(it => React.createElement("button", {
        key: it,
        onClick: () => onChange(it),
        className: `px-3 py-1.5 text-sm ${value===it ? 'bg-black text-white':'text-slate-700 hover:bg-slate-100'}`
      }, it))
    );
  }

  function Field({ label, children }){
    return React.createElement("div", {className:"col-span-2 md:col-span-1 flex items-center gap-3"},
      React.createElement("div", {className:"w-28 text-sm text-slate-600"}, label),
      React.createElement("div", {className:"flex-1"}, children)
    );
  }

  function AgencyPanel({ jobs, setJobs, categories }){
    const [jobType, setJobType] = useState("特定技能");
    const [recruitSource, setRecruitSource] = useState("国内");
    const [category, setCategory] = useState(categories[0] || "");
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => { if(!categories.includes(category)) setCategory(categories[0]||""); }, [categories]);

    const handleAdd = () => {
      const link = url.trim();
      if (!/^https?:\/\//i.test(link)) { alert("URLは http(s):// で始まる形式で入力してください。"); return; }
      const rec = {
        id: Math.random().toString(36).slice(2,10),
        jobType,
        recruitSource: jobType === "特定技能" ? recruitSource : "",
        category,
        title: title.trim() || "タイトル未設定",
        notes: notes.trim(),
        url: link,
        createdAt: new Date().toISOString(),
      };
      setJobs([rec, ...jobs]);
      setTitle(""); setUrl(""); setNotes("");
    };

    const preview = () => {
      const link = url.trim();
      if (!/^https?:\/\//i.test(link)) { alert("プレビューするには正しいURLを入力してください。"); return; }
      try { window.open(link, "_blank", "noopener,noreferrer"); } catch {}
    };

    return React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-6"},
      React.createElement("h2", {className:"text-lg font-semibold mb-4"},"求人URLの掲載"),
      React.createElement("div", {className:"grid grid-cols-2 gap-3"},
        React.createElement("div", {className:"col-span-2 flex items-center gap-3"},
          React.createElement("div", {className:"w-28 text-sm text-slate-600"},"種別"),
          React.createElement(Segmented, { value: jobType, onChange: setJobType, items: ["特定技能","技能実習生"] })
        ),
        jobType === "特定技能" && React.createElement(Field, {label:"採用元"},
          React.createElement("select", {className:"w-full border rounded-md px-3 py-2", value:recruitSource, onChange:e=>setRecruitSource(e.target.value)},
            React.createElement("option", {value:"国内"},"国内から採用"),
            React.createElement("option", {value:"国外"},"国外から採用")
          )
        ),
        React.createElement(Field, {label:"職種"},
          React.createElement("select", {className:"w-full border rounded-md px-3 py-2", value:category, onChange:e=>setCategory(e.target.value)},
            categories.map((c,i)=> React.createElement("option", {key:i, value:c}, `${String(i+1).padStart(2,'0')}｜${c}`))
          )
        ),
        React.createElement("div", {className:"col-span-2 flex items-center gap-3"},
          React.createElement("div", {className:"w-28 text-sm text-slate-600"},"求人タイトル"),
          React.createElement("input", {className:"flex-1 border rounded-md px-3 py-2", value:title, onChange:e=>setTitle(e.target.value), placeholder:"例：介護スタッフ"})
        ),
        React.createElement("div", {className:"col-span-2 flex items-start gap-3"},
          React.createElement("div", {className:"w-28 text-sm text-slate-600 mt-2"},"URL"),
          React.createElement("div", {className:"flex-1 grid grid-cols-[1fr_auto] gap-2"},
            React.createElement("input", {className:"border rounded-md px-3 py-2", value:url, onChange:e=>setUrl(e.target.value), placeholder:"https://..."}),
            React.createElement("button", {className:"px-3 py-2 rounded-md border", onClick:preview},"プレビュー")
          )
        ),
        React.createElement("div", {className:"col-span-2 flex items-start gap-3"},
          React.createElement("div", {className:"w-28 text-sm text-slate-600 mt-2"},"メモ"),
          React.createElement("textarea", {className:"flex-1 border rounded-md px-3 py-2", rows:3, value:notes, onChange:e=>setNotes(e.target.value), placeholder:"任意"})
        ),
        React.createElement("div", {className:"col-span-2 flex justify-end"},
          React.createElement("button", {className:"px-4 py-2 rounded-lg bg-black text-white", onClick:handleAdd},"掲載する")
        )
      )
    );
  }

  function SenderPanel({ jobs, categories }){
    const cats = Array.isArray(categories) ? categories : DEFAULT_CATEGORIES;
    const [filter, setFilter] = useState({ type:"すべて", source:"すべて", category:"すべて" });
    const [pending, setPending] = useState(filter);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 30;

    const filtered = useMemo(() => {
      const list = Array.isArray(jobs) ? jobs : [];
      const f = filter;
      let out = list;
      if (f.type !== "すべて") out = out.filter(j => j.jobType === f.type);
      if (f.source !== "すべて") out = out.filter(j => j.recruitSource === f.source);
      if (f.category !== "すべて") out = out.filter(j => j.category === f.category);
      return out;
    }, [jobs, filter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = filtered.slice(start, end);

    const applySearch = () => { setFilter(pending); setPage(1); };
    const resetSearch = () => { const init = { type:"すべて", source:"すべて", category:"すべて"}; setPending(init); setFilter(init); setPage(1); };

    return React.createElement("div", {className:"bg-white rounded-2xl shadow-sm p-6"},
      React.createElement("h2", {className:"text-lg font-semibold mb-4"},"求人の閲覧・検索"),
      React.createElement("div", {className:"grid md:grid-cols-5 gap-3 mb-4"},
        React.createElement(Field, {label:"種別"},
          React.createElement("select", {className:"w-full border rounded-md px-3 py-2", value:pending.type, onChange:e=>setPending({...pending, type:e.target.value})},
            React.createElement("option", {value:"すべて"},"すべて"),
            React.createElement("option", {value:"特定技能"},"特定技能"),
            React.createElement("option", {value:"技能実習生"},"技能実習生")
          )
        ),
        React.createElement(Field, {label:"採用元"},
          React.createElement("select", {className:"w-full border rounded-md px-3 py-2", value:pending.source, onChange:e=>setPending({...pending, source:e.target.value})},
            React.createElement("option", {value:"すべて"},"すべて"),
            React.createElement("option", {value:"国内"},"国内から採用"),
            React.createElement("option", {value:"国外"},"国外から採用")
          )
        ),
        React.createElement(Field, {label:"職種"},
          React.createElement("select", {className:"w-full border rounded-md px-3 py-2", value:pending.category, onChange:e=>setPending({...pending, category:e.target.value})},
            React.createElement("option", {value:"すべて"},"すべて"),
            cats.map((c,i)=> React.createElement("option", {key:i, value:c}, c))
          )
        ),
        React.createElement("div", {className:"flex items-end"},
          React.createElement("button", {className:"w-full px-4 py-2 rounded-lg bg-black text-white", onClick:applySearch},"検索")
        ),
        React.createElement("div", {className:"flex items-end"},
          React.createElement("button", {className:"w-full px-4 py-2 rounded-lg border", onClick:resetSearch},"リセット")
        )
      ),
      React.createElement("div", {className:"flex items-center justify-between text-sm text-slate-600 mb-2"},
        React.createElement("div", null, "該当：", React.createElement("span",{className:"font-medium"}, String(total)), " 件"),
        React.createElement("div", {className:"flex items-center gap-2"},
          React.createElement("button",{className:"px-2 py-1 rounded border", disabled: currentPage<=1, onClick:()=>setPage(1)},"≪"),
          React.createElement("button",{className:"px-2 py-1 rounded border", disabled: currentPage<=1, onClick:()=>setPage(p=>Math.max(1,p-1))},"＜"),
          React.createElement("span", null, ` ${currentPage} / ${totalPages} `),
          React.createElement("button",{className:"px-2 py-1 rounded border", disabled: currentPage>=totalPages, onClick:()=>setPage(p=>Math.min(totalPages,p+1))},"＞"),
          React.createElement("button",{className:"px-2 py-1 rounded border", disabled: currentPage>=totalPages, onClick:()=>setPage(totalPages)},"≫")
        )
      ),
      React.createElement("div", {className:"divide-y"},
        pageItems.map(j => React.createElement("button", {
          key: j.id,
          onClick: ()=>{ try{ window.open(j.url, "_blank", "noopener,noreferrer"); } catch {} },
          className:"w-full text-left py-3 block hover:bg-slate-50 rounded-lg -mx-3 px-3 transition cursor-pointer"
        },
          React.createElement("div", {className:"flex flex-col md:flex-row md:items-center md:gap-4"},
            React.createElement("div",{className:"flex-1 min-w-0"},
              React.createElement("div",{className:"flex items-center gap-2 text-xs"},
                React.createElement("span",{className:"px-2 py-0.5 rounded border"}, j.jobType),
                j.jobType==="特定技能" ? React.createElement("span",{className:"px-2 py-0.5 rounded border"}, j.recruitSource || "") : null,
                React.createElement("span",{className:"px-2 py-0.5 rounded bg-slate-100"}, j.category)
              ),
              React.createElement("div",{className:"mt-1 font-medium truncate"}, j.title)
            )
          )
        )),
        pageItems.length===0 ? React.createElement("div",{className:"py-10 text-center text-slate-500"},"該当する求人がありません") : null
      )
    );
  }

  function App(){
    const [roleSelected, setRoleSelected] = useState(false);
    const [role, setRole] = useState("");
    const [jobs, setJobs] = useState(loadJobs);
    const [categories, setCategories] = useState(loadCategories);
    const safeCats = Array.isArray(categories) ? categories : DEFAULT_CATEGORIES;

    useEffect(()=>{ try{ window.localStorage.setItem(LS_KEYS.JOBS, JSON.stringify(Array.isArray(jobs)? jobs: [])); }catch{} },[jobs]);
    useEffect(()=>{ try{ window.localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(safeCats)); }catch{} },[safeCats]);

    const resetStorage = () => {
      try{
        window.localStorage.removeItem(LS_KEYS.JOBS);
        window.localStorage.removeItem(LS_KEYS.SETTINGS);
      }catch{}
      setJobs([]); setCategories(DEFAULT_CATEGORIES); setRoleSelected(false);
    };

    const seedDemo = () => {
      const now = Date.now();
      const demo = [
        { id: 'd1', jobType: '特定技能', recruitSource: '国内', category: '介護', title: '介護スタッフ／夜勤あり・寮あり', notes: 'N3目安・夜勤手当あり・社宅あり', url: 'https://example.com/jobs/kaigo-001', createdAt: new Date(now-1000*60*60*24*3).toISOString() },
        { id: 'd2', jobType: '特定技能', recruitSource: '国外', category: '建設', title: '建設作業員（とび・土工）', notes: '年齢不問・日本語コミュニケーションN4〜', url: 'https://example.com/jobs/kensetsu-104', createdAt: new Date(now-1000*60*60*24*2).toISOString() },
        { id: 'd3', jobType: '特定技能', recruitSource: '国内', category: '外食業', title: 'キッチンスタッフ（ラーメン店）', notes: '深夜なし・まかない有り', url: 'https://example.com/jobs/gaishoku-550', createdAt: new Date(now-1000*60*60*12).toISOString() },
        { id: 'd4', jobType: '技能実習生', recruitSource: '', category: '溶接', title: '溶接（半自動）実習生候補', notes: '地方配属・寮費補助', url: 'https://example.com/jobs/trainee-weld-21', createdAt: new Date(now-1000*60*30).toISOString() },
        { id: 'd5', jobType: '特定技能', recruitSource: '国外', category: '宿泊', title: 'フロントスタッフ（リゾート）', notes: '英会話歓迎・寮個室', url: 'https://example.com/jobs/shukuhaku-88', createdAt: new Date(now-1000*60*10).toISOString() }
      ];
      setJobs(demo);
    };

    if (!roleSelected){
      return React.createElement("div",{className:"min-h-screen flex flex-col items-center justify-center"},
        React.createElement("div",{className:"p-8 shadow-md rounded-2xl bg-white w-[480px] max-w-[92vw]"},
          React.createElement("h1",{className:"text-xl font-semibold mb-4"},"あなたはどちらですか？"),
          React.createElement("div",{className:"flex gap-3"},
            React.createElement("button",{className:"px-4 py-2 rounded-lg bg-black text-white", onClick:()=>{ setRole('人材紹介会社'); setRoleSelected(true); }},"人材紹介会社"),
            React.createElement("button",{className:"px-4 py-2 rounded-lg bg-slate-200", onClick:()=>{ setRole('送り出し機関'); setRoleSelected(true); }},"送り出し機関")
          ),
          React.createElement("div",{className:"mt-6 text-xs text-slate-500 text-center"},"プレビューでエラーが出る場合は、右上の「初期化」をお試しください。")
        )
      );
    }

    return React.createElement("div",{className:"min-h-screen"},
      React.createElement("header",{className:"sticky top-0 z-30 backdrop-blur bg-white/70 border-b"},
        React.createElement("div",{className:"mx-auto max-w-6xl px-4 py-3 flex items-center justify-between"},
          React.createElement("h1",{className:"text-2xl font-bold tracking-tight"},"BridgeWork"),
          React.createElement("div",{className:"flex items-center gap-2"},
            React.createElement("button",{className:"px-3 py-2 rounded-lg border", onClick:seedDemo},"デモ追加"),
            React.createElement("button",{className:"px-3 py-2 rounded-lg border", onClick:resetStorage},"初期化"),
            React.createElement("button",{className:"px-3 py-2 rounded-lg border", onClick:()=>setRoleSelected(false)},"戻る")
          )
        )
      ),
      React.createElement("main",{className:"mx-auto max-w-6xl px-4 py-6"},
        React.createElement(ErrorBoundary,null,
          role === "人材紹介会社"
            ? React.createElement(AgencyPanel,{jobs: Array.isArray(jobs)? jobs: [], setJobs, categories: safeCats})
            : React.createElement(SenderPanel,{jobs: Array.isArray(jobs)? jobs: [], categories: safeCats})
        )
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
})();
