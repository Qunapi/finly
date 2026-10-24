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
  "Rezerwa awaryjna · 100 000 zł": {
    en: "Emergency reserve · 100 000 PLN",
    ru: "Резерв на непредвиденные расходы · 100 000 PLN",
  },
  "Rezerwa awaryjna": { en: "Emergency reserve", ru: "Резерв на непредвиденные расходы" },
  "Opcjonalna poduszka finansowa, domyślnie wyłączona. Zwiększa potrzebną gotówkę, nie cenę zakupu ani kwotę kredytu.":
    {
      en: "Optional financial cushion, off by default. Adds to cash needed, not the purchase price or loan amount.",
      ru: "Дополнительная финансовая подушка, по умолчанию выключена. Увеличивает необходимые средства, а не цену покупки или кредит.",
    },
  "Opłaty stałe · 7 250 zł": { en: "Combined fixed fees · 7 250 PLN", ru: "Фиксированные расходы · 7 250 PLN" },
  "Notariusz, wypisy i sąd: 5 000 zł; inspekcja: 1 500 zł; wycena: 750 zł. Łącznie 7 250 zł.": {
    en: "Notary, copies and court: 5 000 PLN; inspection: 1 500 PLN; valuation: 750 PLN. Total: 7 250 PLN.",
    ru: "Нотариус, копии и суд: 5 000 PLN; проверка: 1 500 PLN; оценка: 750 PLN. Всего 7 250 PLN.",
  },
  "Pośrednik · 3% łącznie, w tym VAT 23%": {
    en: "Agent · 3% total, including 23% VAT",
    ru: "Агент · 3% всего, включая НДС 23%",
  },
  "Notariusz, wypisy i sąd · 5 000 zł": {
    en: "Notary, deed copies and court · 5 000 PLN",
    ru: "Нотариус, копии и суд · 5 000 PLN",
  },
  "Inspekcja techniczna · 1 500 zł": { en: "Technical inspection · 1 500 PLN", ru: "Техническая проверка · 1 500 PLN" },
  "Wycena bankowa · 750 zł": { en: "Bank valuation · 750 PLN", ru: "Оценка для банка · 750 PLN" },
  "Prowizja banku · 2% kwoty kredytu": { en: "Bank commission · 2% of loan", ru: "Комиссия банка · 2% кредита" },
  "3% zawiera VAT: 2,439% ceny netto + 0,561% ceny VAT. VAT w prowizji: {vat}. Nie doliczamy go ponownie.": {
    en: "The 3% includes VAT: 2.439% of the price net + 0.561% VAT. VAT included in the fee: {vat}. It is not added again.",
    ru: "В 3% уже включён НДС: 2,439% стоимости нетто + 0,561% НДС. НДС в комиссии: {vat}. Повторно не начисляется.",
  },
  "Szacunek dla rynku wtórnego. Wszystkie koszty włączone domyślnie; odznacz PCC przy zwolnieniu. Stałe założenia budżetowe, nie indywidualna oferta. Koszty płatne z własnych środków, poza kwotą kredytu.":
    {
      en: "Resale-market estimate. All costs are enabled by default; untick PCC if exempt. Fixed budgeting assumptions, not an individual quote. Costs are paid upfront, separately from the loan.",
      ru: "Оценка для вторичного рынка. Все расходы включены по умолчанию; отключите PCC при освобождении. Фиксированные ориентиры для бюджета, не индивидуальное предложение. Расходы оплачиваются своими средствами сверх кредита.",
    },
  "Koszty zakupu mieszkania": { en: "Apartment purchase costs", ru: "Расходы на покупку квартиры" },
  "Szacunek dla rynku wtórnego. Wszystkie koszty włączone domyślnie; odznacz PCC przy zwolnieniu. Opłaty bankowe i kwoty stałe są założeniami do edycji. Koszty płatne z własnych środków, poza kwotą kredytu.":
    {
      en: "Resale-market estimate. All costs are enabled by default; untick PCC if exempt. Bank fees and fixed amounts are editable assumptions. Costs are paid upfront, separately from the loan.",
      ru: "Оценка для вторичного рынка. Все расходы включены по умолчанию; отключите PCC при освобождении. Комиссии банка и фиксированные суммы можно изменить. Расходы оплачиваются своими средствами сверх кредита.",
    },
  "Uwzględnione koszty": { en: "Included costs", ru: "Учтённые расходы" },
  "Pośrednik · 3% ceny": { en: "Agent · 3% of price", ru: "Агент · 3% стоимости" },
  "VAT · 23% prowizji pośrednika": { en: "VAT · 23% of agent fee", ru: "НДС · 23% комиссии агента" },
  "PCC · 2% wartości nieruchomości": { en: "PCC · 2% of property value", ru: "PCC · 2% стоимости недвижимости" },
  "Notariusz, wypisy i opłaty sądowe": {
    en: "Notary, deed copies and court fees",
    ru: "Нотариус, копии и судебные сборы",
  },
  "Inspekcja techniczna": { en: "Technical inspection", ru: "Техническая проверка" },
  "Wycena bankowa": { en: "Bank valuation", ru: "Оценка для банка" },
  "Prowizja banku": { en: "Mortgage arrangement fee", ru: "Комиссия банка" },
  "Procent kwoty kredytu": { en: "Percentage of loan amount", ru: "Процент от суммы кредита" },
  "Szacowana opłata": { en: "Estimated fee", ru: "Оценка суммы" },
  "Budżet zakupu": { en: "Purchase budget", ru: "Бюджет покупки" },
  "Dodatkowe koszty zakupu": { en: "Additional purchase costs", ru: "Дополнительные расходы" },
  "Gotówka potrzebna na start": { en: "Total upfront cash needed", ru: "Необходимые собственные средства" },
  "Cena mieszkania + koszty zakupu": { en: "Apartment price + purchase costs", ru: "Стоимость квартиры + расходы" },
  "Nie obejmuje odsetek, ubezpieczenia kredytu, remontu ani wyposażenia. PCC przyjęto od podanej ceny jako przybliżenia wartości rynkowej.":
    {
      en: "Excludes interest, mortgage insurance, renovation and furnishings. PCC uses the entered price as an estimate of market value.",
      ru: "Без процентов, страхования ипотеки, ремонта и мебели. Для PCC указанная цена используется как оценка рыночной стоимости.",
    },
  "Zmień roczne wynagrodzenie": { en: "Adjust annual salary", ru: "Изменить годовую зарплату" },
  "Szybki wybór rocznego wynagrodzenia": { en: "Annual salary presets", ru: "Быстрый выбор годовой зарплаты" },
  "Roczne wynagrodzenie brutto / przychód bez VAT": {
    en: "Annual gross salary / revenue excluding VAT",
    ru: "Годовая зарплата брутто / выручка без НДС",
  },
  "Stałe zarobki przez 12 miesięcy. Wyniki miesięczne to średnia roczna — wypłaty w trakcie roku mogą się różnić po wykorzystaniu ulg i limitów.":
    {
      en: "Constant earnings for 12 months. Monthly results are annual averages — actual pay can change during the year as allowances and limits are exhausted.",
      ru: "Постоянный доход в течение 12 месяцев. Месячные результаты — средние за год: выплаты могут меняться по мере исчерпания льгот и лимитов.",
    },
  "Średnio na rękę / miesiąc": { en: "Average take-home / month", ru: "В среднем на руки / месяц" },
  "PIT · średnio miesięcznie": { en: "Income tax · monthly average", ru: "Подоходный налог · в среднем за месяц" },
  "Na rękę / rok": { en: "Take-home / year", ru: "На руки / год" },
  "Brutto / przychód rocznie": { en: "Annual gross salary / revenue", ru: "Брутто / выручка за год" },
  "Model zakłada 100% kwalifikowanego honorarium przy 50% KUP i prawo do ulgi dla młodych przez cały rok.": {
    en: "The model assumes 100% eligible copyright remuneration when 50% costs are selected, and full-year eligibility for youth tax relief.",
    ru: "При вычете 50% предполагается, что весь доход соответствует условиям авторского вознаграждения; льгота до 26 лет действует весь год.",
  },
  "UoP: PIT 12%/32%, próg 120 000 zł, kwota wolna 30 000 zł, ulga dla młodych do 85 528 zł, limit składek emerytalno-rentowych 282 600 zł. Bez 50% KUP: koszty 3 000 zł rocznie. B2B: pełny rok działalności, standardowy ZUS, bez chorobowego i kosztów; składka zdrowotna po rozliczeniu rocznym. Założenia na 2026 r.; inne dochody i ulgi nie są uwzględniane.":
    {
      en: "Employment: 12%/32% income tax, 120 000 PLN bracket, 30 000 PLN tax-free allowance, youth exemption up to 85 528 PLN, pension/disability contribution base capped at 282 600 PLN. Without 50% copyright costs: standard costs of 3 000 PLN/year. B2B: full-year business, standard ZUS, no sickness insurance or expenses; health contributions after annual reconciliation. 2026 assumptions; other income and reliefs are excluded.",
      ru: "Трудовой договор: налог 12%/32%, порог 120 000 PLN, необлагаемая сумма 30 000 PLN, льгота до 26 лет до 85 528 PLN, предельная база пенсионных взносов 282 600 PLN. Без авторского вычета 50%: стандартные расходы 3 000 PLN/год. B2B: деятельность весь год, обычный ZUS, без страхования по болезни и расходов; медицинские взносы после годового перерасчёта. Условия 2026 года; другие доходы и льготы не учтены.",
    },
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
