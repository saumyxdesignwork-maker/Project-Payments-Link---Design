import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: boolean;
  /** Extra classes for each item’s outer bordered wrapper (e.g. border-b-0 when nested in a card) */
  itemClassName?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ items, defaultOpen = false, itemClassName }) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpen && items.length > 0 ? items[0].id : null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx('border border-slate-200 rounded-lg overflow-hidden', itemClassName)}
        >
          <button
            onClick={() => toggle(item.id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          >
            <span className="text-sm font-normal text-slate-700">{item.title}</span>
            <ChevronDownIcon 
              className={clsx(
                "h-5 w-5 text-slate-500 transition-transform duration-200",
                openId === item.id ? "transform rotate-180" : ""
              )}
            />
          </button>
          
          <div 
            className={clsx(
              "transition-all duration-200 ease-in-out bg-white overflow-hidden",
              openId === item.id ? "max-h-[min(80vh,1200px)] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="p-4 border-t border-slate-100">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

