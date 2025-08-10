export const carrierColors = {
  SaskTel: 'sasktel',
  Bell: 'bell',
  Telus: 'telus',
  Rogers: 'rogers',
} as const;

export type CarrierName = keyof typeof carrierColors;

export function getCarrierColor(carrier: string): string {
  const normalizedCarrier = carrier as CarrierName;
  return carrierColors[normalizedCarrier] || 'gray-500';
}

export function CarrierDot({ carrier, className = "" }: { carrier: string; className?: string }) {
  const colorClass = getCarrierColor(carrier);
  return <div className={`w-3 h-3 rounded-full bg-${colorClass} ${className}`} />;
}
