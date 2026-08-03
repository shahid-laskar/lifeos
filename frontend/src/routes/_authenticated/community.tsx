import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Calculator, MapPin, CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getDonations, createDonation, calculateZakat } from "@/lib/api/endpoints";

export const Route = createFileRoute("/_authenticated/community")({
  component: CommunityPage,
});

function CommunityPage() {
  return (
    <>
      <PageHeader title="Community" arabic="المجتمع" subtitle="Charity and Local Events" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <CharityPlanner />
          <ZakatCalculator />
        </div>
        <div className="flex flex-col gap-6">
          <MasjidDirectory />
          <LocalEvents />
        </div>
      </div>
    </>
  );
}

function CharityPlanner() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState("sadaqah");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["community-donations"],
    queryFn: getDonations,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createDonation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-donations"] });
      setIsAdding(false);
      setAmount("");
      setRecipient("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      donation_type: type,
      amount: parseFloat(amount),
      date: new Date().toISOString().split('T')[0],
      recipient,
    });
  };

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="card p-5 border-[var(--line)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-[16px] text-[var(--ink)] flex items-center gap-2">
          <Heart className="h-4 w-4" /> Charity Planner
        </h3>
        <button onClick={() => setIsAdding(!isAdding)} className="text-[var(--primary)] text-[13px] font-medium flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="mb-6 p-4 rounded-lg bg-[var(--primary-soft)] text-center">
        <p className="text-[13px] text-[var(--primary)] font-medium mb-1">Total Given (This Year)</p>
        <p className="text-[28px] font-bold text-[var(--primary)]">${totalDonated.toFixed(2)}</p>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[12px] text-[var(--mute)] mb-1 block">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]">
                <option value="sadaqah">Sadaqah</option>
                <option value="zakat">Zakat</option>
                <option value="fidyah">Fidyah</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[12px] text-[var(--mute)] mb-1 block">Amount ($)</label>
              <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Recipient / Organization</label>
            <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g. Local Masjid" className="w-full bg-white border border-[var(--line)] rounded-md px-2 py-1 text-[13px]" />
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn text-[13px] px-3 py-1">Record Donation</button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">Loading...</p>
        ) : donations.length === 0 ? (
          <p className="text-[13px] text-[var(--mute)] text-center py-4">No donations recorded.</p>
        ) : (
          donations.slice(0, 5).map(donation => (
            <div key={donation.id} className="flex justify-between items-center p-3 bg-[var(--surface)] border border-[var(--line)] rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)] capitalize">{donation.donation_type}</p>
                <p className="text-[12px] text-[var(--mute)]">{donation.recipient || "General"} • {donation.date}</p>
              </div>
              <div className="text-[14px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-1 rounded">
                ${donation.amount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ZakatCalculator() {
  const [cash, setCash] = useState("");
  const [investments, setInvestments] = useState("");
  const [result, setResult] = useState<any>(null);

  const calculateMutation = useMutation({
    mutationFn: (data: any) => calculateZakat(data),
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate({
      cash: parseFloat(cash) || 0,
      investments: parseFloat(investments) || 0,
    });
  };

  return (
    <div className="card p-5 border-[var(--line)]">
      <h3 className="font-semibold text-[16px] text-[var(--ink)] mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4" /> Zakat Calculator
      </h3>
      <form onSubmit={handleCalculate} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Cash on Hand ($)</label>
            <input type="number" value={cash} onChange={e => setCash(e.target.value)} className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
          <div className="flex-1">
            <label className="text-[12px] text-[var(--mute)] mb-1 block">Investments ($)</label>
            <input type="number" value={investments} onChange={e => setInvestments(e.target.value)} className="w-full bg-[var(--surface)] border border-[var(--line)] rounded-md px-2 py-1.5 text-[13px]" />
          </div>
        </div>
        <button type="submit" disabled={calculateMutation.isPending} className="btn mt-2 py-2">Calculate Zakat</button>
      </form>

      {result && (
        <div className="mt-4 p-4 border border-[var(--primary-soft)] rounded-lg bg-[var(--surface)]">
          <p className="text-[13px] text-[var(--mute)]">Net Assets: ${result.net_assets.toFixed(2)}</p>
          <div className="mt-2 text-center">
            <p className="text-[12px] font-medium text-[var(--mute)]">Zakat Due (2.5%)</p>
            <p className="text-[24px] font-bold text-[var(--ink)]">${result.zakat_due.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MasjidDirectory() {
  return (
    <div className="card p-5 border-[var(--line)]">
      <h3 className="font-semibold text-[16px] text-[var(--ink)] mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4" /> Masjid Directory
      </h3>
      <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-center">
        <p className="text-[13px] text-[var(--mute)] mb-3">Find nearby mosques with prayer times, directions, and community info.</p>
        <button className="text-[13px] text-[var(--primary)] font-medium bg-[var(--primary-soft)] px-4 py-2 rounded-lg w-full">Enable Location Services</button>
      </div>
    </div>
  );
}

function LocalEvents() {
  return (
    <div className="card p-5 border-[var(--line)]">
      <h3 className="font-semibold text-[16px] text-[var(--ink)] mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4" /> Local Events
      </h3>
      <div className="p-4 bg-[var(--surface)] border border-[var(--line)] rounded-lg text-center flex flex-col gap-2">
        <p className="text-[13px] text-[var(--mute)]">Discover and participate in local community events, volunteer opportunities, and gatherings.</p>
        <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded w-fit mx-auto">Coming Soon</span>
      </div>
    </div>
  );
}
