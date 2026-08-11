
import React, { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import BaZiChartDisplay from './components/BaZiChartDisplay';
import AnalysisResult from './components/AnalysisResult';
import CaseLibrary from './components/CaseLibrary';
import ArticleList from './components/ArticleList';
import ProfilePage from './user/components/ProfilePage';
import SaveCaseBar from './user/components/SaveCaseBar';

// 按需加载：InputForm 与 HuangLi 静态引用了 lunar-typescript（约 700KB），
// 拆成独立 chunk，避免打进首屏主包
const InputForm = lazy(() => import('./components/InputForm'));
const HuangLi = lazy(() => import('./components/HuangLi'));
import { calculateBaZiAsync } from './utils/baziAsync';
import { BaZiChart, CalendarType, CaseRecord } from './types';
import { useConfig } from './admin/contexts/ConfigContext';
import { ArrowLeft, LayoutGrid, Library, User, CalendarDays, BookOpen } from 'lucide-react';
import { useToast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { useUserAuth } from './user/contexts/UserAuthContext';
import AuthModal from './user/components/AuthModal';

type TabType = 'INPUT' | 'LIBRARY' | 'HUANGLI' | 'PROFILE' | 'ARTICLES';

const App: React.FC = () => {
  const config = useConfig();
  const { user, isAuthenticated } = useUserAuth();
  const [activeTab, setActiveTab] = useState<TabType>('LIBRARY');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [chartData, setChartData] = useState<BaZiChart | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);
  const { showToast } = useToast();

  const [libraryFilters, setLibraryFilters] = useState({
    gender: 'ALL',
    source: 'ALL',
    label: '',
    pillars: { year: '', month: '', day: '', hour: '' }
  });

  const handleCalculate = useCallback(async (data: any) => {
     try {
        const chart = await calculateBaZiAsync(data);

        if (data.name) chart.name = data.name;

        if (data.feedback) {
          chart.caseFeedback = data.feedback;
          chart.caseSource = data.source;
        }

        setChartData(chart);
        setLastInput(data);
        setShowResult(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
        return true;
     } catch (e) {
         console.error(e);
         showToast("排盘计算出错，请检查数据。");
         return false;
     }
  }, [showToast]);

  const handleSelectCase = useCallback((c: CaseRecord) => {
    handleCalculate({
      gender: c.gender,
      type: CalendarType.DIRECT,
      directData: {
        yearGan: c.yearGZ[0], yearZhi: c.yearGZ[1],
        monthGan: c.monthGZ[0], monthZhi: c.monthGZ[1],
        dayGan: c.dayGZ[0], dayZhi: c.dayGZ[1],
        hourGan: c.hourGZ[0], hourZhi: c.hourGZ[1]
      },
      feedback: c.feedback,
      source: c.source
    });
  }, [handleCalculate]);

  const handleBack = useCallback(() => {
    setShowResult(false);
  }, []);

  const currentView = useMemo(() => {
    if (showResult && chartData) {
      return (
        <div className="animate-fade-in pb-20">
           <div className="w-full flex items-center justify-between py-2 mb-2 border-b border-stone-200/50">
             <button 
               onClick={handleBack}
               className="px-3 py-1.5 text-stone-600 hover:text-[#2b2320] hover:bg-white rounded-xl transition-all flex items-center gap-1.5 border border-stone-200/50 shadow-sm bg-white"
             >
               <ArrowLeft size={14} />
               <span className="text-xs font-bold">返回列表</span>
             </button>
             <div className="text-stone-300 font-calligraphy text-lg opacity-40">{config.site_name}</div>
           </div>
           <BaZiChartDisplay chart={chartData} />
           <AnalysisResult 
               caseFeedback={chartData.caseFeedback}
               caseSource={chartData.caseSource}
           />
           {lastInput && (
             <div className="mt-3">
               <SaveCaseBar chart={chartData} inputSnapshot={lastInput} />
             </div>
           )}
        </div>
      );
    }

    switch (activeTab) {
      case 'INPUT': return <div className="pb-20 animate-fade-in" key="input"><InputForm onCalculate={handleCalculate} /></div>;
      case 'LIBRARY':
        return (
          <div className="pb-20 animate-fade-in" key="library">
            <CaseLibrary
              onSelectCase={handleSelectCase}
              filters={libraryFilters}
              onFiltersChange={setLibraryFilters}
            />
          </div>
        );
      case 'HUANGLI': return <div className="pb-20 animate-fade-in" key="huangli"><HuangLi /></div>;
      case 'PROFILE': return <div className="pb-20 animate-fade-in" key="profile"><ProfilePage onCalculate={handleCalculate} /></div>;
      case 'ARTICLES': return <div className="pb-20 animate-fade-in" key="articles"><ArticleList /></div>;
      default: return null;
    }
  }, [showResult, chartData, activeTab, handleCalculate, handleSelectCase, handleBack, libraryFilters, lastInput, config.site_name]);

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#2b2320] selection:bg-rose-900/10 selection:text-rose-900 overflow-x-hidden">
      {!showResult && (
        <header className={`px-4 relative transition-all ${activeTab === 'INPUT' ? 'pt-4 pb-1' : 'pt-5 pb-3'}`}>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-stone-200/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="absolute top-2.5 right-3 md:right-6 z-20">
            {isAuthenticated ? (
              <button
                onClick={() => { setActiveTab('PROFILE'); setShowResult(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur border border-stone-200 text-xs font-bold text-[#2b2320] shadow-sm hover:border-[#b39b7d] transition-all max-w-[140px]"
                title="进入我的"
              >
                <User size={13} strokeWidth={2.2} className="text-[#b39b7d] shrink-0" />
                <span className="truncate">{user?.nickname || user?.username}</span>
              </button>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setAuthOpen(true); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur border border-stone-200 text-xs font-bold text-[#2b2320] shadow-sm hover:border-[#b39b7d] hover:text-[#b39b7d] transition-all active:scale-95"
              >
                <User size={13} strokeWidth={2.2} className="text-[#b39b7d]" />
                登录
              </button>
            )}
          </div>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-calligraphy tracking-wider animate-fade-in">
              {activeTab === 'INPUT' ? config.site_name : activeTab === 'LIBRARY' ? config.site_name + '命例库' : activeTab === 'HUANGLI' ? '万年黄历' : activeTab === 'ARTICLES' ? '精选文章' : config.site_name}
            </h1>
            {activeTab === 'INPUT' && (
              <p className="text-stone-400 text-[10px] italic font-serif opacity-50">
                {config.site_subtitle}
              </p>
            )}
          </div>
        </header>
      )}

      <main className={`px-4 max-w-4xl mx-auto w-full relative z-10 ${showResult ? 'pt-1' : 'pt-1'}`}>
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-32 gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full border-4 border-stone-200 border-t-[#2b2320] animate-spin"></div>
              <span className="text-xs font-bold text-stone-400 tracking-widest">加载中...</span>
            </div>
          }>
            {currentView}
          </Suspense>
        </ErrorBoundary>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/75 backdrop-blur-md border-t border-stone-200/60 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-around py-1.5">
          <NavButton
            active={!showResult && activeTab === 'INPUT'}
            onClick={() => { setActiveTab('INPUT'); setShowResult(false); }}
            icon={<LayoutGrid size={24} strokeWidth={1.5} />}
            label="排盘"
          />
          <NavButton
            active={!showResult && activeTab === 'HUANGLI'}
            onClick={() => { setActiveTab('HUANGLI'); setShowResult(false); }}
            icon={<CalendarDays size={24} strokeWidth={1.5} />}
            label="黄历"
          />
          <NavButton
            active={!showResult && activeTab === 'LIBRARY'}
            onClick={() => { setActiveTab('LIBRARY'); setShowResult(false); }}
            icon={<Library size={24} strokeWidth={1.5} />}
            label="命例库"
          />
          <NavButton
            active={!showResult && activeTab === 'ARTICLES'}
            onClick={() => { setActiveTab('ARTICLES'); setShowResult(false); }}
            icon={<BookOpen size={24} strokeWidth={1.5} />}
            label="文章"
          />
          <NavButton
            active={!showResult && activeTab === 'PROFILE'}
            onClick={() => { setActiveTab('PROFILE'); setShowResult(false); }}
            icon={<User size={24} strokeWidth={1.5} />}
            label="我的"
          />
        </div>
      </nav>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all duration-200 ${active ? 'text-[#2b2320]' : 'text-stone-400'}`}
  >
    <span className={`relative transition-all duration-200 ${active ? 'scale-105' : ''}`}>
      {active && (
        <span className="absolute inset-0 scale-125 rounded-lg bg-amber-400/15 -z-10" />
      )}
      {icon}
    </span>
    <span className={`text-[10px] font-semibold tracking-wide transition-all ${active ? 'opacity-100' : 'opacity-50'}`}>
      {label}
    </span>
  </button>
);

export default App;
