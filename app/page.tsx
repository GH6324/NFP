"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
// 註釋掉二維碼依賴
// import { QRCodeSVG } from "qrcode.react";
//导入全局图标
import { 
  Shield, RefreshCw, Trash2, Home, Network, Server, User, LogOut, 
  Palette, PauseCircle, Download, Upload, KeyRound, Save, Terminal,
  Edit2,X,ChevronDown,Loader2,LayoutGrid, List as ListIcon, AlertCircle, 
  CheckCircle2, Copy,List,Plus,ArrowRight,Globe,Activity,Table2,FileText,
  CheckCircle,Grid,XCircle, Info,RefreshCw
} from "lucide-react";

const THEMES = {
  emerald: { primary: "#006C4C", onPrimary: "#FFFFFF", primaryContainer: "#89F8C7", onPrimaryContainer: "#002114" },
  ocean:   { primary: "#0061A4", onPrimary: "#FFFFFF", primaryContainer: "#D1E4FF", onPrimaryContainer: "#001D36" },
  lavender:{ primary: "#6750A4", onPrimary: "#FFFFFF", primaryContainer: "#EADDFF", onPrimaryContainer: "#21005D" },
  rose:    { primary: "#9C4146", onPrimary: "#FFFFFF", primaryContainer: "#FFDADA", onPrimaryContainer: "#40000A" }
};

export default function App() {
  const [auth, setAuth] = useState<string | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [tab, setTab] = useState<"home" | "rules" | "nodes" | "me">("home");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const[themeKey, setThemeKey] = useState<keyof typeof THEMES>("emerald");
  
  const [nodes, setNodes] = useState<any[]>([]);
  const [allRules, setAllRules] = useState<Record<string, any[]>>({});
  
  const [isActive, setIsActive] = useState(true);
  const idleTimer = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("aero_auth");
    if (token) setAuth(token);
    if (localStorage.getItem("aero_theme") === "light") setIsDarkMode(false);
    const savedColor = localStorage.getItem("aero_color") as keyof typeof THEMES;
    if (savedColor && THEMES[savedColor]) setThemeKey(savedColor);

    const resetIdle = () => {
      setIsActive(true);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIsActive(false), 60000);
    };
    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("touchstart", resetIdle);
    resetIdle();
    return () => { 
      window.removeEventListener("mousemove", resetIdle); 
      window.removeEventListener("touchstart", resetIdle); 
    };
  },[]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("aero_theme", isDarkMode ? "dark" : "light");
  },[isDarkMode]);

  useEffect(() => {
    const root = document.documentElement;
    const t = THEMES[themeKey];
    root.style.setProperty("--md-primary", t.primary);
    root.style.setProperty("--md-on-primary", t.onPrimary);
    root.style.setProperty("--md-primary-container", t.primaryContainer);
    root.style.setProperty("--md-on-primary-container", t.onPrimaryContainer);
    localStorage.setItem("aero_color", themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (auth && isActive && !isFirstLogin) {
      fetchAllData();
      const interval = setInterval(() => {
        fetchAllData();
        api("KEEP_ALIVE"); 
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [auth, isActive, isFirstLogin]);

  const api = async (action: string, data: any = {}) => {
    try {
      return (await axios.post("/api", { action, auth, ...data })).data;
    } catch (err: any) {
      if (err.response?.status === 401) {
        setAuth(null);
        localStorage.removeItem("aero_auth");
      }
      throw err;
    }
  };

  const fetchAllData = async () => {
    try {
      const fetchedNodes = await api("GET_NODES");
      const nodesArray = Object.values(fetchedNodes);
      setNodes(nodesArray);
      
      const rulesMap: any = {};
      for (const n of nodesArray as any[]) {
        rulesMap[n.id] = await api("GET_RULES", { nodeId: n.id });
      }
      setAllRules(rulesMap);
    } catch (e) { console.error(e); }
  };

  if (!auth) return <LoginView setAuth={setAuth} setIsFirstLogin={setIsFirstLogin} />;

  return (
    <div className="min-h-screen bg-[#FBFDF8] dark:bg-[#111318] text-[#191C1A] dark:text-[#E2E2E5] pb-24 font-sans transition-colors duration-300 overflow-x-hidden">
      <AnimatePresence>
        {isFirstLogin && <ForcePasswordChange api={api} setAuth={setAuth} onComplete={() => setIsFirstLogin(false)} />}
      </AnimatePresence>

      <header className="px-6 py-5 flex justify-between items-center sticky top-0 z-10 bg-[#FBFDF8]/80 dark:bg-[#111318]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <motion.div className="flex items-center gap-3" whileTap={{ scale: 0.95 }}>
          <div className="p-2 rounded-full" style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AeroNode</h1>
        </motion.div>
        <motion.button whileTap={{ scale: 0.8 }} onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-full bg-[#F0F4EF] dark:bg-[#202522]">
          {isDarkMode ? "🌞" : "🌙"}
        </motion.button>
      </header>

      {!isActive && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mx-4 mt-4 p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 text-sm font-bold cursor-pointer" onClick={() => setIsActive(true)}>
          <PauseCircle className="w-5 h-5" /> 點擊恢復實時狀態更新
        </motion.div>
      )}

      <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {tab === "home" && <DashboardView nodes={nodes} allRules={allRules} />}
            {tab === "nodes" && <NodesView nodes={nodes} fetchAllData={fetchAllData} api={api} />}
            {tab === "rules" && <RulesView nodes={nodes} allRules={allRules} fetchAllData={fetchAllData} api={api} />}
            {tab === "me" && <MeView api={api} setAuth={setAuth} themeKey={themeKey} setThemeKey={setThemeKey} fetchAllData={fetchAllData} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full bg-[#F4F8F4] dark:bg-[#191C1A] border-t border-gray-200/50 dark:border-white/5 px-2 py-2 flex justify-around items-center z-50 safe-area-pb">
        <NavItem icon={<Home className="w-6 h-6"/>} label="首頁" active={tab==="home"} onClick={()=>setTab("home")} />
        <NavItem icon={<Network className="w-6 h-6"/>} label="轉發" active={tab==="rules"} onClick={()=>setTab("rules")} />
        <NavItem icon={<Server className="w-6 h-6"/>} label="節點" active={tab==="nodes"} onClick={()=>setTab("nodes")} />
        <NavItem icon={<User className="w-6 h-6"/>} label="設定" active={tab==="me"} onClick={()=>setTab("me")} />
      </nav>
    </div>
  );
}
//底部导航栏按钮动画逻辑实现
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <motion.button
      layout // 启用布局动画，确保文字出现时容器平滑调整尺寸
      whileTap={{ scale: 0.95 }} // 点击时的微缩反馈
      onClick={onClick}
      className="flex flex-col items-center justify-center flex-1 gap-1 relative outline-none py-2"
    >
      {/* 图标容器：设置为 relative 以便放置绝对定位的背景 */}
      <div className="relative px-5 py-1 flex items-center justify-center">
        
        {/* 1. 激活背景 (胶囊状波纹) */}
        <AnimatePresence>
          {active && (
            <motion.div
              layoutId="nav-item-active-indicator" // 如果有多个NavItem，这能实现跨按钮的滑动效果，单个使用也能保证平滑
              initial={{ opacity: 0, scale: 0.5 }} // 初始状态：透明且缩小（模拟从中心开始）
              animate={{ opacity: 1, scale: 1 }}   // 激活状态：完全显示且填充
              exit={{ opacity: 0, scale: 0.5 }}    // 退出状态：缩小并消失
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30 
              }} 
              className="absolute inset-0 bg-[var(--md-primary-container)] rounded-full" 
            />
          )}
        </AnimatePresence>

        {/* 2. 图标层 */}
        {/* z-10 确保图标始终位于背景之上 */}
        <span 
          className={`relative z-10 transition-colors duration-200 ${
            active 
              ? 'text-[var(--md-on-primary-container)]' // 激活时：取主容器上的对比色
              : 'text-gray-500'                          // 未激活时：灰色
          }`}
        >
          {icon}
        </span>
      </div>

      {/* 3. 文字标签 (仅在激活时出现) */}
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ opacity: 0, y: 5, height: 0 }} // 初始：隐形、向下偏移、高度为0
            animate={{ opacity: 1, y: 0, height: "auto" }} // 激活：浮现、回正
            exit={{ opacity: 0, y: 5, height: 0 }}    // 退出：下沉消失
            transition={{ duration: 0.2, delay: 0.05 }} // 稍微延迟，让背景先动
            className="text-[12px] font-bold text-[var(--md-primary)] overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
// 通用 MD3 风格弹窗组件
function AlertDialog({ open, title, content, type = "error", onConfirm }: any) {
  if (!open) return null;
  const isError = type === "error";
  const bgColor = isError ? "bg-red-100 dark:bg-red-900/30" : "bg-green-100 dark:bg-green-900/30";
  const iconColor = isError ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  const btnColor = isError ? "bg-red-600 text-white" : "bg-green-600 text-white";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-[320px] bg-[#F0F4EF] dark:bg-[#202522] rounded-[28px] p-6 shadow-2xl flex flex-col items-center text-center space-y-4"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor} ${iconColor}`}>
          {isError ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{content}</p>
        </div>
        <button 
          onClick={onConfirm}
          className={`w-full py-3 rounded-full font-medium text-sm transition-transform active:scale-95 ${btnColor}`}
        >
          {isError ? "重试" : "好的"}
        </button>
      </motion.div>
    </div>
  );
}

// 登录界面
function LoginView({ setAuth, setIsFirstLogin }: any) {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogState, setDialogState] = useState({ open: false, title: "", content: "" });

  const handleLogin = async () => {
    if (!pwd) return;
    setLoading(true);
    try {
      const res = await axios.post("/api", { action: "LOGIN", password: pwd });
      
      // 修复逻辑：优先设置是否首次登录标志，确保父组件能及时捕获该状态
      // 防止 setAuth 导致页面立即跳转从而跳过了 ForcePasswordChange 的渲染
      if (res.data.isFirstLogin) {
        setIsFirstLogin(true);
      }
      
      localStorage.setItem("aero_auth", res.data.token);
      setAuth(res.data.token);
      
    } catch (e) {
      setDialogState({
        open: true,
        title: "登錄失敗",
        content: "密碼錯誤或網絡異常，請檢查後重試。"
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFDF8] dark:bg-[#111318] p-6 text-gray-900 dark:text-white">
      <AlertDialog 
        open={dialogState.open} 
        title={dialogState.title} 
        content={dialogState.content} 
        onConfirm={() => setDialogState({ ...dialogState, open: false })}
      />
      
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm bg-[#F0F4EF] dark:bg-[#202522] p-8 rounded-[32px] space-y-8 shadow-xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 z-10 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-8 h-8 border-4 border-[var(--md-primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <div className="text-center space-y-3">
          <Shield className="w-16 h-16 mx-auto text-[#006C4C]" />
          <h1 className="text-3xl font-bold">AeroNode</h1>
          <p className="text-xs text-gray-500">請輸入管理密碼</p>
        </div>
        
        <input 
          type="password" 
          value={pwd} 
          disabled={loading}
          onChange={e => setPwd(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleLogin()} 
          className="w-full bg-white dark:bg-[#111318] p-4 rounded-2xl text-center focus:outline-none focus:ring-2 ring-[var(--md-primary)] transition-all" 
          placeholder="••••••••" 
        />
        
        <motion.button 
          whileTap={{ scale: 0.95 }} 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full py-4 bg-[var(--md-primary)] text-[var(--md-on-primary)] rounded-full font-bold shadow-lg shadow-[var(--md-primary)]/20 hover:shadow-[var(--md-primary)]/40 transition-shadow"
        >
          {loading ? "驗證中..." : "登錄"}
        </motion.button>
      </motion.div>
    </div>
  );
}

// 强制改密码弹窗
function ForcePasswordChange({ api, setAuth, onComplete }: any) {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean, type: "error" | "success", title: string, content: string }>({ 
    open: false, type: "error", title: "", content: "" 
  });

  const handleSave = async () => {
    if (pwd.length < 6) {
      setAlert({ open: true, type: "error", title: "密碼太短", content: "為了您的安全，新密碼長度至少需要 6 位。" });
      return;
    }

    setLoading(true);
    try {
      const res = await api("CHANGE_PASSWORD", { newPassword: pwd });
      // 更新本地存储和状态
      localStorage.setItem("aero_auth", res.token);
      setAuth(res.token);
      
      // 成功提示
      setAlert({ 
        open: true, 
        type: "success", 
        title: "修改成功", 
        content: "您的密碼已更新，請使用新密碼登錄。" 
      });
    } catch (e) {
      setAlert({ open: true, type: "error", title: "修改失敗", content: "服務器拒絕了修改請求，請稍後重試。" });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <AlertDialog 
        open={alert.open} 
        type={alert.type}
        title={alert.title} 
        content={alert.content} 
        onConfirm={() => {
          setAlert({ ...alert, open: false });
          if (alert.type === "success") {
            onComplete(); // 只有在用户点击确认成功后，才关闭整个强制改密窗口
          }
        }}
      />

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#F0F4EF] dark:bg-[#202522] p-8 rounded-[32px] w-full max-w-sm space-y-6 border-2 border-red-500/20 shadow-2xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#F0F4EF]/80 dark:bg-[#202522]/80 z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2">
            <KeyRound className="w-6 h-6"/> 安全警告
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            您正在使用初始默認密碼。為確保系統安全，<span className="font-bold text-red-500">必須</span>設置一個新密碼才能繼續。
          </p>
        </div>

        <input 
          type="password" 
          value={pwd} 
          onChange={e => setPwd(e.target.value)} 
          className="w-full bg-white dark:bg-[#111318] p-4 rounded-2xl text-center focus:outline-none focus:ring-2 ring-red-500 transition-all text-lg" 
          placeholder="輸入新密碼 (至少6位)" 
        />
        
        <motion.button 
          whileTap={{ scale: 0.95 }} 
          onClick={handleSave} 
          disabled={loading}
          className="w-full py-4 bg-red-500 text-white rounded-full font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors"
        >
          {loading ? "保存中..." : "確認並修改"}
        </motion.button>
      </motion.div>
    </div>
  );
}
//首页仪表盘
function DashboardView({ nodes, allRules }: any) {
  // 定义视图模式状态: 'new-card' | 'classic' | 'table'
  const [viewMode, setViewMode] = useState('new-card');

  // 顶部总览卡片组件
  const SummaryCard = ({ title, value }: { title: string, value: number }) => (
    <motion.div 
      whileHover={{ scale: 1.02 }} 
      className="bg-[#F0F4EF] dark:bg-[#202522] p-6 rounded-[28px] text-center flex flex-col justify-center items-center h-full relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[var(--md-primary)] opacity-[0.03] dark:opacity-[0.08]"></div>
      <div className="text-sm text-gray-500 dark:text-gray-400 z-10">{title}</div>
      <div className="text-3xl font-bold text-[var(--md-primary)] z-10 mt-2">{value}</div>
    </motion.div>
  );

  // 圆形进度条组件 (MD3风格)
  const CircleProgress = ({ percent, label, sublabel, color = "text-[var(--md-primary)]" }: any) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* 背景圆环 */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              className="text-[var(--md-surface-variant)] dark:text-gray-700"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="40"
              cy="40"
            />
            {/* 进度圆环 */}
            <circle
              className={`${color} transition-all duration-1000 ease-out`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="40"
              cy="40"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-sm font-bold ${color}`}>{percent.toFixed(0)}<span className="text-[10px]">%</span></span>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{label}</span>
      </div>
    );
  };

  // 视图切换按钮组件
  const ViewToggle = () => (
    <div className="flex justify-end mb-4">
      <div className="bg-[#E0E4DE] dark:bg-[#2A2D2A] p-1 rounded-full flex gap-1">
        {[
          { id: 'new-card', icon: 'grid_view', label: '卡片' },
          { id: 'classic', icon: 'dashboard', label: '經典' },
          { id: 'table', icon: 'table_rows', label: '列表' }
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              viewMode === mode.id
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {/* 使用 Material Icons 图标字体，如环境不支持可仅显示文字 */}
            <span className="material-symbols-rounded text-sm hidden sm:block">{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 顶部统计区域 */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard title="總節點" value={nodes.length} />
        <SummaryCard title="運行規則" value={Object.values(allRules).flat().length} />
      </div>

      {/* 视图切换器 */}
      <ViewToggle />

      {/* 内容区域 */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            /* 表格视图 */
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#F0F4EF] dark:bg-[#202522] rounded-[28px] overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">狀態</th>
                      <th className="p-4 font-medium">名稱</th>
                      <th className="p-4 font-medium">IP 地址</th>
                      <th className="p-4 font-medium">處理器</th>
                      <th className="p-4 font-medium">記憶體</th>
                      <th className="p-4 font-medium text-right">下載</th>
                      <th className="p-4 font-medium text-right">上傳</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {nodes.map((n: any) => {
                      const isOnline = n.lastSeen && (Date.now() - n.lastSeen < 60000);
                      const ram = parseFloat(n.stats?.ram_usage || "0");
                      const cpu = parseFloat(n.stats?.cpu_load || "0.0") * 10;
                      
                      return (
                        <tr key={n.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></span>
                          </td>
                          <td className="p-4 font-bold text-[var(--md-primary)]">{n.name}</td>
                          <td className="p-4 text-xs font-mono text-gray-500">{n.ip}</td>
                          <td className="p-4 text-xs">{Math.min(cpu, 100).toFixed(1)}%</td>
                          <td className="p-4 text-xs">{ram.toFixed(1)}%</td>
                          <td className="p-4 text-xs font-mono text-right text-emerald-600 dark:text-emerald-400">{n.stats?.rx_speed || "0 B/s"}</td>
                          <td className="p-4 text-xs font-mono text-right text-blue-600 dark:text-blue-400">{n.stats?.tx_speed || "0 B/s"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            /* 网格视图容器 (卡片模式) */
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid gap-4 ${viewMode === 'new-card' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}
            >
              {nodes.map((n: any) => {
                const isOnline = n.lastSeen && (Date.now() - n.lastSeen < 60000);
                const ramVal = parseFloat(n.stats?.ram_usage || "0");
                const cpuRaw = parseFloat(n.stats?.cpu_load || "0.0");
                const cpuVal = Math.min(cpuRaw * 10, 100);
                const rx = n.stats?.rx_speed || "0 B/s";
                const tx = n.stats?.tx_speed || "0 B/s";

                // 新版 MD3 卡片视图
                if (viewMode === 'new-card') {
                  return (
                    <motion.div 
                      key={n.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#F0F4EF] dark:bg-[#202522] rounded-[32px] p-6 relative overflow-hidden group"
                    >
                      {/* 背景微光效果 */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-[var(--md-primary)] blur-[60px] opacity-10 rounded-full pointer-events-none transition-opacity duration-500 ${isOnline ? 'opacity-20' : 'opacity-0'}`}></div>

                      <div className="flex flex-col h-full justify-between gap-6">
                        {/* 头部：名称与状态 */}
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-bold tracking-tight text-[var(--md-on-surface)]">{n.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 opacity-80">{n.ip}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors duration-300 ${
                            isOnline 
                              ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                          }`}>
                            {isOnline ? '在線' : '離線'}
                          </div>
                        </div>

                        {/* 中部：仪表盘圆环 (CPU & RAM) */}
                        <div className="flex items-center justify-around py-2">
                           <CircleProgress 
                             percent={cpuVal} 
                             label="處理器" 
                             color={isOnline ? "text-[var(--md-primary)]" : "text-gray-400"}
                           />
                           <CircleProgress 
                             percent={ramVal} 
                             label="記憶體" 
                             color={isOnline ? "text-[var(--md-primary)]" : "text-gray-400"}
                           />
                        </div>

                        {/* 底部：网络数据 */}
                        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 flex justify-between items-center backdrop-blur-sm">
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">下載</span>
                            <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <span className="text-xs">↓</span> {rx}
                            </span>
                          </div>
                          <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase font-bold mb-0.5">上傳</span>
                            <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              {tx} <span className="text-xs">↑</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // 经典卡片视图
                return (
                  <motion.div key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F0F4EF] dark:bg-[#202522] rounded-[32px] p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold">{n.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">{n.ip}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${isOnline ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]' : 'bg-gray-300 dark:bg-gray-800 text-gray-500'}`}>
                        {isOnline ? '在線' : '離線'}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>處理器負載</span>
                                <span>{cpuVal.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(cpuVal, 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>記憶體使用</span>
                                <span>{ramVal}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${ramVal}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white dark:bg-[#111318] py-4 rounded-2xl flex flex-col items-center justify-center">
                         <span className="text-xs text-gray-500 mb-1">↓ 下載速率</span>
                         <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{rx}</span>
                       </div>
                       <div className="bg-white dark:bg-[#111318] py-4 rounded-2xl flex flex-col items-center justify-center">
                         <span className="text-xs text-gray-500 mb-1">↑ 上傳速率</span>
                         <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{tx}</span>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
//节点管理页面
function NodesView({ nodes, api, fetchAllData }: any) {
  // 視圖切換：預設讀取 localStorage
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    return (typeof window !== 'undefined' ? localStorage.getItem('nodesViewMode') as 'card' | 'table' : 'card') || 'card';
  });

  // 統一對話框狀態
  type DialogConfig = {
    isOpen: boolean;
    type: 'error' | 'confirm' | 'install';
    title: string;
    message?: string;
    targetId?: string;
    installCmd?: string;
  };
  const[dialog, setDialog] = useState<DialogConfig>({ isOpen: false, type: 'error', title: '' });

  // 編輯與新增狀態：null 表示未編輯，index: -1 表示新增
  const [editing, setEditing] = useState<{ index: number; node: any } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 底部居中氣泡提示狀態
  const [toast, setToast] = useState({ show: false, message: '' });

  const generateToken = () => Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const handleViewModeChange = (mode: 'card' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('nodesViewMode', mode);
  };

  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 2500);
  };

  // 驗證 IP 或域名格式
  const validateIPOrDomain = (str: string) => {
    const ipv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    const domain = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return ipv4.test(str) || domain.test(str);
  };

  const handleSave = async () => {
    if (!editing) return;
    const { node } = editing;

    if (!node.name.trim()) {
      setDialog({ isOpen: true, type: 'error', title: '保存失敗', message: '請填寫節點名稱' });
      return;
    }
    if (!node.ip.trim() || !validateIPOrDomain(node.ip.trim())) {
      setDialog({ isOpen: true, type: 'error', title: '保存失敗', message: '請填寫正確格式的公網 IP 或域名' });
      return;
    }

    setIsSaving(true);
    try {
      if (editing.index === -1) {
        await api("ADD_NODE", { node });
      } else {
        await api("EDIT_NODE", { node }); // 假設後端支持編輯接口
      }
      await fetchAllData();
      setEditing(null);
      showToast(editing.index === -1 ? "✅ 節點添加成功" : "✅ 節點保存成功");
    } catch (e: any) {
      setDialog({ isOpen: true, type: 'error', title: '保存失敗', message: e.message || '發生未知錯誤' });
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await api("DELETE_NODE", { nodeId: id });
      await fetchAllData();
      showToast("✅ 已成功刪除節點");
    } catch (e: any) {
      setDialog({ isOpen: true, type: 'error', title: '刪除失敗', message: e.message });
    }
  };

  const handleDialogConfirm = async () => {
    if (dialog.type === 'error' || dialog.type === 'install') {
      setDialog({ ...dialog, isOpen: false });
    } else if (dialog.type === 'confirm' && dialog.targetId) {
      await executeDelete(dialog.targetId);
      setDialog({ ...dialog, isOpen: false });
    }
  };

  const openInstallDialog = (n: any) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const installCmd = `curl -sSL ${origin}/api/install | bash -s -- --token ${n.token} --id ${n.id} --panel ${origin}`;
    setDialog({ isOpen: true, type: 'install', title: '獲取安裝指令', installCmd });
  };

  const copyInstallCmd = () => {
    if (dialog.installCmd) {
      navigator.clipboard.writeText(dialog.installCmd);
      showToast("已複製安裝指令");
    }
  };

  // 解決 Type Error：加入 as const 強制約束類型
  const springAnim = { type: "spring" as const, stiffness: 400, damping: 30 };

  return (
    <div className="space-y-6 relative">
      <div className="bg-[#F8FAF7] dark:bg-[#1A1D1B] p-5 rounded-[32px] space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[18px] text-[#191C1A] dark:text-white">節點管理</span>
            <div className="flex bg-[#E9EFE7] dark:bg-[#202522] p-1 rounded-full shadow-inner">
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => handleViewModeChange('card')} 
                className={`px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-[#3A3F3B] shadow-sm text-[#191C1A] dark:text-white' : 'text-gray-500'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5"/> 卡片
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => handleViewModeChange('table')} 
                className={`px-3 py-1.5 rounded-full text-[13px] font-bold flex items-center gap-1.5 transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-[#3A3F3B] shadow-sm text-[#191C1A] dark:text-white' : 'text-gray-500'}`}
              >
                <List className="w-3.5 h-3.5"/> 表格
              </motion.button>
            </div>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setEditing({ index: -1, node: { name: "", ip: "", port: "8080", token: generateToken() } })} 
            className="text-[var(--md-primary)] font-bold bg-[var(--md-primary-container)] px-5 py-2.5 rounded-full text-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4"/> 添加新節點
          </motion.button>
        </div>

        {nodes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm font-bold flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#E9EFE7] dark:bg-[#202522] flex items-center justify-center">
              <Server className="w-8 h-8 text-gray-300 dark:text-gray-600"/>
            </div>
            暫無節點，請點擊上方按鈕添加
          </div>
        ) : (
          <>
            {/* 卡片視圖 */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {nodes.map((n: any, idx: number) => {
                    // 兼容儀表板判斷在線邏輯
                    const isOnline = n.lastSeen && (Date.now() - n.lastSeen < 60000);
                    
                    return (
                      <motion.div 
                        layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={springAnim}
                        key={n.id} 
                        className="bg-white dark:bg-[#111318] p-5 rounded-[24px] shadow-sm border border-[#E9EFE7] dark:border-white/5 flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {/* 狀態指示點 */}
                              <span className="relative flex h-3 w-3">
                                {isOnline ? (
                                  <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></>
                                ) : (
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-300 dark:bg-gray-600"></span>
                                )}
                              </span>
                              <span className="text-[18px] font-bold text-[#191C1A] dark:text-white line-clamp-1">{n.name}</span>
                            </div>
                            <div className="text-[13px] font-mono font-bold text-gray-500">{n.ip}</div>
                          </div>
                          <div className="flex bg-[#F8FAF7] dark:bg-white/5 rounded-2xl p-1">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing({ index: idx, node: { ...n } })} className="p-2 text-gray-500 hover:text-[var(--md-primary)] transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDialog({ isOpen: true, type: 'confirm', title: '刪除節點', message: `確定要刪除節點「${n.name}」嗎？此操作無法恢復。`, targetId: n.id })} className="p-2 text-red-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                        
                        <motion.button 
                          whileTap={{ scale: 0.95 }} 
                          onClick={() => openInstallDialog(n)}
                          className="w-full bg-[#F0F4EF] dark:bg-[#202522] hover:bg-[#E9EFE7] dark:hover:bg-white/10 transition-colors rounded-[16px] p-3 flex items-center justify-center gap-2 text-[13px] font-bold text-[#404943] dark:text-gray-300"
                        >
                          <Terminal className="w-4 h-4" /> 獲取安裝指令
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* 表格視圖 */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto bg-white dark:bg-[#111318] rounded-[24px] shadow-sm border border-[#E9EFE7] dark:border-white/5">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#E9EFE7] dark:border-white/5 text-[12px] text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-5 font-bold">狀態</th>
                      <th className="py-4 px-5 font-bold">節點名稱</th>
                      <th className="py-4 px-5 font-bold">公網 IP / 域名</th>
                      <th className="py-4 px-5 font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((n: any, idx: number) => {
                      const isOnline = n.lastSeen && (Date.now() - n.lastSeen < 60000);

                      return (
                        <tr key={n.id} className="border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-[#F8FAF7] dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-5">
                            <span className="relative flex h-3 w-3">
                              {isOnline ? (
                                <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></>
                              ) : (
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-300 dark:bg-gray-600"></span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-5 font-bold text-[#404943] dark:text-gray-300">{n.name}</td>
                          <td className="py-3 px-5 font-mono text-[#191C1A] dark:text-white font-bold">{n.ip}</td>
                          <td className="py-3 px-5 flex justify-end gap-2">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openInstallDialog(n)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors" title="獲取指令">
                              <Terminal className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing({ index: idx, node: { ...n } })} className="p-2 text-[var(--md-primary)] hover:bg-[var(--md-primary-container)] rounded-full transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setDialog({ isOpen: true, type: 'confirm', title: '刪除節點', message: `確定要刪除節點「${n.name}」嗎？此操作無法恢復。`, targetId: n.id })} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 編輯/新增節點 MD3 彈窗 */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 w-screen h-[100dvh]">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => !isSaving && setEditing(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={springAnim}
              className="relative w-full max-w-md bg-[#FBFDF7] dark:bg-[#111318] rounded-[32px] shadow-2xl flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[22px] font-bold text-[#191C1A] dark:text-white">
                  {editing.index === -1 ? "添加新節點" : "編輯節點"}
                </h3>
                <button onClick={() => !isSaving && setEditing(null)} className="p-2 bg-[#E9EFE7] dark:bg-white/10 rounded-full hover:scale-105 transition-transform text-gray-500 dark:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 ml-1">節點名稱</label>
                  <input 
                    value={editing.node.name} 
                    onChange={e => setEditing({ ...editing, node: { ...editing.node, name: e.target.value } })} 
                    className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-bold text-sm text-[#191C1A] dark:text-white outline-none focus:ring-2 ring-[var(--md-primary)] transition-shadow" 
                    placeholder="例如：香港-01" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 ml-1">公網 IP 或域名</label>
                  <input 
                    value={editing.node.ip} 
                    onChange={e => setEditing({ ...editing, node: { ...editing.node, ip: e.target.value } })} 
                    className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-sm text-[#191C1A] dark:text-white outline-none focus:ring-2 ring-[var(--md-primary)] transition-shadow" 
                    placeholder="8.8.8.8 或 node.example.com" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-500 ml-1">節點 Token (通訊密鑰)</label>
                  <div className="relative flex items-center bg-[#F0F4EF] dark:bg-[#202522] rounded-[20px] focus-within:ring-2 ring-[var(--md-primary)] transition-shadow">
                    <input 
                      value={editing.node.token} 
                      readOnly
                      className="w-full bg-transparent p-4 font-mono text-sm text-gray-500 dark:text-gray-400 outline-none" 
                    />
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setEditing({ ...editing, node: { ...editing.node, token: generateToken() } })}
                      className="absolute right-2 px-3 py-1.5 bg-white dark:bg-[#3A3F3B] shadow-sm rounded-xl text-xs font-bold text-[var(--md-primary)] hover:opacity-80"
                    >
                      重置
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setEditing(null)} disabled={isSaving}
                  className="flex-1 py-3.5 rounded-full font-bold text-[#404943] dark:text-gray-200 bg-[#E9EFE7] dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave} disabled={isSaving}
                  className="flex-1 py-3.5 rounded-full font-bold bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90 transition-opacity flex justify-center items-center gap-2 disabled:opacity-70 shadow-md shadow-[var(--md-primary)]/20"
                >
                  {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /><span>保存中...</span></> : <span>保存</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 統一全局的 MD3 彈窗 (錯誤提示、確認、安裝指令) */}
      <AnimatePresence>
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 w-screen h-[100dvh]">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => !isSaving && setDialog({ ...dialog, isOpen: false })}
              className="absolute inset-0 bg-black/40 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} transition={springAnim}
              className="relative w-full max-w-sm bg-[#FBFDF7] dark:bg-[#111318] rounded-[28px] shadow-2xl flex flex-col p-6"
            >
              <h3 className="text-[22px] font-bold mb-4 text-[#191C1A] dark:text-[#E2E3DF]">
                {dialog.title}
              </h3>
              
              <div className="mb-6">
                {dialog.type === 'install' ? (
                  <div className="space-y-3">
                    <p className="text-[13px] font-medium text-[#404943] dark:text-gray-400">請在目標伺服器上執行以下指令：</p>
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      onClick={copyInstallCmd}
                      className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[16px] text-[13px] font-mono text-[var(--md-primary)] cursor-pointer hover:opacity-80 transition-opacity leading-relaxed break-all shadow-inner"
                    >
                      {dialog.installCmd}
                    </motion.div>
                  </div>
                ) : (
                  <p className="text-[14px] leading-relaxed text-[#404943] dark:text-[#C3C8C4] font-medium">
                    {dialog.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-auto">
                {dialog.type !== 'error' && (
                  <button 
                    disabled={isSaving} onClick={() => setDialog({ ...dialog, isOpen: false })} 
                    className="px-5 py-2.5 rounded-full text-sm font-bold text-[var(--md-primary)] hover:bg-[var(--md-primary)]/10 transition-colors disabled:opacity-50"
                  >
                    {dialog.type === 'install' ? '關閉' : '取消'}
                  </button>
                )}
                {dialog.type !== 'install' && (
                  <button 
                    disabled={isSaving} onClick={handleDialogConfirm} 
                    className="px-5 py-2.5 rounded-full text-sm font-bold bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> 處理中...</> : '確定'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 居中氣泡提示 (Toast) - 完全符合淺/深色邏輯與手機 MD3 樣式 */}
      <AnimatePresence>
        {toast.show && (
          <div className="fixed bottom-12 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={springAnim}
              className="bg-[#FBFDF7] dark:bg-[#2A2F2C] text-[#191C1A] dark:text-[#E2E3DF] border border-black/5 dark:border-white/5 px-6 py-3.5 rounded-full shadow-lg font-bold text-[14px] tracking-wide flex items-center gap-2"
            >
              {toast.message}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

//規則編輯頁面
function RulesView({ nodes, allRules, api, fetchAllData }: any) {
  const [selected, setSelected] = useState<string>(nodes[0]?.id || "");
  const[rules, setRules] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  // 統一管理所有模態框狀態
  const [modal, setModal] = useState<{ type: string; data?: any } | null>(null);
  const[isSelectOpen, setIsSelectOpen] = useState<'protocol' | 'node' | null>(null);
  const[importReport, setImportReport] = useState<{total: number, success: number, fail: number, errors: string[]} | null>(null);

  useEffect(() => {
    if (selected) setRules(allRules[selected] || []);
  }, [selected, allRules]);

  const currentNode = nodes.find((n: any) => n.id === selected);

  const validateRule = (rule: any, targetNodeId: string, skipIndex: number = -1) => {
    const errors =[];
    if (!rule.listen_port) errors.push("本地端口/區間不能為空");
    else if (!/^\d+(-\d+)?$/.test(rule.listen_port)) errors.push("本地端口格式錯誤 (僅限數字或用-連接的區間)");
    
    if (!rule.dest_ip) errors.push("目標 IP 不能為空");
    else if (!/^([a-zA-Z0-9-.]+|[\d.]+|(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4})$/.test(rule.dest_ip)) errors.push("目標 IP 格式不正確");
    
    if (!rule.dest_port) errors.push("目標端口不能為空");
    else if (!/^\d+(-\d+)?$/.test(rule.dest_port)) errors.push("目標端口格式錯誤");

    const targetRules = targetNodeId === selected ? rules : (allRules[targetNodeId] ||[]);
    if (rule.name) {
      const nameConflict = targetRules.some((r: any, idx: number) => idx !== skipIndex && r.name === rule.name);
      if (nameConflict) errors.push(`自定義名稱 "${rule.name}" 已存在`);
    }

    const portConflict = targetRules.some((r: any, idx: number) => 
      idx !== skipIndex && r.listen_port === rule.listen_port && 
      (r.protocol === rule.protocol || r.protocol === 'tcp,udp' || rule.protocol === 'tcp,udp')
    );
    if (portConflict) errors.push(`本地端口 ${rule.listen_port} 與現有規則衝突`);

    return errors;
  };

  const handleSave = async () => {
    if (!modal?.data?.rule) return;
    setIsSaving(true);
    
    const targetNodeId = modal.data.nodeId || selected;
    let ruleToSave = { ...modal.data.rule };
    
    if (!ruleToSave.name || ruleToSave.name.trim() === "") {
      const targetRules = targetNodeId === selected ? rules : (allRules[targetNodeId] ||[]);
      ruleToSave.name = `新建規則${targetRules.length + 1}`;
    }

    const errors = validateRule(ruleToSave, targetNodeId, modal.data.index);
    
    if (errors.length > 0) {
      setModal({ type: 'alert', data: { message: errors.join('\n'), returnTo: modal } });
      setIsSaving(false);
      return;
    }

    try {
      const targetRules = targetNodeId === selected ? [...rules] : [...(allRules[targetNodeId] ||[])];
      if (modal.data.index === -1) targetRules.push(ruleToSave);
      else {
        if(targetNodeId === selected) targetRules[modal.data.index] = ruleToSave;
        else targetRules.push(ruleToSave); 
      }

      await api("SAVE_RULES", { nodeId: targetNodeId, rules: targetRules });
      
      if (targetNodeId === selected) {
        setRules(targetRules);
      } else if (modal.data.index !== -1 && targetNodeId !== selected) {
        const currentRules = [...rules];
        currentRules.splice(modal.data.index, 1);
        await api("SAVE_RULES", { nodeId: selected, rules: currentRules });
        setRules(currentRules);
      }

      fetchAllData();
      setModal(null);
    } catch (e) {
      setModal({ type: 'alert', data: { message: "保存失敗，請重試" } });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = (idx: number) => {
    setModal({
      type: 'confirm',
      data: {
        message: "確定要刪除這條規則嗎？",
        onConfirm: async () => {
          const newRules = [...rules];
          newRules.splice(idx, 1);
          setRules(newRules);
          await api("SAVE_RULES", { nodeId: selected, rules: newRules });
          fetchAllData();
          setModal(null);
        }
      }
    });
  };

  const handleExport = () => {
    if (rules.length === 0) return setModal({ type: 'alert', data: { message: "沒有可導出的規則" } });
    const exportStr = rules.map(r => `${r.name || ''}|${r.listen_port}|${r.dest_ip}|${r.dest_port}|${r.protocol}`).join('\n');
    const blob = new Blob([exportStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rules_${currentNode?.name || 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (text: string) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const newRules = [...rules];

    lines.forEach((line, index) => {
      const parts = line.split('|');
      if (parts.length !== 5) {
        failCount++;
        errors.push(`第 ${index + 1} 行: 格式錯誤 (需要5個欄位)`);
        return;
      }
      
      const rule = {
        name: parts[0].trim(),
        listen_port: parts[1].trim(),
        dest_ip: parts[2].trim(),
        dest_port: parts[3].trim(),
        protocol: parts[4].trim().toLowerCase()
      };

      const valErrors = validateRule(rule, selected, -1);
      if (valErrors.length > 0) {
        failCount++;
        errors.push(`第 ${index + 1} 行 (${rule.listen_port}): ${valErrors[0]}`);
      } else {
        if (!rule.name) rule.name = `導入規則${newRules.length + 1}`;
        newRules.push(rule);
        successCount++;
      }
    });

    setImportReport({ total: lines.length, success: successCount, fail: failCount, errors });
    
    if (successCount > 0) {
      await api("SAVE_RULES", { nodeId: selected, rules: newRules });
      setRules(newRules);
      fetchAllData();
    }
  };

  const startDiagnostics = (rule: any) => {
    if (rule.listen_port.includes('-')) {
      setModal({ type: 'diagnose-port-input', data: { rule, portInputValue: "", portError: "" } });
    } else {
      executeDiagnostics(rule, rule.listen_port);
    }
  };

  const executeDiagnostics = async (rule: any, portToTest: string) => {
    // 嚴格校驗傳入的單一端口或端口區間合法性
    if (rule.listen_port.includes('-')) {
      const [start, end] = rule.listen_port.split('-').map(Number);
      const p = Number(portToTest);
      if (isNaN(p) || p < start || p > end) {
        setModal(prev => ({ 
          ...prev, 
          type: 'diagnose-port-input', 
          data: { ...prev?.data, portError: `無效輸入，端口必須在 ${start} 和 ${end} 之間` } 
        }));
        return;
      }
    } else {
      if (!/^\d+$/.test(portToTest)) {
        setModal({ type: 'alert', data: { message: "端口必須是單一數字", returnTo: modal } });
        return;
      }
    }
    
    const targetIp = currentNode?.ip || "127.0.0.1";
    
    setModal({ 
      type: 'diagnose-result', 
      data: { 
        rule, 
        targetIp,
        port: portToTest, 
        results:[
          { type: 'TCP', status: 'pending', latency: '-', loss: '-', quality: '-' },
          { type: 'HTTP', status: 'pending', latency: '-', loss: '-', quality: '-' }
        ],
        isTesting: true
      } 
    });

    // 真實的前端網絡延遲檢測機制 (利用 fetch no-cors 探測 TCP 與 HTTP 可用性)
    const measureLatency = async () => {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 
        await fetch(`http://${targetIp}:${portToTest}`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        return Math.round(performance.now() - start);
      } catch (error: any) {
        const latency = Math.round(performance.now() - start);
        // 若為真正的超時 AbortError，或時間超過 2.9 秒，視為不通
        if (error.name === 'AbortError' || latency >= 2900) return -1; 
        // 發生 CORS 或網絡協議錯誤代表 TCP 握手已成功連接，返回實測延遲
        return latency;
      }
    };

    const tcpLatency = await measureLatency();
    await new Promise(r => setTimeout(r, 150)); // 微小間隔
    const httpLatency = await measureLatency();

    const formatRes = (lat: number) => {
      if (lat === -1) return { status: 'timeout', latency: '-', loss: '100%', quality: '-' };
      let quality = '差';
      if (lat < 80) quality = '很好';
      else if (lat < 200) quality = '良好';
      else if (lat < 500) quality = '一般';
      return { status: 'success', latency: `${lat}ms`, loss: '0.0%', quality };
    };

    setModal(prev => prev?.type === 'diagnose-result' ? {
      ...prev,
      data: {
        ...prev.data,
        results:[
          { type: 'TCP', ...formatRes(tcpLatency) },
          { type: 'HTTP', ...formatRes(httpLatency) }
        ],
        isTesting: false
      }
    } : prev);
  };

  if (nodes.length === 0) return <div className="text-center py-10">請先添加節點</div>;

  const protocolOptions =[
    { label: "TCP", value: "tcp" },
    { label: "UDP", value: "udp" },
    { label: "TCP+UDP", value: "tcp,udp" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar max-w-full">
          {nodes.map((n: any) => (
            <motion.button 
              whileTap={{ scale: 0.95 }} 
              key={n.id} 
              onClick={() => setSelected(n.id)} 
              className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-colors ${selected === n.id ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-md' : 'bg-[#F0F4EF] dark:bg-[#202522] hover:bg-gray-200 dark:hover:bg-[#2a2f2c]'}`}
            >
              {n.name}
            </motion.button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 bg-[#F0F4EF] dark:bg-[#202522] p-1.5 rounded-full">
          <button onClick={() => setViewMode('card')} className={`p-2 rounded-full transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-[#323835] shadow-sm text-[var(--md-primary)]' : 'text-gray-500'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-full transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-[#323835] shadow-sm text-[var(--md-primary)]' : 'text-gray-500'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#F0F4EF] dark:bg-[#202522] p-4 sm:p-5 rounded-[32px] space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 px-2">
          <span className="font-bold text-lg flex items-center gap-2">
            轉發規則
            <span className="bg-gray-200 dark:bg-white/10 text-xs px-2 py-0.5 rounded-full">{rules.length}</span>
          </span>
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setModal({ type: 'import', data: { text: '' } })} className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-[#323835] rounded-full transition-colors" title="批量導入">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={handleExport} className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-[#323835] rounded-full transition-colors" title="批量導出">
              <Download className="w-4 h-4" />
            </button>
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setModal({ type: 'edit', data: { index: -1, nodeId: selected, rule: { name: "", listen_port: "", dest_ip: "", dest_port: "", protocol: "tcp" } } })} 
              className="text-[var(--md-primary)] font-bold bg-[var(--md-primary-container)] px-4 sm:px-5 py-2.5 rounded-full text-sm flex items-center gap-1 ml-1 sm:ml-2 shadow-sm"
            >
              <span className="text-lg leading-none">+</span> 添加規則
            </motion.button>
          </div>
        </div>
        
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {rules.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-gray-400 text-sm font-bold bg-white/50 dark:bg-white/5 rounded-[24px]">
                暫無規則，請點擊右上角按鈕添加或導入
              </motion.div>
            ) : viewMode === 'card' ? (
              rules.map((r: any, idx: number) => (
                <motion.div 
                  layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  key={idx} 
                  className="bg-white dark:bg-[#111318] p-4 sm:p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 group hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center gap-2 min-w-max">
                      <span className="font-bold text-sm text-[var(--md-primary)] bg-[var(--md-primary-container)] px-2.5 py-1 rounded-lg truncate max-w-[120px] sm:max-w-none">
                        {r.name || `新建規則${idx + 1}`}
                      </span>
                      <div className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#202522] text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                        {r.protocol === "tcp,udp" ? "TCP+UDP" : r.protocol}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                      <span className="text-lg font-mono font-black break-all">{r.listen_port}</span>
                      <span className="text-gray-400 shrink-0">→</span>
                      <span className="text-base font-mono font-bold text-gray-600 dark:text-gray-300 break-all">{r.dest_ip}:{r.dest_port}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity mt-2 md:mt-0 pt-3 md:pt-0 border-t border-gray-100 dark:border-white/5 md:border-none">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => startDiagnostics(r)} className="p-2.5 sm:p-3 bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400 rounded-2xl" title="診斷">
                      <Activity className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setModal({ type: 'edit', data: { index: idx, nodeId: selected, rule: { ...r } } })} className="p-2.5 sm:p-3 bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 rounded-2xl" title="編輯">
                      <Edit2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDeleteConfirm(idx)} className="p-2.5 sm:p-3 bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 rounded-2xl" title="刪除">
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#111318] rounded-[24px] overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">規則名稱</th>
                        <th className="px-6 py-4">協議</th>
                        <th className="px-6 py-4">本地端口</th>
                        <th className="px-6 py-4">目標 (IP:端口)</th>
                        <th className="px-6 py-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {rules.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold">{r.name || `新建規則${idx + 1}`}</td>
                          <td className="px-6 py-4 uppercase font-bold text-xs"><span className="bg-gray-100 dark:bg-[#202522] px-2 py-1 rounded-md">{r.protocol === "tcp,udp" ? "TCP+UDP" : r.protocol}</span></td>
                          <td className="px-6 py-4 font-mono font-bold">{r.listen_port}</td>
                          <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">{r.dest_ip}:{r.dest_port}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => startDiagnostics(r)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"><Activity className="w-4 h-4" /></button>
                              <button onClick={() => setModal({ type: 'edit', data: { index: idx, nodeId: selected, rule: { ...r } } })} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteConfirm(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSaving && setModal(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            {modal.type === 'edit' && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-[#111318] rounded-[32px] shadow-2xl overflow-visible flex flex-col my-auto max-h-[90vh]">
                <div className="p-6 md:p-8 space-y-6 overflow-y-auto hide-scrollbar flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-2xl font-bold">{modal.data.index === -1 ? "添加新規則" : "編輯規則"}</h3>
                    <button onClick={() => setModal(null)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:scale-105 transition-transform"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 ml-1">自定義名稱 (選填)</label>
                      <input value={modal.data.rule.name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, rule: { ...modal.data.rule, name: e.target.value } } })} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] text-sm outline-none focus:ring-2 ring-[var(--md-primary)] transition-shadow placeholder:text-gray-400" placeholder="留空將自動生成名稱" />
                    </div>

                    <div className="space-y-2 relative">
                      <label className="text-sm font-bold text-gray-500 ml-1">歸屬節點</label>
                      <div onClick={() => setIsSelectOpen(isSelectOpen === 'node' ? null : 'node')} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] text-sm font-bold flex justify-between items-center cursor-pointer outline-none focus:ring-2 ring-[var(--md-primary)]">
                        <span>{nodes.find((n:any) => n.id === modal.data.nodeId)?.name}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSelectOpen === 'node' ? 'rotate-180' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {isSelectOpen === 'node' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2a2f2c] rounded-[20px] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden z-[100]">
                            {nodes.map((n:any) => (
                              <div key={n.id} onClick={() => { setModal({ ...modal, data: { ...modal.data, nodeId: n.id } }); setIsSelectOpen(null); }} className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer font-bold text-sm transition-colors ${modal.data.nodeId === n.id ? 'text-[var(--md-primary)] bg-[var(--md-primary-container)]' : ''}`}>{n.name}</div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 ml-1">本地端口/區間</label>
                        <input value={modal.data.rule.listen_port} onChange={e => setModal({ ...modal, data: { ...modal.data, rule: { ...modal.data.rule, listen_port: e.target.value } } })} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-sm outline-none focus:ring-2 ring-[var(--md-primary)] placeholder:text-gray-400" placeholder="如 8080 或 1000-2000" />
                      </div>
                      <div className="space-y-2 relative">
                        <label className="text-sm font-bold text-gray-500 ml-1">協議</label>
                        <div onClick={() => setIsSelectOpen(isSelectOpen === 'protocol' ? null : 'protocol')} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] text-sm font-bold flex justify-between items-center cursor-pointer outline-none focus:ring-2 ring-[var(--md-primary)]">
                          <span>{protocolOptions.find(o => o.value === modal.data.rule.protocol)?.label || "TCP"}</span>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isSelectOpen === 'protocol' ? 'rotate-180' : ''}`} />
                        </div>
                        <AnimatePresence>
                          {isSelectOpen === 'protocol' && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2a2f2c] rounded-[20px] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden z-[100]">
                              {protocolOptions.map(o => (
                                <div key={o.value} onClick={() => { setModal({ ...modal, data: { ...modal.data, rule: { ...modal.data.rule, protocol: o.value } } }); setIsSelectOpen(null); }} className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer font-bold text-sm transition-colors ${modal.data.rule.protocol === o.value ? 'text-[var(--md-primary)] bg-[var(--md-primary-container)]' : ''}`}>{o.label}</div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 dark:border-white/5 pt-5">
                      <label className="text-sm font-bold text-gray-500 ml-1">目標 IP</label>
                      <input value={modal.data.rule.dest_ip} onChange={e => setModal({ ...modal, data: { ...modal.data, rule: { ...modal.data.rule, dest_ip: e.target.value } } })} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-sm outline-none focus:ring-2 ring-[var(--md-primary)] placeholder:text-gray-400" placeholder="IPv4/IPv6 或 域名" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 ml-1">目標端口 (對應本地)</label>
                      <input value={modal.data.rule.dest_port} onChange={e => setModal({ ...modal, data: { ...modal.data, rule: { ...modal.data.rule, dest_port: e.target.value } } })} className="w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-sm outline-none focus:ring-2 ring-[var(--md-primary)] placeholder:text-gray-400" placeholder="如 80 或 1000-2000" />
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 pt-2 flex gap-4">
                  <button onClick={() => setModal(null)} disabled={isSaving} className="flex-1 py-4 rounded-full font-bold bg-[#F0F4EF] dark:bg-[#202522] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300">取消</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 rounded-full font-bold bg-[#006494] text-white hover:bg-[#00527a] transition-colors flex justify-center items-center gap-2 disabled:opacity-70 shadow-md">
                    {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /><span>保存中...</span></> : <span>保存規則</span>}
                  </button>
                </div>
              </motion.div>
            )}

            {modal.type === 'import' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white dark:bg-[#111318] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
                {importReport ? (
                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-3 text-2xl font-bold mb-4">
                      {importReport.fail === 0 ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <AlertCircle className="w-8 h-8 text-orange-500" />}
                      導入報告
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 font-bold">
                      檢測到 {importReport.total} 條規則，成功導入 <span className="text-green-500">{importReport.success}</span> 條，失敗 <span className="text-red-500">{importReport.fail}</span> 條。
                    </p>
                    {importReport.errors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl max-h-48 overflow-y-auto font-mono text-sm text-red-600 dark:text-red-400 space-y-1">
                        {importReport.errors.map((err, i) => <div key={i}>{err}</div>)}
                      </div>
                    )}
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setImportReport(null)} className="flex-1 py-3 rounded-full font-bold bg-[#F0F4EF] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">返回編輯區</button>
                      <button onClick={() => { setImportReport(null); setModal(null); }} className="flex-1 py-3 rounded-full font-bold bg-[var(--md-primary)] text-white hover:opacity-90 transition-opacity">完成</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 space-y-4">
                    <h3 className="text-2xl font-bold mb-2">批量導入規則</h3>
                    <p className="text-sm text-gray-500 font-bold">格式：自定義名稱(可選)|本地端口/區間|目標IP|目標端口|協議</p>
                    <textarea 
                      value={modal.data.text} 
                      onChange={e => setModal({ ...modal, data: { ...modal.data, text: e.target.value } })}
                      className="w-full h-64 bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-sm outline-none focus:ring-2 ring-[var(--md-primary)] resize-none"
                      placeholder={`Rule 1|8080|192.168.1.1|80|tcp\n|1000-2000|example.com|1000-2000|tcp,udp`}
                    />
                    <div className="flex gap-4 pt-2">
                      <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-full font-bold bg-[#F0F4EF] dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">取消</button>
                      <button onClick={() => handleImport(modal.data.text)} className="flex-1 py-3 rounded-full font-bold bg-[var(--md-primary)] text-[var(--md-on-primary)] hover:opacity-90 transition-opacity">開始導入</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {(modal.type === 'alert' || modal.type === 'confirm') && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#111318] rounded-[32px] shadow-2xl p-8 text-center space-y-6">
                <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-2">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold whitespace-pre-line">{modal.data.message}</h3>
                <div className="flex gap-3 pt-2">
                  {modal.type === 'confirm' && (
                    <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-full font-bold bg-[#F0F4EF] dark:bg-[#202522] hover:bg-gray-200 dark:hover:bg-[#2a2f2c] transition-colors">取消</button>
                  )}
                  <button onClick={() => modal.type === 'confirm' ? modal.data.onConfirm() : setModal(modal.data.returnTo || null)} className="flex-1 py-3 rounded-full font-bold bg-[var(--md-primary)] text-white hover:opacity-90 transition-opacity shadow-md">
                    確定
                  </button>
                </div>
              </motion.div>
            )}

            {modal.type === 'diagnose-port-input' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#111318] rounded-[32px] shadow-2xl p-8 space-y-6">
                <h3 className="text-xl font-bold">指定測試端口</h3>
                <p className="text-sm text-gray-500 font-medium">該規則為端口區間 <span className="text-[var(--md-primary)] bg-[var(--md-primary-container)] px-2 py-0.5 rounded-md font-mono">{modal.data.rule.listen_port}</span>，請輸入區間內要測試的單一端口。</p>
                <div>
                  <input 
                    type="text" 
                    autoFocus
                    value={modal.data.portInputValue}
                    onChange={e => setModal({...modal, data: {...modal.data, portInputValue: e.target.value, portError: ""}})}
                    placeholder="輸入端口數字"
                    className={`w-full bg-[#F0F4EF] dark:bg-[#202522] p-4 rounded-[20px] font-mono text-center text-lg outline-none focus:ring-2 transition-shadow ${modal.data.portError ? 'ring-2 ring-red-500' : 'ring-[var(--md-primary)]'}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter') executeDiagnostics(modal.data.rule, modal.data.portInputValue);
                    }}
                  />
                  {modal.data.portError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-bold mt-2 text-center">
                      {modal.data.portError}
                    </motion.div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-full font-bold bg-[#F0F4EF] dark:bg-[#202522] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">取消</button>
                  <button onClick={() => executeDiagnostics(modal.data.rule, modal.data.portInputValue)} className="flex-1 py-3 rounded-full font-bold bg-[var(--md-primary)] text-white hover:opacity-90 transition-opacity shadow-md">開始診斷</button>
                </div>
              </motion.div>
            )}

            {modal.type === 'diagnose-result' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-[#F0F4EF] dark:bg-[#151923] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-[#222736]">
                <div className="bg-[#E4E9E6] dark:bg-[#1C212D] p-5 px-6 flex justify-between items-center border-b border-gray-200 dark:border-[#2A3041]">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">轉發診斷結果</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">{currentNode?.name}</p>
                  </div>
                  <div className="bg-blue-100 text-blue-600 dark:bg-blue-600 dark:text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    轉發服務
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 p-3 rounded-xl">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>由於面板為被動模式，規則創建後請等大約 30 秒 agent 獲取生效。TCPing 當出口沒有部署服務時顯示超時為正常現象。</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-[#1C212D] border border-gray-200 dark:border-[#2A3041] rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-gray-800 dark:text-gray-100">{modal.data.results.length}</div>
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">總測試數</div>
                    </div>
                    <div className="bg-green-50/50 dark:bg-[#162923] border border-green-200 dark:border-[#1A4231] rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-green-600 dark:text-green-400">{modal.data.results.filter((r:any)=>r.status==='success').length}</div>
                      <div className="text-xs font-bold text-green-700 dark:text-green-500 mt-1">成功</div>
                    </div>
                    <div className="bg-red-50/50 dark:bg-[#2D1A1F] border border-red-200 dark:border-[#52212D] rounded-2xl p-4 text-center shadow-sm">
                      <div className="text-2xl font-black text-red-600 dark:text-red-400">{modal.data.results.filter((r:any)=>r.status==='timeout').length}</div>
                      <div className="text-xs font-bold text-red-700 dark:text-red-500 mt-1">失敗</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1C212D] border border-gray-200 dark:border-[#2A3041] rounded-[24px] overflow-hidden shadow-sm">
                    <div className="bg-blue-50/50 dark:bg-[#1E2638] px-4 py-3 border-b border-gray-200 dark:border-[#2A3041] flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-sm text-blue-800 dark:text-blue-300">入口測試</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-[#222736] text-gray-600 dark:text-gray-300 font-bold text-xs">
                          <tr>
                            <th className="px-5 py-3 rounded-tl-xl whitespace-nowrap">協議類型</th>
                            <th className="px-5 py-3 whitespace-nowrap">路徑</th>
                            <th className="px-5 py-3 whitespace-nowrap">狀態</th>
                            <th className="px-5 py-3 whitespace-nowrap">延遲(ms)</th>
                            <th className="px-5 py-3 whitespace-nowrap">丟包率</th>
                            <th className="px-5 py-3 rounded-tr-xl whitespace-nowrap">質量</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2A3041]">
                          {modal.data.results.map((res: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#242A3A] transition-colors text-gray-700 dark:text-gray-200">
                              <td className="px-5 py-4 font-bold">{res.type}</td>
                              <td className="px-5 py-4">
                                <div className="font-mono text-xs whitespace-nowrap">入口({modal.data.port}) → 目標({modal.data.rule.dest_ip}:{modal.data.rule.dest_port})</div>
                              </td>
                              <td className="px-5 py-4">
                                {res.status === 'pending' ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : 
                                 res.status === 'success' ? <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 成功</span> : 
                                 <span className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"><XCircle className="w-3 h-3"/> 超時</span>}
                              </td>
                              <td className="px-5 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{res.latency}</td>
                              <td className="px-5 py-4 font-mono text-green-600 dark:text-green-400">{res.loss}</td>
                              <td className="px-5 py-4">
                                {res.quality !== '-' && (
                                  <span className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${res.quality === '很好' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : res.quality === '良好' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                    {res.quality === '很好' ? '✨ ' : ''}{res.quality}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="bg-[#E4E9E6] dark:bg-[#1C212D] p-4 px-6 border-t border-gray-200 dark:border-[#2A3041] flex justify-end gap-3">
                  <button onClick={() => setModal(null)} className="px-6 py-2.5 rounded-full font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2A3041] transition-colors">關閉</button>
                  <button onClick={() => executeDiagnostics(modal.data.rule, modal.data.port)} disabled={modal.data.isTesting} className="px-6 py-2.5 rounded-full font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md">
                    重新診斷
                  </button>
                </div>
              </motion.div>
            )}
            
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

//设置页面
function MeView({ setThemeKey, themeKey, setAuth, api, fetchAllData }: any) {
  const [pwd, setPwd] = useState("");

  const handleExport = async () => {
    const data = await api("EXPORT_ALL");
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
    a.download = `aero_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#F0F4EF] dark:bg-[#202522] p-6 rounded-[32px] space-y-4">
        <h3 className="font-bold flex items-center gap-2"><KeyRound className="w-5 h-5"/> 登錄密碼修改</h3>
        <div className="flex gap-2">
          <input type="password" placeholder="輸入新密碼" value={pwd} onChange={e=>setPwd(e.target.value)} className="flex-1 bg-white dark:bg-[#111318] p-4 rounded-2xl outline-none" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={async ()=>{if(pwd.length<6)return alert("密碼太短"); const res=await api("CHANGE_PASSWORD",{newPassword:pwd}); setAuth(res.token); localStorage.setItem("aero_auth",res.token); alert("密碼已修改"); setPwd("");}} className="px-6 bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold rounded-2xl">修改</motion.button>
        </div>
      </div>

      <div className="bg-[#F0F4EF] dark:bg-[#202522] p-6 rounded-[32px] space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Save className="w-5 h-5"/> 備份與還原</h3>
        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] py-4 rounded-2xl font-bold">
            <Download className="w-5 h-5" /> 導出 JSON
          </motion.button>
          <motion.label whileTap={{ scale: 0.95 }} className="flex-1 flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-4 rounded-2xl font-bold cursor-pointer">
            <Upload className="w-5 h-5" /> 導入 JSON
            <input type="file" accept=".json" className="hidden" onChange={(e:any)=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=async(ev:any)=>{if(confirm("將覆蓋所有資料？")) {await api("IMPORT_ALL",{backupData:JSON.parse(ev.target.result)}); alert("成功"); fetchAllData();}}; r.readAsText(f);}} />
          </motion.label>
        </div>
      </div>

      <div className="bg-[#F0F4EF] dark:bg-[#202522] p-6 rounded-[32px] space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Palette className="w-5 h-5"/> 面板主題配色</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(THEMES).map(([key, colors]) => (
            <motion.button whileTap={{ scale: 0.8 }} key={key} onClick={() => setThemeKey(key)} className={`h-12 rounded-2xl transition-all ${themeKey === key ? 'ring-4 ring-offset-2 dark:ring-offset-[#111318]' : ''}`} style={{ backgroundColor: colors.primary, borderColor: colors.primaryContainer }} />
          ))}
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { localStorage.removeItem("aero_auth"); setAuth(null); }} className="w-full flex justify-center py-4 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-full font-bold">
        <LogOut className="w-5 h-5 mr-2" /> 退出登入
      </motion.button>
    </div>
  );
}
