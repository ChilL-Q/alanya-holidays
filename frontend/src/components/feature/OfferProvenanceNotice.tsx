import { useTranslation } from "react-i18next";

export default function OfferProvenanceNotice() {
  const { t } = useTranslation();

  return (
    <p className="mt-1 text-xs text-foreground-500" role="note">
      {t("public.approvedOfferProvenance")}
    </p>
  );
}
