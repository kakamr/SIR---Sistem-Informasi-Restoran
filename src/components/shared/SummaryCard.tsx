import Image from "next/image";

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: string;
}

export default function SummaryCard({ label, value, icon }: SummaryCardProps) {
  return (
    <div className="bg-[#fdf8f0] rounded-xl p-6 flex items-center gap-4 min-w-0">
      <Image src={icon} alt={label} className="shrink-0" width={45} height={45}/>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-black/60 truncate">{label}</p>
        <p className="text-2xl font-bold mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}