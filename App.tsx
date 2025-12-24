
import React, { useState, useCallback, useMemo } from 'react';
import InputForm from './components/InputForm';
import BaZiChartDisplay from './components/BaZiChartDisplay';
import AnalysisResult from './components/AnalysisResult';
import CaseLibrary from './components/CaseLibrary';
import AuthorInfo from './components/AuthorInfo';
import { calculateBaZi } from './utils/baziHelper';
import { BaZiChart, CalendarType, CaseRecord } from './types';
import { ArrowLeft, LayoutGrid, Library, User } from 'lucide-react';

type TabType = 'INPUT' | 'LIBRARY' | 'ABOUT';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('INPUT');
  const [chartData, setChartData] = useState<BaZiChart | null>(null);
  const [showResult, setShowResult] = useState(false);

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
         alert("排盘计算出错，请检查数据。");
     }
  }, []);

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
        <div className="animate-fade-in pb-24">
           <div className="w-full flex items-center justify-between py-2 mb-2 border-b border-stone-200/50">
             <button 
               onClick={handleBack}
               className="px-3 py-1.5 text-stone-600 hover:text-[#2b2320] hover:bg-white rounded-xl transition-all flex items-center gap-1.5 border border-stone-200/50 shadow-sm bg-white"
             >
               <ArrowLeft size={14} />
               <span className="text-xs font-bold">重新输入</span>
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
      case 'INPUT': return <div className="pb-24"><InputForm onCalculate={handleCalculate} /></div>;
      case 'LIBRARY': return <div className="pb-24"><CaseLibrary onSelectCase={handleSelectCase} /></div>;
      case 'ABOUT': return <div className="pb-24"><AuthorInfo /></div>;
      default: return null;
    }
  }, [showResult, chartData, activeTab, handleCalculate, handleSelectCase, handleBack]);

  return (
    <div className="min-h-screen bg-[#fbf9f4] text-[#2b2320] selection:bg-rose-900/10 selection:text-rose-900 overflow-x-hidden">
      {/* 极简页头：压缩 Logo 区域 */}
      {!showResult && (
        <header className={`px-4 relative transition-all ${activeTab === 'INPUT' ? 'pt-4 pb-1' : 'pt-5 pb-3'}`}>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-stone-200/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className={`${activeTab === 'INPUT' ? 'text-2xl' : 'text-2xl'} md:text-3xl font-calligraphy tracking-wider animate-fade-in`}>
              {activeTab === 'INPUT' ? '命海拾遗' : activeTab === 'LIBRARY' ? '命海拾遗命例库' : '作者信息'}
            </h1>
            {activeTab === 'INPUT' && (
              <p className="text-stone-400 text-[10px] italic font-serif opacity-50">
                探索八字玄机 · 洞悉人生运势
              </p>
            )}
          </div>
        </header>
      )}

      {/* 内容区域 */}
      <main className={`px-4 max-w-4xl mx-auto w-full relative z-10 ${showResult ? 'pt-1' : 'pt-1'}`}>
        {currentView}
      </main>
      
      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-xl border border-stone-200/50 rounded-[2rem] shadow-2xl pointer-events-auto flex items-center justify-around p-2">
          <NavButton 
            active={!showResult && activeTab === 'INPUT'} 
            onClick={() => { setActiveTab('INPUT'); setShowResult(false); }}
            icon={<LayoutGrid size={22} />}
            label="排盘"
          />
          <NavButton 
            active={!showResult && activeTab === 'LIBRARY'} 
            onClick={() => { setActiveTab('LIBRARY'); setShowResult(false); }}
            icon={<Library size={22} />}
            label="命例库"
          />
          <NavButton 
            active={!showResult && activeTab === 'ABOUT'} 
            onClick={() => { setActiveTab('ABOUT'); setShowResult(false); }}
            icon={<User size={22} />}
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
    className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-300 relative ${active ? 'text-[#2b2320]' : 'text-stone-300 hover:text-stone-400'}`}
  >
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold tracking-widest transition-all ${active ? 'opacity-100' : 'opacity-60'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 w-1 h-1 bg-[#2b2320] rounded-full animate-fade-in"></div>
    )}
  </button>
);

export default App;
