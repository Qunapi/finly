export type Language = "pl" | "en" | "ru";
export function isLanguage(value: unknown): value is Language {
  return value === "pl" || value === "en" || value === "ru";
}
export function chooseLanguage(query: string | null, saved: string | null, preferred: readonly string[]): Language {
  if (isLanguage(query)) return query;
  if (isLanguage(saved)) return saved;
  for (const locale of preferred) {
    const language = locale.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(language)) return language;
  }
  return "en";
}

const translations: Record<string, { en: string; ru: string }> = {
  "Nadpłata w pierwszym miesiącu": { en: "First-month overpayment", ru: "Досрочный платёж в первый месяц" },
  "Stała płatność miesięczna": { en: "Fixed total monthly payment", ru: "Фиксированная общая сумма в месяц" },
  "Stała suma raty i nadpłaty. Gdy rata maleje, nadpłata rośnie. Obie strategie dają ten sam termin spłaty i odsetki; ostatnia płatność może być niższa.":
    {
      en: "The installment and overpayment add up to a fixed monthly total. As the installment falls, the overpayment grows. Both strategies give the same payoff date and interest; the final payment may be smaller.",
      ru: "Сумма платежа и досрочного погашения фиксирована. Когда платёж уменьшается, досрочное погашение растёт. Обе стратегии дают одинаковый срок и проценты; последний платёж может быть меньше.",
    },
  "Uwzględnij nadpłaty": { en: "Enable overpayments", ru: "Учитывать досрочные платежи" },
  "Szybki wybór nadpłaty": { en: "Overpayment presets", ru: "Быстрый выбор досрочного платежа" },
  Język: {
    en: "Language",
    ru: "Язык",
  },
  "POLSKA · 2026": {
    en: "POLAND · 2026",
    ru: "ПОЛЬША · 2026",
  },
  Kalkulatory: {
    en: "Calculators",
    ru: "Калькуляторы",
  },
  Wynagrodzenie: {
    en: "Salary",
    ru: "Зарплата",
  },
  "Kredyt hipoteczny": {
    en: "Mortgage",
    ru: "Ипотека",
  },
  "KALKULATOR WYNAGRODZEŃ": {
    en: "SALARY CALCULATOR",
    ru: "КАЛЬКУЛЯТОР ЗАРПЛАТЫ",
  },
  "Ile zostaje": {
    en: "How much lands",
    ru: "Сколько остаётся",
  },
  "na Twoim koncie?": {
    en: "in your account?",
    ru: "на вашем счёте?",
  },
  "Porównaj umowę o pracę z kontraktem B2B na ryczałcie 12%.": {
    en: "Compare employment with a B2B contract taxed at a flat 12% revenue rate.",
    ru: "Сравните трудовой договор и B2B с налогом 12% от выручки.",
  },
  "Porównanie wynagrodzeń": {
    en: "Salary comparison",
    ru: "Сравнение зарплат",
  },
  "Miesięczne wynagrodzenie brutto / faktura netto": {
    en: "Monthly gross salary / invoice amount excluding VAT",
    ru: "Зарплата брутто в месяц / сумма счёта без НДС",
  },
  "Szybki wybór wynagrodzenia": {
    en: "Salary presets",
    ru: "Быстрый выбор зарплаты",
  },
  "Ulga dla młodych (do 26 lat)": {
    en: "Youth tax relief (under 26)",
    ru: "Налоговая льгота до 26 лет",
  },
  "50% KUP · prawa autorskie": {
    en: "50% deductible costs · copyright",
    ru: "50% вычета расходов · авторские права",
  },
  "Dla kwalifikującego się honorarium; limit 120 000 zł rocznie wspólny z ulgą dla młodych.": {
    en: "For eligible copyright income; annual limit of 120 000 PLN shared with youth tax relief.",
    ru: "Для соответствующего авторского дохода; годовой лимит 120 000 PLN общий с льготой до 26 лет.",
  },
  "Przy tej kwocie więcej zostaje na": {
    en: "At this amount, take-home pay is higher with",
    ru: "При этой сумме доход на руки выше с",
  },
  "różnica to": {
    en: "the difference is",
    ru: "разница составляет",
  },
  "miesięcznie.": {
    en: "per month.",
    ru: "в месяц.",
  },
  "Umowa o pracę": {
    en: "Employment contract",
    ru: "Трудовой договор",
  },
  "na rękę / miesiąc": {
    en: "take-home / month",
    ru: "на руки / месяц",
  },
  "Składki społeczne": {
    en: "Social contributions",
    ru: "Социальные взносы",
  },
  "Składka zdrowotna": {
    en: "Health contribution",
    ru: "Медицинский взнос",
  },
  "PPK pracownika · 2%": {
    en: "Employee PPK · 2%",
    ru: "PPK работника · 2%",
  },
  "Zaliczka na PIT": {
    en: "Income tax advance",
    ru: "Аванс по подоходному налогу",
  },
  "Taka sama kwota netto na B2B:": {
    en: "B2B invoice for the same take-home pay:",
    ru: "Сумма счёта B2B для такого же дохода на руки:",
  },
  "/ mies.": {
    en: "/ month",
    ru: "/ месяц",
  },
  "B2B · ryczałt 12%": {
    en: "B2B · 12% revenue tax",
    ru: "B2B · налог 12% с выручки",
  },
  "Pensja na UoP z takim samym netto:": {
    en: "Employment salary for the same take-home pay:",
    ru: "Зарплата по трудовому договору с таким же доходом на руки:",
  },
  "brutto / mies.": {
    en: "gross / month",
    ru: "брутто / месяц",
  },
  "ZUS społeczny · bez chorobowego": {
    en: "ZUS social · excluding sickness insurance",
    ru: "Социальный ZUS · без страхования по болезни",
  },
  "Ryczałt 12%": {
    en: "12% revenue tax",
    ru: "Налог 12% с выручки",
  },
  "KALKULATOR KREDYTU": {
    en: "MORTGAGE CALCULATOR",
    ru: "ИПОТЕЧНЫЙ КАЛЬКУЛЯТОР",
  },
  "Sprawdź ratę": {
    en: "Calculate your",
    ru: "Рассчитайте платёж",
  },
  "swojego kredytu.": {
    en: "mortgage payment.",
    ru: "по ипотеке.",
  },
  "Zobacz miesięczną ratę i całkowity koszt kredytu.": {
    en: "See your monthly payment and total mortgage cost.",
    ru: "Узнайте ежемесячный платёж и полную стоимость кредита.",
  },
  "Kalkulator kredytu hipotecznego": {
    en: "Mortgage calculator",
    ru: "Ипотечный калькулятор",
  },
  "Cena mieszkania": {
    en: "Apartment price",
    ru: "Стоимость квартиры",
  },
  "Szybki wybór ceny mieszkania": {
    en: "Apartment price presets",
    ru: "Быстрый выбор стоимости квартиры",
  },
  "Wkład własny": {
    en: "Down payment",
    ru: "Первоначальный взнос",
  },
  "Szybki wybór wkładu własnego": {
    en: "Down payment presets",
    ru: "Быстрый выбор первоначального взноса",
  },
  "Wkład własny w złotych": {
    en: "Down payment in PLN",
    ru: "Первоначальный взнос в PLN",
  },
  "Kwota kredytu": {
    en: "Loan amount",
    ru: "Сумма кредита",
  },
  "Oprocentowanie roczne": {
    en: "Annual interest rate",
    ru: "Годовая процентная ставка",
  },
  "Okres spłaty": {
    en: "Repayment term",
    ru: "Срок погашения",
  },
  lat: {
    en: "years",
    ru: "лет",
  },
  "Nadpłata miesięczna": {
    en: "Monthly overpayment",
    ru: "Ежемесячное досрочное погашение",
  },
  "Cel nadpłaty": {
    en: "Overpayment strategy",
    ru: "Цель досрочного погашения",
  },
  "Zmniejszenie raty": {
    en: "Reduce monthly payments",
    ru: "Уменьшить ежемесячный платёж",
  },
  "Skrócenie okresu spłaty": {
    en: "Shorten repayment term",
    ru: "Сократить срок погашения",
  },
  "RATA MIESIĘCZNA": {
    en: "MONTHLY PAYMENT",
    ru: "ЕЖЕМЕСЯЧНЫЙ ПЛАТЁЖ",
  },
  Kapitał: {
    en: "Principal",
    ru: "Основной долг",
  },
  odsetki: {
    en: "interest",
    ru: "проценты",
  },
  "Pożyczony kapitał": {
    en: "Borrowed principal",
    ru: "Сумма основного долга",
  },
  "Łączne odsetki": {
    en: "Total interest",
    ru: "Всего процентов",
  },
  "Całkowita kwota do spłaty": {
    en: "Total repayment",
    ru: "Общая сумма к погашению",
  },
  "Oszczędność na odsetkach": {
    en: "Interest savings",
    ru: "Экономия на процентах",
  },
  "Spłata w {months} mies. · Rata powyżej dotyczy pierwszego miesiąca, bez nadpłaty. Nadpłata na koniec każdego miesiąca; oprocentowanie stałe w symulacji.":
    {
      en: "Repaid in {months} months. The payment above is for the first month, excluding overpayment. Overpayments are applied at each month-end; the simulation assumes a constant interest rate.",
      ru: "Погашение за {months} мес. Выше указан платёж за первый месяц без досрочного погашения. Досрочные платежи в конце каждого месяца; ставка в расчёте постоянная.",
    },
  "Szacunek dla rat równych. Rzeczywista oferta banku może się różnić.": {
    en: "Estimate for equal installments. Actual bank offers may differ.",
    ru: "Расчёт для аннуитетных платежей. Реальные условия банка могут отличаться.",
  },
  "Harmonogram spłaty": {
    en: "Payment schedule",
    ru: "График платежей",
  },
  "Łączny okres spłaty:": {
    en: "Total repayment term:",
    ru: "Общий срок погашения:",
  },
  "mies.": {
    en: "months",
    ru: "мес.",
  },
  "{years} lat i {months} mies.": {
    en: "{years} years and {months} months",
    ru: "{years} г. и {months} мес.",
  },
  "Tabela rat — przewijaj, aby zobaczyć wszystkie płatności": {
    en: "Payment table — scroll to see all payments",
    ru: "Таблица платежей — прокрутите, чтобы увидеть все платежи",
  },
  "Raty i nadpłaty miesięczne w PLN": {
    en: "Monthly installments and overpayments in PLN",
    ru: "Ежемесячные платежи и досрочное погашение в PLN",
  },
  Miesiąc: {
    en: "Month",
    ru: "Месяц",
  },
  Rata: {
    en: "Installment",
    ru: "Платёж",
  },
  Odsetki: {
    en: "Interest",
    ru: "Проценты",
  },
  "Kapitał z nadpłatą": {
    en: "Principal incl. overpayment",
    ru: "Основной долг с досрочным погашением",
  },
  Nadpłata: {
    en: "Overpayment",
    ru: "Досрочный платёж",
  },
  "Łączna płatność": {
    en: "Total payment",
    ru: "Итого платёж",
  },
  Pozostało: {
    en: "Remaining balance",
    ru: "Остаток долга",
  },
  "Brak rat do spłaty.": {
    en: "No payments remaining.",
    ru: "Платежей не осталось.",
  },
  "Szacunek dla Polski · 2026": {
    en: "Estimate for Poland · 2026",
    ru: "Расчёт для Польши · 2026",
  },
  "Kursy z {date}": {
    en: "Exchange rates from {date}",
    ru: "Курсы от {date}",
  },
  "B2B bez chorobowego i kosztów": {
    en: "B2B excludes sickness insurance and expenses",
    ru: "B2B без страхования по болезни и расходов",
  },
  "PPK pracodawcy 1,5%.": {
    en: "Employer PPK 1.5%.",
    ru: "PPK работодателя 1,5%.",
  },
  "bez PPK.": {
    en: "without PPK.",
    ru: "без PPK.",
  },
  "Kursy walut niedostępne": {
    en: "Exchange rates unavailable",
    ru: "Курсы валют недоступны",
  },
  "Pobieram kursy walut": {
    en: "Loading exchange rates",
    ru: "Загрузка курсов валют",
  },
  "Pobieram kursy…": {
    en: "Loading rates…",
    ru: "Загрузка курсов…",
  },
  "Rata nie obejmuje prowizji ani ubezpieczeń.": {
    en: "Payment excludes fees and insurance.",
    ru: "Платёж не включает комиссии и страхование.",
  },
  "Aplikacja Finly": {
    en: "Finly app",
    ru: "Приложение Finly",
  },
  "Tryb offline niedostępny. Spróbuj ponownie po połączeniu z internetem.": {
    en: "Offline mode is unavailable. Try again when connected to the internet.",
    ru: "Автономный режим недоступен. Повторите попытку при подключении к интернету.",
  },
  "iPhone/iPad: w Safari wybierz Udostępnij → Do ekranu początkowego. Android/komputer: w menu przeglądarki wybierz Zainstaluj aplikację.":
    {
      en: "iPhone/iPad: in Safari choose Share → Add to Home Screen. Android/desktop: choose Install app in the browser menu.",
      ru: "iPhone/iPad: в Safari выберите Поделиться → На экран «Домой». Android/компьютер: выберите «Установить приложение» в меню браузера.",
    },
  "Zainstaluj aplikację": {
    en: "Install app",
    ru: "Установить приложение",
  },
  "Tryb offline jest jeszcze przygotowywany. Spróbuj za chwilę.": {
    en: "Offline mode is still being prepared. Try again shortly.",
    ru: "Автономный режим ещё готовится. Повторите попытку чуть позже.",
  },
  "Sprawdzono aktualizacje. Nowa wersja pojawi się tutaj, gdy będzie gotowa.": {
    en: "Checked for updates. A new version will appear here when ready.",
    ru: "Проверка обновлений выполнена. Новая версия появится здесь, когда будет готова.",
  },
  "Nie można sprawdzić aktualizacji. Sprawdź połączenie z internetem.": {
    en: "Unable to check for updates. Check your internet connection.",
    ru: "Не удалось проверить обновления. Проверьте подключение к интернету.",
  },
  "Sprawdź aktualizacje": {
    en: "Check for updates",
    ru: "Проверить обновления",
  },
  "Nowa wersja Finly jest gotowa.": {
    en: "A new version of Finly is ready.",
    ru: "Новая версия Finly готова.",
  },
  "Aktualizuj teraz": {
    en: "Update now",
    ru: "Обновить сейчас",
  },
  "Finly — kalkulatory finansowe": {
    en: "Finly — financial calculators",
    ru: "Finly — финансовые калькуляторы",
  },
};
export function translate(language: Language, text: string, values: Record<string, string | number> = {}): string {
  const translated = language === "pl" ? text : (translations[text]?.[language] ?? text);
  return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
