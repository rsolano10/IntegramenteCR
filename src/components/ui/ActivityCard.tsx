import { ImagePlaceholder } from "./ImagePlaceholder";

export function ActivityCard({
  placeholderLabel,
  title,
  meta,
  children,
}: {
  placeholderLabel: string;
  title: string;
  meta: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-borde rounded-[20px] overflow-hidden">
      <ImagePlaceholder label={placeholderLabel} height={140} rounded="rounded-none" />
      <div className="p-4.5">
        <h3 className="m-0 mb-2 text-[19px]">{title}</h3>
        <p className="m-0 mb-3 text-[16px] leading-relaxed text-tinta-suave">{meta}</p>
        {children}
      </div>
    </div>
  );
}
