import type {
  DepositReturnStatus,
  FieldProvenance,
  MaterialFamily,
  PackagingShape,
} from "@kierratysappi/domain";
import { localizedText, type MessageKey } from "@kierratysappi/localization";
import { sortPackagingComponent, type SortingResult } from "@kierratysappi/recycling-engine";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SortingResultCard } from "@/components/sorting-result";
import {
  AppText,
  BrandLockup,
  Button,
  Eyebrow,
  InlineLink,
  Screen,
  sharedStyles,
} from "@/components/ui";
import { announceAccessibility } from "@/features/accessibility/announcements";
import { useLanguage } from "@/i18n/language-context";
import { radius, spacing, useAppTheme } from "@/theme/tokens";

const MATERIALS = [
  ["plastic", "materialPlastic"],
  ["carton", "materialCarton"],
  ["glass", "materialGlass"],
  ["metal", "materialMetal"],
] as const;
const SHAPES = [
  ["bottle", "shapeBottle"],
  ["can", "shapeCan"],
  ["jar", "shapeJar"],
  ["unknown", "shapeOther"],
] as const;
const DEPOSITS = [
  ["yes", "answerYes"],
  ["no", "answerNo"],
  ["unknown", "answerUnknown"],
] as const;

type MaterialChoice = (typeof MATERIALS)[number][0];

export default function ManualComponentScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { language, t } = useLanguage();
  const [materials, setMaterials] = useState<MaterialFamily[]>([]);
  const [shape, setShape] = useState<PackagingShape>("unknown");
  const [deposit, setDeposit] = useState<DepositReturnStatus>("unknown");
  const [results, setResults] = useState<SortingResult[]>([]);

  const toggleMaterial = (value: string) => {
    const material = value as MaterialChoice;
    setMaterials((current) =>
      current.includes(material)
        ? current.filter((item) => item !== material)
        : [...current, material],
    );
    setResults([]);
  };

  const evaluate = () => {
    if (materials.length === 0) return;
    const now = new Date().toISOString();
    const provenance: FieldProvenance = {
      sourceId: "local-user-observation",
      sourceName: t("localObservation"),
      sourceRecordId: `local-${Date.now()}`,
      sourceUrl: "https://kierratysappi.local/user-observation",
      retrievedAt: now,
      lastConfirmedAt: now,
      confidence: 0.9,
      verificationStatus: "user_confirmed",
      license: {
        id: "private-local-observation",
        name: "Private local observation",
        attributionText: t("localObservation"),
        shareAlike: false,
      },
    };
    const observed = <T,>(value: T) => ({ value, provenance });
    const componentShape = materials.length === 1 ? shape : "unknown";
    const componentDeposit =
      materials.length === 1 && (shape === "bottle" || shape === "can")
        ? deposit
        : "not_applicable";
    const nextResults = materials.map((material, index) =>
      sortPackagingComponent({
        component: {
          id: `local-component-${index + 1}`,
          packagingStatus: observed("packaging"),
          materialFamily: observed(material),
          shape: observed(componentShape),
          depositReturnStatus: observed(componentDeposit),
          conditions: { hazardousResidue: "unknown", pressurized: "unknown", emptied: "unknown" },
        },
        context: { country: "FI", language, evaluatedAt: now },
      }),
    );
    setResults(nextResults);
    announceAccessibility(
      nextResults.length > 1
        ? `${nextResults.length} ${t("packagingParts")}`
        : nextResults[0]?.status === "resolved"
          ? localizedText(language, nextResults[0].destination.label)
          : nextResults[0]?.status === "ambiguous"
            ? localizedText(language, nextResults[0].question)
            : localizedText(language, nextResults[0]?.nextAction ?? t("confidenceUnknown")),
      nextResults.length === 1 && nextResults[0]?.status === "resolved" ? "default" : "high",
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <BrandLockup compact />
        <InlineLink label={t("close")} onPress={() => router.back()} role="button" />
      </View>
      <View style={styles.intro}>
        <Eyebrow>{t("manualObservationEyebrow")}</Eyebrow>
        <AppText variant="title" accessibilityRole="header">
          {t("selectMaterialTitle")}
        </AppText>
        <AppText muted>{t("selectMaterialBody")}</AppText>
      </View>

      <ChoiceGroup
        label={t("selectMaterialTitle")}
        value={materials}
        multiple
        choices={MATERIALS.map(([value, label]) => ({ value, label: t(label) }))}
        onChange={toggleMaterial}
      />
      <ChoiceGroup
        label={t("shapeLabel")}
        value={shape}
        choices={SHAPES.map(([value, label]) => ({ value, label: t(label) }))}
        onChange={(value) => {
          setShape(value as PackagingShape);
          setResults([]);
        }}
      />
      {materials.length === 1 && (shape === "bottle" || shape === "can") && (
        <ChoiceGroup
          label={t("depositLabel")}
          value={deposit}
          choices={DEPOSITS.map(([value, label]) => ({ value, label: t(label) }))}
          onChange={(value) => {
            setDeposit(value as DepositReturnStatus);
            setResults([]);
          }}
        />
      )}
      <Button label={t("showGuidance")} onPress={evaluate} disabled={materials.length === 0} />
      {results.length > 0 && (
        <View style={styles.result} accessibilityLiveRegion="polite">
          {results.map((result, index) => (
            <View key={result.componentId} style={styles.resultItem}>
              <AppText variant="label">
                {index + 1} / {results.length} · {materialLabel(materials[index], t)}
              </AppText>
              <SortingResultCard result={result} />
            </View>
          ))}
        </View>
      )}
      <AppText variant="small" muted style={{ color: palette.muted }}>
        {t("localObservation")}
      </AppText>
    </Screen>
  );
}

function materialLabel(value: MaterialFamily | undefined, t: (key: MessageKey) => string): string {
  if (value === "plastic") return t("materialPlastic");
  if (value === "carton") return t("materialCarton");
  if (value === "glass") return t("materialGlass");
  if (value === "metal") return t("materialMetal");
  return t("materialUnknown");
}

function ChoiceGroup({
  label,
  value,
  choices,
  onChange,
  multiple = false,
}: {
  readonly label: string;
  readonly value: string | readonly string[] | undefined;
  readonly choices: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
  readonly multiple?: boolean;
}) {
  const { palette } = useAppTheme();
  return (
    <View style={sharedStyles.tightStack} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.choices}>
        {choices.map((choice) => {
          const selected = multiple
            ? Array.isArray(value) && value.includes(choice.value)
            : value === choice.value;
          return (
            <Pressable
              key={choice.value}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => onChange(choice.value)}
              style={({ pressed }) => [
                styles.choice,
                {
                  backgroundColor: selected ? palette.pineSoft : palette.surface,
                  borderColor: selected ? palette.pine : palette.line,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="label" style={{ color: selected ? palette.pine : palette.ink }}>
                {choice.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  intro: { paddingTop: spacing.xxl, paddingBottom: spacing.lg, gap: spacing.sm },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  choice: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
  },
  result: { paddingTop: spacing.lg, gap: spacing.lg },
  resultItem: { gap: spacing.xs },
});
