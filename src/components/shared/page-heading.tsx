export function PageHeading({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-[#ead8c3] bg-gradient-to-r from-[#fffdfa]/92 via-[#fff7ec]/92 to-[#ffe9d1]/88 p-5 shadow-[0_18px_45px_rgba(76,21,37,0.08)] ring-1 ring-white/70">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b06b47]">Feminine Designer</p>
        <h1 className="font-serif text-4xl font-semibold tracking-normal text-[#3f0f20]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f625d]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
