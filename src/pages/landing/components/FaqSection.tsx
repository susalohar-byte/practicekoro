import React from 'react';
import { CircleHelp } from 'lucide-react';
import { FaqSearchAccordion, type FAQItem } from '@/components/ui/faq-search-accordion';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export const FaqSection: React.FC = () => {
  const faqs: FaqItem[] = [
    {
      category: 'Exams',
      question: 'Practice Koro-তে কোন কোন সরকারি চাকরির পরীক্ষার প্রস্তুতি নেওয়া যায়?',
      answer:
        'Practice Koro-তে মূলত পশ্চিমবঙ্গের সমস্ত প্রধান সরকারি চাকরির পরীক্ষার প্রস্তুতি নেওয়া যায় — যেমন পশ্চিমবঙ্গ পুলিশ (WBP Constable & Lady Constable, WBP SI), WBPSC ক্লার্কশিপ, মিসলেনিয়াস ও WBCS, WBSSC গ্রুপ C & D, প্রাইমারি TET, এবং রেলওয়ে (RRB NTPC, Group D) ও SSC GD/MTS পরীক্ষা। প্রতিটি পরীক্ষার জন্য রয়েছে অধ্যায়ভিত্তিক প্রশ্নব্যাংক, সাবজেক্ট টেস্ট এবং ফুল-লেংথ টেস্ট সিরিজ।',
    },
    {
      category: 'Tests',
      question: 'মক টেস্টগুলো কি আসল পরীক্ষার সিলেবাস ও নেগেটিভ মার্কিং মেনে তৈরি?',
      answer:
        'হ্যাঁ, এক্কেবারে ১০০% নির্ভুলভাবে সংশ্লিষ্ট রিক্রুটমেন্ট বোর্ডের (যেমন PRB, WBPSC, WBSSC, RRB) অফিশিয়াল প্রশ্নপ্যাটার্ন, সময়সীমা এবং নেগেটিভ মার্কিং (যেমন WBP-তে ১/৪ বা ০.২৫, রেলে ১/৩) নিয়ম মেনে টেস্টগুলো তৈরি করা হয়েছে। এতে পরীক্ষার্থীরা আসল পরীক্ষার নিখুঁত অভিজ্ঞতা ও সময়ের সঠিক ব্যবস্থাপনা শিখতে পারেন।',
    },
    {
      category: 'Solutions',
      question: 'প্রতিটি প্রশ্নের পর কি বিস্তারিত ব্যাখ্যা ও নোটস পাওয়া যায়?',
      answer:
        'অবশ্যই। টেস্ট শেষ করার সাথে সাথেই প্রতিটি প্রশ্নের জন্য বাংলায় ও ইংরেজিতে বিস্তারিত কনসেপচুয়াল সমাধান, প্রয়োজনীয় শর্টকাট ট্রিক্স এবং অতিরিক্ত তথ্য সংবলিত রিভিশন শর্টনোটস পেয়ে যাবেন। এছাড়া আপনার ভুল উত্তর ও দুর্বল অধ্যায়গুলো চিহ্নিত করে তাৎক্ষণিক পারফরম্যান্স অ্যানালিটিক্স রিপোর্ট প্রদান করা হয়।',
    },
    {
      category: 'App & Web',
      question: 'অ্যান্ড্রয়েড অ্যাপ ও স্টুডেন্ট ওয়েব প্যানেল কীভাবে কাজ করে?',
      answer:
        'শিক্ষার্থীরা আমাদের অ্যান্ড্রয়েড অ্যাপ (Practice Koro APK) সরাসরি ডাউনলোড করে স্মার্টফোনে সম্পূর্ণ টেস্ট সিরিজ দিতে পারবেন। পাশাপাশি যেকোনো কম্পিউটার, ল্যাপটপ বা ট্যাবলেটের ব্রাউজার থেকে স্টুডেন্ট ওয়েব প্যানেলে লগইন করে নির্বিঘ্নে ফুল-স্ক্রিন মক টেস্ট ও প্র্যাকটিস চালিয়ে যেতে পারবেন।',
    },
    {
      category: 'Free Tests',
      question: 'প্ল্যাটফর্মে কি ফ্রি ডেমো টেস্ট দেওয়ার সুযোগ রয়েছে?',
      answer:
        'হ্যাঁ! সাইন-আপ করলেই প্রতিটি প্রধান পরীক্ষার জন্য ফ্রি ডেমো মক টেস্ট, বিগত ৫+ বছরের প্রশ্নপত্র (PYQ with detailed solutions) এবং প্রতিদিনের বিষয়ভিত্তিক কারেন্ট অ্যাফেয়ার্স কুইজ শিক্ষার্থীদের জন্য বিনামূল্যে উন্মুক্ত রয়েছে। প্রিমিয়াম মেম্বারশিপে পাওয়া যায় আনলিমিটেড টেস্ট এবং অল-বেঙ্গল জেলাভিত্তিক র‍্যাঙ্কিং।',
    },
  ];

  const items: FAQItem[] = faqs.map((faq, idx) => ({
    id: idx + 1,
    question: faq.question,
    answer: faq.answer,
  }));

  return (
    <section id="faq" className="scroll-mt-20 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon={CircleHelp}
          tone="emerald"
          title="Frequently Asked Questions"
          subtitle="Practice Koro প্ল্যাটফর্ম সম্পর্কে শিক্ষার্থীদের সাধারণ কিছু প্রশ্ন ও উত্তর।"
          className="mb-6 sm:mb-8"
        />

        <Reveal>
          <FaqSearchAccordion
            data={items}
            defaultOpenId={1}
            searchPlaceholder="Search FAQs..."
            emptyText="কোনো প্রশ্ন পাওয়া যায়নি।"
            className="max-w-4xl mx-auto font-['Poppins','Anek_Bangla',sans-serif]"
          />
        </Reveal>
      </div>
    </section>
  );
};
