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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-normal text-[#4c1525]">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f625d]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
