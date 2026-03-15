"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";

const COMMON_SUGGESTIONS = [
  "Rice",
  "Pasta",
  "Bread",
  "Fish",
  "Chicken",
  "Eggs",
  "Oats",
  "Yogurt",
  "Avocado",
  "Quinoa",
  "Sweet Potato",
  "Lentils",
];

interface FoodPreferencesProps {
  value: string[];
  onChange: (tags: string[]) => void;
  label: string;
  placeholder: string;
}

export default function FoodPreferences({
  value,
  onChange,
  label,
  placeholder,
}: FoodPreferencesProps) {
  const [inputValue, setInputValue] = useState("");

  function addTag(tag: string) {
    const trimmed = tag.trim();

    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  }

  const filteredSuggestions = COMMON_SUGGESTIONS.filter(
    (s) => !value.includes(s),
  );

  return (
    <div className="flex flex-col gap-3">
      <Input
        description="Type a food name and press Enter to add"
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onKeyDown={handleKeyDown}
        onValueChange={setInputValue}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Chip
              key={tag}
              color="primary"
              variant="flat"
              onClose={() => removeTag(tag)}
            >
              {tag}
            </Chip>
          ))}
        </div>
      )}

      {filteredSuggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-default-400">Common suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggestions.map((suggestion) => (
              <Chip
                key={suggestion}
                className="cursor-pointer transition-colors hover:bg-default-100"
                size="sm"
                variant="bordered"
                onClick={() => addTag(suggestion)}
              >
                + {suggestion}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
