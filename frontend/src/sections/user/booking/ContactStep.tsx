import React from 'react';
import { User } from 'lucide-react';

interface ContactStepProps {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
}

const ContactStep: React.FC<ContactStepProps> = ({
  customerName,
  customerEmail,
  customerPhone,
  onChangeName,
  onChangeEmail,
  onChangePhone,
}) => (
  <div>
    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
      <User className="w-5 h-5 text-amber-400" />
      Customer Contact Details
    </h2>
    <div className="max-w-md space-y-5">
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
        <input
          type="text"
          placeholder="e.g. Juan dela Cruz"
          value={customerName}
          onChange={e => onChangeName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
        <input
          type="email"
          placeholder="e.g. juan@email.com"
          value={customerEmail}
          onChange={e => onChangeEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
        />
        <span className="text-[10px] text-zinc-500 mt-1.5 block">Your secure management links will be sent here.</span>
      </div>
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Phone Number</label>
        <input
          type="tel"
          placeholder="e.g. 09171234567"
          value={customerPhone}
          onChange={e => onChangePhone(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 focus:border-amber-500 focus:outline-none text-zinc-200 transition-colors placeholder:text-zinc-600"
        />
      </div>
    </div>
  </div>
);

export default ContactStep;
