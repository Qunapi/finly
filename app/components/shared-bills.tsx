"use client";
import { useState } from "react";
import { flushUrlUpdates } from "../lib/url-updates";
import { useLanguage } from "./language-provider";
import { parseNumberInput, numberFormat } from "../lib/number-format";
import { settleExpenses, type SharedExpenses, type Expense } from "../lib/shared-expenses";
const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", useGrouping: "always" });
export default function SharedBills({
  data,
  onChange,
}: {
  data: SharedExpenses;
  onChange: (data: SharedExpenses) => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const selected = participants ?? data.people.map((p) => p.id);
  const paidBy = payer || data.people[0]?.id || "";
  const parsed = parseNumberInput(amount);
  const cents = parsed === null ? 0 : Math.round(parsed * 100);
  const valid =
    description.trim() &&
    cents > 0 &&
    cents <= 100000000000 &&
    selected.length > 0 &&
    data.people.some((p) => p.id === paidBy);
  const summary = settleExpenses(data);
  const personName = (id: string) => data.people.find((p) => p.id === id)?.name ?? "";
  const format = (cents: number) => money.format(cents / 100);
  function reset() {
    setDescription("");
    setAmount("");
    setPayer("");
    setParticipants(null);
    setEditing(null);
  }
  function edit(expense: Expense) {
    setEditing(expense.id);
    setDescription(expense.description);
    setAmount(numberFormat.format(expense.cents / 100));
    setPayer(expense.payer);
    setParticipants(expense.participants);
    document.getElementById("expense-description")?.focus();
  }
  return (
    <>
      <section className="intro">
        <p className="eyebrow">{t("PODZIAŁ RACHUNKÓW")}</p>
        <h1>{t("Wspólne wydatki")}</h1>
        <p className="lede">{t("Dodaj osoby i wydatki. Sprawdź, kto komu ile oddaje.")}</p>
      </section>
      <section className="bills-card">
        <h2>{t("Osoby")}</h2>
        <form
          className="bills-inline"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !name.trim() ||
              data.people.length >= 100 ||
              data.people.some((p) => p.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())
            )
              return;
            onChange({ ...data, people: [...data.people, { id: crypto.randomUUID(), name: name.trim() }] });
            setName("");
          }}
        >
          <label htmlFor="person-name">{t("Imię lub pseudonim")}</label>
          <input id="person-name" value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} />
          <button
            type="submit"
            disabled={
              !name.trim() ||
              data.people.length >= 100 ||
              data.people.some((p) => p.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())
            }
          >
            {t("Dodaj osobę")}
          </button>
        </form>
        <ul className="bills-people">
          {data.people.map((person) => (
            <li key={person.id}>
              <span>{person.name}</span>
              <button
                type="button"
                disabled={data.expenses.some((e) => e.payer === person.id || e.participants.includes(person.id))}
                aria-label={`${t("Usuń osobę")}: ${person.name}`}
                onClick={() => {
                  onChange({ ...data, people: data.people.filter((p) => p.id !== person.id) });
                  if (payer === person.id) setPayer("");
                  setParticipants((current) => current?.filter((id) => id !== person.id) ?? null);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        {data.people.length > 0 && (
          <p className="salary-assumptions">{t("Aby usunąć osobę, najpierw usuń lub zmień jej wydatki.")}</p>
        )}
      </section>
      {data.people.length > 0 && (
        <section className="bills-card">
          <h2>{t(editing ? "Edytuj wydatek" : "Dodaj wydatek")}</h2>
          <form
            className="bills-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!valid || (!editing && data.expenses.length >= 1000)) return;
              const expense = {
                id: editing ?? crypto.randomUUID(),
                description: description.trim(),
                cents,
                payer: paidBy,
                participants: selected,
              };
              onChange({
                ...data,
                expenses: editing
                  ? data.expenses.map((e) => (e.id === editing ? expense : e))
                  : [...data.expenses, expense],
              });
              reset();
            }}
          >
            <label htmlFor="expense-description">{t("Za co?")}</label>
            <input
              id="expense-description"
              value={description}
              maxLength={200}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
            <label htmlFor="expense-amount">{t("Kwota (PLN)")}</label>
            <input
              id="expense-amount"
              inputMode="decimal"
              value={amount}
              required
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => {
                if (cents > 0) setAmount(numberFormat.format(cents / 100));
              }}
            />
            <label htmlFor="expense-payer">{t("Kto zapłacił?")}</label>
            <select id="expense-payer" value={paidBy} onChange={(e) => setPayer(e.target.value)}>
              {data.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <fieldset>
              <legend>{t("Podziel równo między")}</legend>
              {data.people.map((p) => (
                <label className="bills-check" key={p.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setParticipants(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))
                    }
                  />
                  {p.name}
                </label>
              ))}
            </fieldset>
            {selected.length > 0 && cents > 0 && (
              <p className="salary-assumptions">
                {t("Na osobę (około)")}: {format(cents / selected.length)}
              </p>
            )}
            <div className="bills-actions">
              <button type="submit" disabled={!valid || (!editing && data.expenses.length >= 1000)}>
                {t(editing ? "Zapisz zmiany" : "Dodaj wydatek")}
              </button>
              {editing && (
                <button type="button" onClick={reset}>
                  {t("Anuluj")}
                </button>
              )}
            </div>
          </form>
        </section>
      )}
      <section className="bills-card" aria-live="polite">
        <h2>{t("Rozliczenie")}</h2>
        <p>
          {t("Suma wydatków")}: <strong>{format(summary.total)}</strong>
        </p>
        {data.people.length === 0 ? (
          <p>{t("Zacznij od dodania osób.")}</p>
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {["Osoba", "Zapłacono", "Udział", "Saldo"].map((label) => (
                      <th key={label} scope="col">
                        {t(label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.balances.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">{p.name}</th>
                      <td>{format(p.paid)}</td>
                      <td>{format(p.share)}</td>
                      <td>{format(p.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="salary-assumptions">{t("Dodatnie saldo: do otrzymania. Ujemne saldo: do oddania.")}</p>
            <h3>{t("Kto komu oddaje")}</h3>
            {summary.transfers.length ? (
              <ul className="bills-transfers">
                {summary.transfers.map((transfer, i) => (
                  <li key={i}>
                    <strong>{personName(transfer.from)}</strong> → <strong>{personName(transfer.to)}</strong>:{" "}
                    {format(transfer.cents)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("Wszyscy rozliczeni.")}</p>
            )}
          </>
        )}
      </section>
      <section className="bills-card">
        <h2>{t("Wydatki")}</h2>
        {!data.expenses.length ? (
          <p>{t("Brak wydatków.")}</p>
        ) : (
          <ul className="bills-expenses">
            {data.expenses.map((expense) => (
              <li key={expense.id}>
                <div>
                  <strong>{expense.description}</strong>
                  <p>
                    {personName(expense.payer)} · {format(expense.cents)}
                  </p>
                  <p className="salary-assumptions">
                    {t("Podziel równo między")}: {expense.participants.map(personName).join(", ")}
                  </p>
                </div>
                <div className="bills-actions">
                  <button
                    type="button"
                    aria-label={`${t("Edytuj")}: ${expense.description}`}
                    onClick={() => edit(expense)}
                  >
                    {t("Edytuj")}
                  </button>
                  <button
                    type="button"
                    aria-label={`${t("Usuń")}: ${expense.description}`}
                    onClick={() => {
                      onChange({ ...data, expenses: data.expenses.filter((e) => e.id !== expense.id) });
                      if (editing === expense.id) reset();
                    }}
                  >
                    {t("Usuń")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="salary-assumptions">
          {t(
            "Lista jest zapisana w adresie strony i lokalnie w tej przeglądarce. Udostępniony link to kopia rozliczenia, bez wspólnej edycji na żywo. Używaj pseudonimów zamiast danych wrażliwych.",
          )}
        </p>
        <button
          type="button"
          onClick={async () => {
            flushUrlUpdates();
            const url = new URL(window.location.href);
            url.searchParams.set("bills", JSON.stringify(data));
            try {
              await navigator.clipboard.writeText(url.href);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
        >
          {t(copied ? "Skopiowano" : "Kopiuj link")}
        </button>
      </section>
    </>
  );
}
