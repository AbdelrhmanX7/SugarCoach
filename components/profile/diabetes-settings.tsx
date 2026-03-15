"use client";

import type { Profile } from "@/types/database";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { RadioGroup, Radio } from "@heroui/radio";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  CheckmarkCircle02Icon,
  Add01Icon,
  MinusSignIcon,
} from "@hugeicons/core-free-icons";

const DIABETES_TYPES = [
  { key: "type1", label: "Type 1" },
  { key: "type2", label: "Type 2" },
  { key: "gestational", label: "Gestational" },
  { key: "prediabetes", label: "Prediabetes" },
];

type DiabetesSettingsProps = {
  profile: Profile;
  onSave: (
    data: Partial<
      Pick<
        Profile,
        | "diabetes_type"
        | "insulin_to_carb_ratio"
        | "correction_factor"
        | "target_bg_min"
        | "target_bg_max"
        | "target_a1c"
        | "current_a1c"
        | "insulin_method"
        | "bg_unit"
      >
    >,
  ) => Promise<void>;
};

function NumberStepper({
  label,
  description,
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (val: string) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  const numVal = parseFloat(value) || 0;

  const increment = () => {
    const next = numVal + step;

    if (max !== undefined && next > max) return;
    onChange(String(Math.round(next * 100) / 100));
  };

  const decrement = () => {
    const next = numVal - step;

    if (min !== undefined && next < min) return;
    onChange(String(Math.round(next * 100) / 100));
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label={label}
            placeholder={placeholder}
            type="number"
            value={value}
            onValueChange={onChange}
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            isIconOnly
            className="h-10 w-10 min-w-0"
            size="sm"
            variant="flat"
            onPress={decrement}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={MinusSignIcon}
              size={16}
              strokeWidth={2}
            />
          </Button>
          <Button
            isIconOnly
            className="h-10 w-10 min-w-0"
            size="sm"
            variant="flat"
            onPress={increment}
          >
            <HugeiconsIcon
              color="currentColor"
              icon={Add01Icon}
              size={16}
              strokeWidth={2}
            />
          </Button>
        </div>
      </div>
      {description && (
        <p className="mt-1 text-xs text-default-400">{description}</p>
      )}
    </div>
  );
}

export default function DiabetesSettings({
  profile,
  onSave,
}: DiabetesSettingsProps) {
  const [diabetesType, setDiabetesType] = useState<string>(
    profile.diabetes_type ?? "",
  );
  const [insulinToCarbRatio, setInsulinToCarbRatio] = useState<string>(
    profile.insulin_to_carb_ratio?.toString() ?? "",
  );
  const [correctionFactor, setCorrectionFactor] = useState<string>(
    profile.correction_factor?.toString() ?? "",
  );
  const [targetBgMin, setTargetBgMin] = useState<string>(
    profile.target_bg_min?.toString() ?? "70",
  );
  const [targetBgMax, setTargetBgMax] = useState<string>(
    profile.target_bg_max?.toString() ?? "180",
  );
  const [targetA1c, setTargetA1c] = useState<string>(
    profile.target_a1c?.toString() ?? "",
  );
  const [currentA1c, setCurrentA1c] = useState<string>(
    profile.current_a1c?.toString() ?? "",
  );
  const [bgUnit, setBgUnit] = useState<string>(profile.bg_unit ?? "mg/dL");
  const [insulinMethod, setInsulinMethod] = useState<string>(
    profile.insulin_method ?? "syringe",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveSuccess(false);
    try {
      await onSave({
        diabetes_type: (diabetesType as Profile["diabetes_type"]) || null,
        insulin_to_carb_ratio: insulinToCarbRatio
          ? parseFloat(insulinToCarbRatio)
          : null,
        correction_factor: correctionFactor
          ? parseFloat(correctionFactor)
          : null,
        target_bg_min: targetBgMin ? parseFloat(targetBgMin) : 70,
        target_bg_max: targetBgMax ? parseFloat(targetBgMax) : 180,
        target_a1c: targetA1c ? parseFloat(targetA1c) : null,
        current_a1c: currentA1c ? parseFloat(currentA1c) : null,
        bg_unit: bgUnit as Profile["bg_unit"],
        insulin_method: insulinMethod as Profile["insulin_method"],
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const bgMinNum = parseFloat(targetBgMin) || 70;
  const bgMaxNum = parseFloat(targetBgMax) || 180;
  const rangeWidth = Math.min(
    100,
    Math.max(10, ((bgMaxNum - bgMinNum) / 300) * 100),
  );
  const rangeLeft = Math.max(0, (bgMinNum / 300) * 100);

  return (
    <Card className="border border-default-200 shadow-none">
      <CardHeader className="flex items-center gap-2 pb-2">
        <HugeiconsIcon
          className="text-primary"
          color="currentColor"
          icon={Activity01Icon}
          size={20}
          strokeWidth={2}
        />
        <h2 className="text-lg font-semibold">Diabetes Settings</h2>
      </CardHeader>
      <CardBody className="gap-5">
        <Select
          label="Diabetes Type"
          placeholder="Select your diabetes type"
          selectedKeys={diabetesType ? [diabetesType] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0];

            if (selected) setDiabetesType(selected as string);
          }}
        >
          {DIABETES_TYPES.map((type) => (
            <SelectItem key={type.key}>{type.label}</SelectItem>
          ))}
        </Select>

        <NumberStepper
          description="How many grams of carbs 1 unit of insulin covers"
          label="Insulin-to-Carb Ratio"
          placeholder="e.g. 10"
          step={1}
          value={insulinToCarbRatio}
          onChange={setInsulinToCarbRatio}
        />

        <NumberStepper
          description="How much 1 unit of insulin drops your blood sugar"
          label="Correction Factor"
          placeholder="e.g. 50"
          step={5}
          value={correctionFactor}
          onChange={setCorrectionFactor}
        />

        {/* BG range */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            Target Blood Sugar Range
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min (mg/dL)"
              placeholder="70"
              type="number"
              value={targetBgMin}
              onValueChange={setTargetBgMin}
            />
            <Input
              label="Max (mg/dL)"
              placeholder="180"
              type="number"
              value={targetBgMax}
              onValueChange={setTargetBgMax}
            />
          </div>

          {/* Visual range bar */}
          <div>
            <div className="relative h-2 rounded-full bg-default-100">
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-success to-warning"
                style={{
                  left: `${rangeLeft}%`,
                  width: `${rangeWidth}%`,
                  transition: "left 0.3s, width 0.3s",
                }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-default-400">
              <span>0</span>
              <span>100</span>
              <span>200</span>
              <span>300</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberStepper
            label="Target A1C"
            placeholder="e.g. 7.0"
            step={0.1}
            value={targetA1c}
            onChange={setTargetA1c}
          />
          <NumberStepper
            label="Current A1C"
            placeholder="e.g. 7.5"
            step={0.1}
            value={currentA1c}
            onChange={setCurrentA1c}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <RadioGroup
            label="Blood Sugar Unit"
            value={bgUnit}
            onValueChange={setBgUnit}
          >
            <Radio value="mg/dL">mg/dL</Radio>
            <Radio value="mmol/L">mmol/L</Radio>
          </RadioGroup>

          <RadioGroup
            label="Insulin Method"
            value={insulinMethod}
            onValueChange={setInsulinMethod}
          >
            <Radio value="syringe">Syringe</Radio>
            <Radio value="pen">Pen</Radio>
          </RadioGroup>
        </div>

        <Button
          className="w-full font-semibold"
          color={saveSuccess ? "success" : "primary"}
          isLoading={isLoading}
          onPress={handleSave}
        >
          {saveSuccess ? (
            <span className="flex items-center gap-2">
              <HugeiconsIcon
                color="currentColor"
                icon={CheckmarkCircle02Icon}
                size={18}
                strokeWidth={2}
              />
              Saved!
            </span>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardBody>
    </Card>
  );
}
