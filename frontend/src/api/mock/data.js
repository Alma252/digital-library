// داده ساختگی. شکل همه چیز دقیقاً مطابق docs/api-contract.md (نسخه ۱.۲) است.
export const users = [
  {
    id: 1,
    username: "admin",
    email: "admin@example.com",
    password: "admin1234",
    role: "admin",
  },
  {
    id: 2,
    username: "librarian",
    email: "librarian@example.com",
    password: "lib12345",
    role: "librarian",
  },
  {
    id: 3,
    username: "user",
    email: "user@example.com",
    password: "user1234",
    role: "user",
  },
];

export const categories = [
  { id: 1, name: "ادبیات" },
  { id: 2, name: "تاریخ" },
  { id: 3, name: "علوم کامپیوتر" },
  { id: 4, name: "فلسفه" },
  { id: 5, name: "علوم پایه" },
];

export const authors = [
  { id: 1, name: "سارا محمدی" },
  { id: 2, name: "علی رضایی" },
  { id: 3, name: "مریم کریمی" },
  { id: 4, name: "حسین احمدی" },
  { id: 5, name: "نگار صادقی" },
  { id: 6, name: "Daniel Brooks" },
];

const catById = (id) => categories.find((c) => c.id === id);
const authorsByIds = (ids) => ids.map((id) => authors.find((a) => a.id === id));

// access_policy: public = همه، members = فقط اعضای واردشده، restricted = فقط کتابدار/مدیر
const base = [
  ["تاریخ معاصر ایران", [2], [1], 1395, "shamsi", "fa", "pdf", "public"],
  [
    "مبانی مهندسی نرم‌افزار",
    [3],
    [2, 3],
    1400,
    "shamsi",
    "fa",
    "pdf",
    "public",
  ],
  ["فلسفه علم برای همه", [4, 5], [4], 1398, "shamsi", "fa", "epub", "public"],
  [
    "پایگاه داده‌ها: از صفر تا صد",
    [3],
    [3],
    1401,
    "shamsi",
    "fa",
    "pdf",
    "members",
  ],
  [
    "شعر و جامعه در قرن بیستم",
    [1],
    [5],
    1392,
    "shamsi",
    "fa",
    "epub",
    "public",
  ],
  [
    "Software Engineering Fundamentals",
    [3],
    [6],
    2019,
    "gregorian",
    "en",
    "pdf",
    "public",
  ],
  ["ریاضیات گسسته", [5, 3], [2], 1399, "shamsi", "fa", "pdf", "members"],
  [
    "سفرنامه‌های دوره قاجار",
    [2],
    [1, 4],
    1385,
    "shamsi",
    "fa",
    "pdf",
    "public",
  ],
  [
    "Learning React Step by Step",
    [3],
    [6],
    2022,
    "gregorian",
    "en",
    "epub",
    "public",
  ],
  ["مقدمه‌ای بر منطق", [4], [5], 1394, "shamsi", "fa", "pdf", "restricted"],
  ["فیزیک عمومی ۱", [5], [3, 4], 1397, "shamsi", "fa", "pdf", "public"],
  ["نقد ادبی معاصر", [1], [1], 1396, "shamsi", "fa", "epub", "members"],
  ["شبکه‌های کامپیوتری", [3], [2], 1402, "shamsi", "fa", "pdf", "public"],
];

function build(index) {
  const [
    title,
    categoryIds,
    authorIds,
    year,
    calendar,
    language,
    fileType,
    policy,
  ] = base[index % base.length];
  const round = Math.floor(index / base.length);
  const n = index + 1;
  const status =
    n === 9 || n === 18 ? "draft" : n === 23 ? "archived" : "published";

  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: round === 0 ? title : `${title} (ویرایش ${round + 1})`,
    authors: authorsByIds(authorIds),
    publisher: "انتشارات نمونه",
    publication_year: year + round,
    calendar,
    language,
    categories: categoryIds.map(catById),
    keywords: "کلیدواژه، نمونه",
    description: "خلاصه‌ای از محتوای این منبع. این متن ساختگی است.",
    isbn: "",
    status,
    access_policy: policy,
    files: [
      {
        id: n,
        original_name: `book-${n}.${fileType}`,
        file_type: fileType,
        size: 1048576 * (1 + (n % 7)),
        processing_status: "ready",
      },
    ],
    file_type: fileType,
    created_at: "2026-11-20T10:30:00Z",
    updated_at: "2026-11-20T10:30:00Z",
  };
}

// ۲۶ منبع (۳ صفحه با page_size پیش‌فرض ۱۰)
export const resources = Array.from({ length: 26 }, (_, i) => build(i));
