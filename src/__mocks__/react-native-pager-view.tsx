import React from "react";
import { View } from "react-native";

const PagerView = React.forwardRef(function PagerView(
  { children, ...rest }: { children?: React.ReactNode },
  ref: React.Ref<{ setPage: (n: number) => void }>,
) {
  React.useImperativeHandle(ref, () => ({ setPage: () => {} }));
  return <View {...rest}>{children}</View>;
});

export default PagerView;
