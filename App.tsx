
import React, { useState, useCallback, useMemo } from 'react';
import InputForm from './components/InputForm';
import BaZiChartDisplay from './components/BaZiChartDisplay';
import AnalysisResult from './components/AnalysisResult';
import CaseLibrary from './components/CaseLibrary';
import AuthorInfo from './components/AuthorInfo';
import HuangLi from './components/HuangLi';
import { calculateBaZi } from './utils/baziHelper';
import { BaZiChart, CalendarType, CaseRecord } from './types';
import { ArrowLeft, LayoutGrid, Library, User, CalendarDays } from 'lucide-react';
import { useToast } from './components/Toast';

type TabType = 'INPUT' | 'LIBRARY' | 'HUANGLI' | 'ABOUT';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('LIBRARY');
  const [chartData, setChartData] = useState<BaZiChart | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { showToast } = useToast();

  const [libraryFilters, setLibraryFilters] = useState({
    gender: 'ALL',
    pillars: { year: '', month: '', day: '', hour: '' }
  });

  const handleCalculate = useCallback((data: any) => {
     try {
        const chart = calculateBaZi(
            data.year,
            data.month,
            data.day,
            data.hour,
            data.minute,
            data.gender,
            data.type,
            data.directData,
            data.useTrueSolarTime,
            data.longitude
        );

        if (data.feedback) {
          chart.caseFeedback = data.feedback;
          chart.caseSource = data.source;
        }

        setChartData(chart);
        setShowResult(true);
        window.scrollTo({ top: 0, behavior: 'instant' });
     } catch (e) {
         console.error(e);
         showToast("排盘计算出错，请检查数据。");
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
             <div className="text-stone-300 font-calligraphy text-lg opacity-40">命海拾遗</div>
           </div>
           <BaZiChartDisplay chart={chartData} />
           <AnalysisResult 
               caseFeedback={chartData.caseFeedback}
               caseSource={chartData.caseSource}
           />
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
      case 'ABOUT': return <div className="pb-20 animate-fade-in" key="about"><AuthorInfo /></div>;
      default: return null;
    }
  }, [showResult, chartData, activeTab, handleCalculate, handleSelectCase, handleBack, libraryFilters]);

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#2b2320] selection:bg-rose-900/10 selection:text-rose-900 overflow-x-hidden">
      {!showResult && (
        <header className={`px-4 relative transition-all ${activeTab === 'INPUT' ? 'pt-4 pb-1' : 'pt-5 pb-3'}`}>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-stone-200/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-calligraphy tracking-wider animate-fade-in">
              {activeTab === 'INPUT' ? '命海拾遗' : activeTab === 'LIBRARY' ? '命海拾遗命例库' : activeTab === 'HUANGLI' ? '万年黄历' : '作者信息'}
            </h1>
            {activeTab === 'INPUT' && (
              <p className="text-stone-400 text-[10px] italic font-serif opacity-50">
                探索八字玄机 · 洞悉人生运势
              </p>
            )}
          </div>
        </header>
      )}

      <main className={`px-4 max-w-4xl mx-auto w-full relative z-10 ${showResult ? 'pt-1' : 'pt-1'}`}>
        {currentView}
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
            active={!showResult && activeTab === 'LIBRARY'}
            onClick={() => { setActiveTab('LIBRARY'); setShowResult(false); }}
            icon={<Library size={24} strokeWidth={1.5} />}
            label="命例库"
          />
          <NavButton
            active={!showResult && activeTab === 'HUANGLI'}
            onClick={() => { setActiveTab('HUANGLI'); setShowResult(false); }}
            icon={<CalendarDays size={24} strokeWidth={1.5} />}
            label="黄历"
          />
          <NavButton
            active={!showResult && activeTab === 'ABOUT'}
            onClick={() => { setActiveTab('ABOUT'); setShowResult(false); }}
            icon={<User size={24} strokeWidth={1.5} />}
            label="作者"
          />
        </div>
      </nav>
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
    className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all duration-200 ${active ? 'text-[#2b2320]' : 'text-stone-350'}`}
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
