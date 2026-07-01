import React, { useState } from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import { useDebounce } from "@/lib/useDebounce";

function DebounceTestComponent() {
  const [value, setValue] = useState("a");
  const debounced = useDebounce(value, 300);
  return (
    <>
      <Text testID="current">{value}</Text>
      <Text testID="debounced">{debounced}</Text>
      <Pressable onPress={() => setValue("b")} testID="button">
        <Text>Update</Text>
      </Pressable>
    </>
  );
}

test("useDebounce delays the value update", async () => {
  jest.useFakeTimers();
  const { getByTestId } = await render(<DebounceTestComponent />);

  // Initial: both should be "a"
  expect(getByTestId("current")).toHaveTextContent("a");
  expect(getByTestId("debounced")).toHaveTextContent("a");

  // Update value
  await act(async () => {
    fireEvent.press(getByTestId("button"));
  });

  // Current should be "b" but debounced should still be "a"
  expect(getByTestId("current")).toHaveTextContent("b");
  expect(getByTestId("debounced")).toHaveTextContent("a");

  // Advance timers by 300ms
  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  // Now debounced should also be "b"
  expect(getByTestId("debounced")).toHaveTextContent("b");

  jest.useRealTimers();
});
