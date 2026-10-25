import React from 'react';
import { 
  FileText, 
  Target, 
  FolderCheck, 
  Lightbulb, 
  TrendingUp 
} from 'lucide-react';

export const WhyPracticeKoroSection: React.FC = () => {
  const features = [
    {
      id: 'topic-practice',
      title: 'Topic-wise Practice',
      description: 'প্রতিটি বিষয়ের জন্য আলাদা Topic Test',
      color: 'blue',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
          <FileText className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 'full-mock',
      title: 'Full Mock Tests',
      description: 'বাস্তব পরীক্ষার অনুকরণে Mock Test',
      color: 'rose',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
          <Target className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 'pyq',
      title: 'Previous Year Questions',
      description: 'পূর্বের বছরের প্রশ্ন নিয়ে অনুশীলন ও প্রস্তুতি',
      color: 'amber',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
          <FolderCheck className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 'detailed-solutions',
      title: 'Detailed Solutions',
      description: 'সহজ ও পরিষ্কার ব্যাখ্যা সহ সমাধান',
      color: 'yellow',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-white transition-all shadow-xs">
          <Lightbulb className="w-6 h-6" />
        </div>
      ),
    },
    {
      id: 'track-progress',
      title: 'Track Your Progress',
      description: 'নিজের অগ্রগতি দেখে পরবর্তী প্রস্তুতি ঠিক করুন',
      color: 'emerald',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
          <TrendingUp className="w-6 h-6" />
        </div>
      ),
    },
  ];

  return (
    <section id="why-pk" className="py-14 sm:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header matching reference */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl">💡</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline tracking-tight">
              Why Practice Koro?
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium font-headline">
            স্মার্ট প্ল্যাটফর্মে প্রস্তুতি হোক আরও গোছানো, সহজ ও কার্যকরী।
          </p>
        </div>

        {/* 5 Cards Row matching reference */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
          {features.map((feat) => (
            <div
              key={feat.id}
              className="group relative bg-[#F8FAFC] hover:bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-100 hover:border-blue-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center text-center"
            >
              {/* Feature Icon */}
              <div className="mb-4">
                {feat.icon}
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-headline">
                {feat.title}
              </h3>

              {/* Bengali Description */}
              <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed font-headline">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
