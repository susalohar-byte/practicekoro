import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: 'Rohit Das',
      role: 'WBP Aspirant',
      avatar: '/images/avatar_arindam.jpg',
      rating: 5,
      comment:
        'Topic-wise test আর detailed solution খুব helpful. এবার প্রস্তুতি অনেক বেশি organised হয়েছে।',
    },
    {
      id: 2,
      name: 'Puja Karmakar',
      role: 'WBSSC Aspirant',
      avatar: '/images/avatar_sneha.jpg',
      rating: 5,
      comment:
        'Mock test নিয়ে নিজের প্রস্তুতি অনেকটাই বোঝা সহজ হয়েছে। UI টা খুব সুন্দর এবং সহজ।',
    },
    {
      id: 3,
      name: 'Amit Saha',
      role: 'Clerkship Aspirant',
      avatar: '/images/avatar_sayon.jpg',
      rating: 5,
      comment:
        'Previous year questions এবং explanation পেয়ে খুব ভালো লাগে। Practice Koro সত্যিই দারুণ একটা platform!',
    },
    {
      id: 4,
      name: 'Tania Mondal',
      role: 'Primary TET Aspirant',
      avatar: '/images/avatar_tania.jpg',
      rating: 5,
      comment:
        'পরীক্ষার মতো হুবহু টাইমার আর সিলেবাস অনুযায়ী সাজানো টেস্টগুলো আত্মবিশ্বাস অনেক বাড়িয়ে দিয়েছে।',
    },
    {
      id: 5,
      name: 'Abhishek Roy',
      role: 'Railway NTPC Aspirant',
      avatar: '/images/avatar_abhishek.jpg',
      rating: 5,
      comment:
        'বাংলায় বিজ্ঞান ও গণিতের এত চমৎকার ব্যাখ্যা আগে কোথাও পাইনি। প্রতিটি প্রশ্নের নোটস অসাধারণ!',
    },
    {
      id: 6,
      name: 'Mousumi Paul',
      role: 'Kolkata Police Aspirant',
      avatar: '/images/avatar_mousumi.jpg',
      rating: 5,
      comment:
        'মোবাইল অ্যাপে নিয়মিত লাইভ টেস্ট আর জেলাভিত্তিক র‍্যাঙ্কিং দেখে নিজের উন্নতি স্পষ্ট বুঝতে পারি।',
    },
  ];

  // We show 3 cards per view on large screens, 1 or 2 on smaller
  const itemsPerPage = 3;
  const maxPages = Math.ceil(testimonials.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : maxPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < maxPages - 1 ? prev + 1 : 0));
  };

  const visibleTestimonials = testimonials.slice(
    currentPage * itemsPerPage,
    currentPage * itemsPerPage + itemsPerPage
  );

  return (
    <section id="reviews" className="py-14 sm:py-20 bg-[#F8FAFD]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header matching reference */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl">❤️</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-headline tracking-tight">
              What Our Students Say
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium font-headline">
            Practice Koro ব্যবহার করে হাজারো ছাত্রছাত্রী তাদের প্রস্তুতিতে আরও আত্মবিশ্বাসী হয়েছে।
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous testimonials"
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next testimonials"
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {visibleTestimonials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative group"
              >
                {/* Top User Info & Quote Icon */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 overflow-hidden ring-2 ring-blue-500/20 flex-shrink-0">
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-headline leading-tight">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.role}
                        </span>
                      </div>
                    </div>

                    {/* Blue quote mark */}
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Quote className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed font-headline">
                    "{item.comment}"
                  </p>
                </div>

                {/* Verified Aspirant tag */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold text-emerald-600">✓ Verified Aspirant</span>
                  <span>Practice Koro Student</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {[...Array(maxPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                aria-label={`Go to page ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentPage === idx
                    ? 'w-6 h-2 bg-blue-600'
                    : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
