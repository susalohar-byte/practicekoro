import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      category: 'Exams',
      question: 'Practice Koro-তে কোন কোন সরকারি চাকরির পরীক্ষার প্রস্তুতি নেওয়া যায়?',
      answer:
        'Practice Koro-তে মূলত পশ্চিমবঙ্গের সমস্ত প্রধান সরকারি চাকরির পরীক্ষার প্রস্তুতি নেওয়া যায় — যেমন WBP কনস্টেবল ও এসআই, WBPSC ক্লার্কশিপ, মিসলেনিয়াস ও WBCS, WBSSC গ্রুপ C & D, প্রাইমারি TET, এবং রেলওয়ে (RRB NTPC, Group D) ও SSC GD/MTS পরীক্ষা।',
    },
    {
      category: 'Tests',
      question: 'মক টেস্টগুলো কি আসল পরীক্ষার সিলেবাস ও নেগেটিভ মার্কিং মেনে তৈরি?',
      answer:
        'হ্যাঁ, এক্কেবারে ১০০% নির্ভুলভাবে সংশ্লিষ্ট রিক্রুটমেন্ট বোর্ডের অফিশিয়াল প্রশ্নপ্যাটার্ন, সময়সীমা এবং নেগেটিভ মার্কিং (যেমন WBP-তে ১/৪, রেলে ১/৩) নিয়ম মেনে টেস্টগুলো তৈরি করা হয়েছে। এতে পরীক্ষার্থীরা আসল পরীক্ষার নিখুঁত অভিজ্ঞতা পান।',
    },
    {
      category: 'Solutions',
      question: 'প্রতিটি প্রশ্নের পর কি বিস্তারিত ব্যাখ্যা ও নোটস পাওয়া যায়?',
      answer:
        'অবশ্যই। টেস্ট শেষ করার সাথে সাথেই প্রতিটি প্রশ্নের জন্য বাংলায় বিস্তারিত বিশ্লেষণ, প্রয়োজনীয় শর্টকাট ট্রিক্স এবং অতিরিক্ত তথ্য সংবলিত শর্টনোটস পেয়ে যাবেন, যাতে ভুলগুলো সহজে শুধরে নেওয়া যায়।',
    },
    {
      category: 'App & Web',
      question: 'অ্যান্ড্রয়েড অ্যাপ ও স্টুডেন্ট ওয়েব প্যানেল কীভাবে কাজ করে?',
      answer:
        'বর্তমানে শিক্ষার্থীরা আমাদের অ্যান্ড্রয়েড অ্যাপ (Practice Koro APK) সরাসরি ডাউনলোড করে সম্পূর্ণ টেস্ট সিরিজ দিতে পারবেন। স্টুডেন্টদের জন্য ওয়েব পোর্টাল তৈরির কাজ দ্রুতগতিতে চলছে এবং অতিশীঘ্রই তা উন্মুক্ত করা হবে। অ্যাডমিনগণ ওয়েব কনসোল থেকে সকল কার্যক্রম পরিচালনা করতে পারবেন।',
    },
    {
      category: 'Admin',
      question: 'অ্যাডমিন প্যানেলে কীভাবে প্রবেশ করব?',
      answer:
        'ওয়েবসাইটের উপরের "Admin Sign In" অথবা "Get Started" বোতামে ক্লিক করে অনুমোদিত অ্যাডমিন ক্রেডেনশিয়াল (ইমেইল/পাসওয়ার্ড অথবা Google Auth) দিয়ে সরাসরি অ্যাডমিন কনসোলে লগইন করা যাবে।',
    },
    {
      category: 'Free Tests',
      question: 'প্ল্যাটফর্মে কি ফ্রি ডেমো টেস্ট দেওয়ার সুযোগ রয়েছে?',
      answer:
        'হ্যাঁ! প্রতিটি পরীক্ষার জন্যই একাধিক ফ্রি ডেমো মক টেস্ট, বিগত বছরের প্রশ্নপত্র (PYQ) এবং প্রতিদিনের কারেন্ট অ্যাফেয়ার্স কুইজ শিক্ষার্থীদের জন্য বিনামূল্যে উন্মুক্ত রয়েছে।',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="scroll-mt-20 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon="/images/landing/step_review.png"
          title="Frequently Asked Questions"
          subtitle="Practice Koro প্ল্যাটফর্ম সম্পর্কে শিক্ষার্থীদের সাধারণ কিছু প্রশ্ন ও উত্তর।"
          className="mb-6 sm:mb-8"
        />

        {/* Accordion List */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-blue-300 bg-blue-50/20 shadow-sm'
                    : 'border-[#EDF0F8] bg-white shadow-[0_6px_24px_rgba(30,50,120,0.06)] hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-4.5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#0B1B4F] font-['Hind_Siliguri',sans-serif]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-blue-600 text-white rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed font-headline border-t border-blue-100/60 animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
