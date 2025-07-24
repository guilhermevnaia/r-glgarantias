import * as React from "react";
export const Separator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>((props, ref) => (
  <hr ref={ref} style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '8px 0' }} {...props} />
)); 