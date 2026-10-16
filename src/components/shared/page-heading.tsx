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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-1">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-copper">Feminine Designer</p>
        <h1 className="font-serif text-4xl font-medium tracking-normal text-wine-deep">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-strong">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
