import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

export type Person = { id: string; name: string };
export type Expense = { id: string; description: string; cents: number; payer: string; participants: string[] };
export type SharedExpenses = { people: Person[]; expenses: Expense[] };
export const emptySharedExpenses: SharedExpenses = { people: [], expenses: [] };

export function encodeSharedExpenses(data: SharedExpenses): string {
  return "1." + compressToEncodedURIComponent(JSON.stringify(data));
}

export function parseSharedExpenses(value: string | null): SharedExpenses {
  try {
    const json = value?.startsWith("1.") ? decompressFromEncodedURIComponent(value.slice(2)) : value;
    const data = JSON.parse(json ?? "null");
    if (!data || !Array.isArray(data.people) || !Array.isArray(data.expenses)) return emptySharedExpenses;
    const ids = new Set<string>();
    if (data.people.length > 100 || data.expenses.length > 1000) return emptySharedExpenses;
    for (const p of data.people) {
      if (
        !p ||
        typeof p.id !== "string" ||
        !p.id ||
        ids.has(p.id) ||
        typeof p.name !== "string" ||
        !p.name.trim() ||
        p.name.length > 80
      )
        return emptySharedExpenses;
      ids.add(p.id);
    }
    const expenses = new Set<string>();
    for (const e of data.expenses) {
      if (
        !e ||
        typeof e.id !== "string" ||
        expenses.has(e.id) ||
        typeof e.description !== "string" ||
        !e.description.trim() ||
        e.description.length > 200 ||
        !Number.isSafeInteger(e.cents) ||
        e.cents <= 0 ||
        e.cents > 100000000000 ||
        !ids.has(e.payer) ||
        !Array.isArray(e.participants) ||
        !e.participants.length ||
        new Set(e.participants).size !== e.participants.length ||
        e.participants.some((id: string) => !ids.has(id))
      )
        return emptySharedExpenses;
      expenses.add(e.id);
    }
    return data;
  } catch {
    return emptySharedExpenses;
  }
}

export function settleExpenses(data: SharedExpenses) {
  const balances = data.people.map((p) => ({ ...p, paid: 0, share: 0, balance: 0 }));
  const byId = new Map(balances.map((p) => [p.id, p]));
  for (const expense of data.expenses) {
    byId.get(expense.payer)!.paid += expense.cents;
    // Allocate remainder cents in stable participant order; never lose a cent.
    const share = Math.floor(expense.cents / expense.participants.length);
    expense.participants.forEach((id, index) => {
      byId.get(id)!.share += share + (index < expense.cents % expense.participants.length ? 1 : 0);
    });
  }
  balances.forEach((p) => {
    p.balance = p.paid - p.share;
  });
  const creditors = balances.filter((p) => p.balance > 0).map((p) => ({ id: p.id, remaining: p.balance }));
  const debtors = balances.filter((p) => p.balance < 0).map((p) => ({ id: p.id, remaining: -p.balance }));
  const transfers: { from: string; to: string; cents: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const cents = Math.min(debtors[i].remaining, creditors[j].remaining);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, cents });
    debtors[i].remaining -= cents;
    creditors[j].remaining -= cents;
    if (!debtors[i].remaining) i++;
    if (!creditors[j].remaining) j++;
  }
  return { balances, transfers, total: data.expenses.reduce((sum, e) => sum + e.cents, 0) };
}

export const sharedExpensesStorageKey = "finly-shared-expenses";

export function restoreSharedExpenses(search: string, storage: () => Pick<Storage, "getItem">): SharedExpenses {
  const params = new URLSearchParams(search);
  // An explicit URL snapshot, including an empty one, overrides saved data.
  if (params.has("bills")) return parseSharedExpenses(params.get("bills"));
  try {
    return parseSharedExpenses(storage().getItem(sharedExpensesStorageKey));
  } catch {
    return emptySharedExpenses;
  }
}

export function saveSharedExpenses(data: SharedExpenses, storage: () => Pick<Storage, "setItem">): void {
  try {
    storage().setItem(sharedExpensesStorageKey, JSON.stringify(data));
  } catch {
    // Private browsing, blocked storage, or quota errors must not interrupt editing.
  }
}
