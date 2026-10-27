import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Minus, ArrowRight, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { api } from '../api/client';
import { ConcessionItem } from '../types';

interface ConcessionsSelectorProps {
  onBack: () => void;
  onProceed: () => void;
}

export const ConcessionsSelector: React.FC<ConcessionsSelectorProps> = ({
  onBack,
  onProceed,
}) => {
  const { concessions, updateConcessionQuantity, concessionsTotal, subtotal, ticketsTotal } = useBooking();
  const [items, setItems] = useState<ConcessionItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadConcessions();
  }, []);

  const loadConcessions = async () => {
    try {
      const res = await api.getConcessions();
      setItems(res.concessions || []);
    } catch (err) {
      console.error('Failed to load concessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Combos', 'Popcorn', 'Snacks', 'Beverages'];

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span>Back to Seats</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg font-black text-white flex items-center justify-end gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-400" />
            Cinema Snacks & Combos
          </h2>
          <p className="text-xs text-slate-400">Personalize your cinema experience with warm concessions</p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Concession Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map(item => {
          const qty = concessions[item.id]?.quantity || 0;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-3xl bg-slate-900/80 border transition-all duration-200 overflow-hidden ${
                qty > 0
                  ? 'border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-extrabold text-amber-300">
                  ${item.price.toFixed(2)}
                </span>
                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 text-slate-300 border border-slate-700/60">
                  {item.category}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Counter Selector */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400">
                    {qty > 0 ? (
                      <span className="text-amber-400 font-bold">
                        ${(item.price * qty).toFixed(2)}
                      </span>
                    ) : (
                      'Add to order'
                    )}
                  </span>

                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => updateConcessionQuantity(item, -1)}
                      disabled={qty === 0}
                      className={`p-1.5 rounded-lg text-slate-300 transition ${
                        qty === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-6 text-center text-xs font-extrabold text-white">
                      {qty}
                    </span>

                    <button
                      onClick={() => updateConcessionQuantity(item, 1)}
                      className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/20 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">
              Tickets (${ticketsTotal.toFixed(2)}) + Concessions (${concessionsTotal.toFixed(2)})
            </p>
            <p className="text-base font-extrabold text-white mt-0.5">
              Subtotal:{' '}
              <span className="text-amber-400">${subtotal.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {concessionsTotal === 0 && (
              <button
                onClick={onProceed}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Skip Snacks
              </button>
            )}

            <button
              onClick={onProceed}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all"
            >
              <span>Proceed to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
