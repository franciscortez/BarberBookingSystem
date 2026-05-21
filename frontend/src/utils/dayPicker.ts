export const bookingDayPickerClassNames = {
  root: 'w-full',
  months: 'flex justify-center',
  month: 'w-full',
  month_caption: 'flex items-center justify-center pb-4',
  caption_label: 'text-sm font-bold text-white',
  nav: 'flex items-center justify-between mb-2',
  button_previous: 'absolute left-4 top-4 h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-30',
  button_next: 'absolute right-4 top-4 h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-30',
  month_grid: 'w-full border-collapse',
  weekdays: 'grid grid-cols-7 mb-2',
  weekday: 'text-[11px] font-semibold uppercase text-zinc-500 text-center py-1',
  week: 'grid grid-cols-7 gap-1 mb-1',
  day: 'aspect-square text-center text-sm',
  day_button: 'h-10 w-full rounded-xl text-sm text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40',
  selected: 'text-amber-300',
  today: 'text-amber-300',
  disabled: 'text-zinc-700 opacity-50 line-through decoration-red-400 decoration-2',
  outside: 'text-zinc-700'
};

export const bookingDayPickerModifiersClassNames = {
  selected: 'rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50',
  today: 'font-bold',
  fullyBooked: 'line-through decoration-red-400 decoration-2'
};
