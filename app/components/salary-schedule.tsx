"use client";
import { useLanguage } from "./language-provider";
import type { calculateAnnualSalary } from "../lib/salary";
const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", useGrouping: "always" });
type SalaryResult = ReturnType<typeof calculateAnnualSalary>;
export default function SalarySchedule({ result }: { result: SalaryResult }) {
  const { t, language } = useLanguage();
  const locale = language === "pl" ? "pl-PL" : language === "ru" ? "ru-RU" : "en-GB";
  const month = (value: number) =>
    new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, value - 1, 1)));
  const sum = (key: keyof SalaryResult["months"][number]) =>
    result.months.reduce((total, row) => total + Number(row[key]), 0);
  const uopKeys = [
    "uopNet",
    "gross",
    "social",
    "health",
    "employeePpk",
    "employerPpk",
    "exemptIncome",
    "costs",
    "taxBase",
    "cumulativeTaxBase",
  ] as const;
  const uopLabels = [
    "Na rękę",
    "Brutto",
    "Składki społeczne",
    "Składka zdrowotna",
    "PPK pracownika · 2%",
    "PPK pracodawcy · 1,5%",
    "Ulga dla młodych w miesiącu",
    "KUP w miesiącu",
    "Podstawa PIT",
    "Podstawa PIT narastająco",
  ];
  const b2bKeys = ["b2bNet", "gross", "b2bSocial", "b2bHealth", "b2bHealthRevenue", "b2bTax"] as const;
  const b2bLabels = [
    "Na rękę",
    "Przychód bez VAT",
    "ZUS społeczny · bez chorobowego",
    "Składka zdrowotna",
    "Przychód do progu zdrowotnego narastająco",
    "Ryczałt 12%",
  ];
  return (
    <section className="payment-schedule salary-schedule" aria-label={t("Wynagrodzenie miesiąc po miesiącu")}>
      <h2>{t("Wynagrodzenie miesiąc po miesiącu")}</h2>
      <p className="salary-assumptions">
        {t(
          "UoP: ulga do 26 lat kończy się po 85 528 zł przychodu; później PIT 12%, a powyżej 120 000 zł podstawy PIT narastająco — 32%. 50% KUP działa tylko do limitu. PPK i limit składek są uwzględniane w każdym miesiącu. Zakładamy PIT-2 (300 zł miesięcznie), jednego pracodawcę i prawo do wybranych ulg przez cały rok.",
        )}
      </p>
      <h3>{t("Umowa o pracę")}</h3>
      <div className="table-scroll" role="region" tabIndex={0} aria-label={t("Miesięczne wynagrodzenie UoP")}>
        <table className="uop-schedule">
          <caption>{t("Miesięczne wynagrodzenie UoP")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("Miesiąc")}</th>
              {uopLabels.map((label) => (
                <th key={label} scope="col">
                  {t(label)}
                </th>
              ))}
              <th scope="col">{t("Stawka PIT")}</th>
              <th scope="col">{t("Zaliczka na PIT")}</th>
            </tr>
          </thead>
          <tbody>
            {result.months.map((row) => (
              <tr key={row.month}>
                <th scope="row">{month(row.month)}</th>
                {uopKeys.map((key) => (
                  <td key={key}>{money.format(row[key])}</td>
                ))}
                <td>
                  {row.baseAt12 && row.baseAt32
                    ? "12% / 32%"
                    : row.baseAt32
                      ? "32%"
                      : row.baseAt12
                        ? "12%"
                        : row.exemptIncome
                          ? t("Zwolnienie")
                          : "—"}
                </td>
                <td>{money.format(row.taxAdvance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t("Suma wypłat w roku")}</th>
              {uopKeys.map((key) => (
                <td key={key}>{key === "cumulativeTaxBase" ? "—" : money.format(sum(key))}</td>
              ))}
              <td>—</td>
              <td>{money.format(result.annualTaxAdvances)}</td>
            </tr>
            <tr>
              <th scope="row">{t("Korekta po rozliczeniu rocznym (+ zwrot / − dopłata)")}</th>
              <td>{money.format(result.uopSettlement)}</td>
              <td colSpan={11} />
            </tr>
            <tr>
              <th scope="row">{t("Na rękę / rok po rozliczeniu")}</th>
              <td>{money.format(result.annualUopNet)}</td>
              <td colSpan={11} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="salary-assumptions">
        {t(
          "Miesięczne zaliczki mogą różnić się od podatku rocznego przez zaokrąglenia, niewykorzystane miesięczne zmniejszenie podatku i koszty roczne. Korekta wyjaśnia różnicę między sumą wypłat a rocznym wynikiem w karcie.",
        )}
      </p>
      <h3>{t("B2B · ryczałt 12%")}</h3>
      <div className="table-scroll" role="region" tabIndex={0} aria-label={t("Miesięczny dochód B2B")}>
        <table className="b2b-schedule">
          <caption>{t("Miesięczny dochód B2B")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("Miesiąc")}</th>
              {b2bLabels.map((label) => (
                <th key={label} scope="col">
                  {t(label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.months.map((row) => (
              <tr key={row.month}>
                <th scope="row">{month(row.month)}</th>
                {b2bKeys.map((key) => (
                  <td key={key}>{money.format(row[key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t("Suma wypłat w roku")}</th>
              {b2bKeys.map((key) => (
                <td key={key}>{key === "b2bHealthRevenue" ? "—" : money.format(sum(key))}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">{t("Korekta po rozliczeniu rocznym (+ zwrot / − dopłata)")}</th>
              <td>{money.format(result.b2bSettlement)}</td>
              <td colSpan={5} />
            </tr>
            <tr>
              <th scope="row">{t("Na rękę / rok po rozliczeniu")}</th>
              <td>{money.format(result.annualB2bNet)}</td>
              <td colSpan={5} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="salary-assumptions">
        {t(
          "B2B: stawka podatku zawsze 12%; ulga do 26 lat, KUP i PPK nie dotyczą B2B. Składka zdrowotna zmienia się po przekroczeniu progów przychodu pomniejszonego o składki społeczne. Roczna korekta obejmuje szacowane wyrównanie zdrowotne i podatkowe; rzeczywiste terminy płatności i odliczeń mogą się różnić.",
        )}
      </p>
    </section>
  );
}
