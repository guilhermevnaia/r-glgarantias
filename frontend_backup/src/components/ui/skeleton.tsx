import * as React from "react";
export const Skeleton = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>((props, ref) => (
  <span ref={ref} className="skeleton" {...props} />
)); 