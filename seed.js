require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Book = require('./models/Book');
const ReadingLog = require('./models/ReadingLog');
const Review = require('./models/Review');
const Shelf = require('./models/Shelf');

const books = [
  { isbn: '9786010300124', title: 'Абай жолы', authors: ['Мұхтар Әуезов'], genres: ['Historical Fiction', 'Classics', 'Kazakh Literature'], pages: 640 },
  { isbn: '9786010302159', title: 'Көшпенділер', authors: ['Ілияс Есенберлин'], genres: ['Historical Fiction', 'Kazakh Literature'], pages: 560 },
  { isbn: '9786010304122', title: 'Менің атым Қожа', authors: ['Бердібек Соқпақбаев'], genres: ['Fiction', "Children's Literature"], pages: 160 },
  { isbn: '9786010301117', title: 'Қан мен тер', authors: ['Әбдіжәміл Нұрпейісов'], genres: ['Historical Fiction', 'Classics'], pages: 480 },
  { isbn: '9786010305146', title: 'Ботагөз', authors: ['Сәбит Мұқанов'], genres: ['Novel', 'Kazakh Literature'], pages: 430 },
  { isbn: '9786010303180', title: 'Ұшқан ұя', authors: ['Бауыржан Момышұлы'], genres: ['Autobiographical Novel', 'Memoir'], pages: 280 },
  { isbn: '9786010307112', title: 'Ақбілек', authors: ['Жүсіпбек Аймауытов'], genres: ['Novel', 'Classics'], pages: 220 },
  { isbn: '9786010308149', title: 'Ұлпан', authors: ['Ғабит Мүсірепов'], genres: ['Historical Novel', 'Classics'], pages: 320 },
  { isbn: '9785170984122', title: 'И дольше века длится день', authors: ['Чингиз Айтматов'], genres: ['Philosophical Fiction', 'Classics'], pages: 352 },
  { isbn: '9786010308102', title: 'Қазақ хрестоматиясы', authors: ['Ыбырай Алтынсарин'], genres: ['Educational', 'Classics'], pages: 192 },

  { isbn: '9780061120084', title: 'To Kill a Mockingbird', authors: ['Harper Lee'], genres: ['Classic', 'Fiction', 'Historical Fiction'], pages: 281 },
  { isbn: '9780451524935', title: '1984', authors: ['George Orwell'], genres: ['Dystopian', 'Sci-Fi', 'Classics'], pages: 328 },
  { isbn: '9780743273565', title: 'The Great Gatsby', authors: ['F. Scott Fitzgerald'], genres: ['Classic', 'Fiction'], pages: 180 },
  { isbn: '9780141439518', title: 'Pride and Prejudice', authors: ['Jane Austen'], genres: ['Classic', 'Romance'], pages: 432 },
  { isbn: '9780316769488', title: 'The Catcher in the Rye', authors: ['J.D. Salinger'], genres: ['Classic', 'Coming-of-age'], pages: 234 },
  { isbn: '9780547928227', title: 'The Hobbit', authors: ['J.R.R. Tolkien'], genres: ['Fantasy', 'Classics'], pages: 310 },
  { isbn: '9781451673319', title: 'Fahrenheit 451', authors: ['Ray Bradbury'], genres: ['Dystopian', 'Sci-Fi'], pages: 249 },
  { isbn: '9781503280786', title: 'Moby-Dick', authors: ['Herman Melville'], genres: ['Classic', 'Adventure'], pages: 635 },
  { isbn: '9780060850524', title: 'Brave New World', authors: ['Aldous Huxley'], genres: ['Dystopian', 'Sci-Fi'], pages: 288 },
  { isbn: '9780399501487', title: 'Lord of the Flies', authors: ['William Golding'], genres: ['Classic', 'Fiction'], pages: 224 },

  { isbn: '9780140447934', title: 'Война и мир', authors: ['Лев Толстой'], genres: ['Classic', 'Historical Fiction'], pages: 1225 },
  { isbn: '9780143058144', title: 'Преступление и наказание', authors: ['Фёдор Достоевский'], genres: ['Classic', 'Psychological Fiction'], pages: 671 },
  { isbn: '9780141180144', title: 'Мастер и Маргарита', authors: ['Михаил Булгаков'], genres: ['Classic', 'Fantasy', 'Satire'], pages: 384 },
  { isbn: '9780143035008', title: 'Анна Каренина', authors: ['Лев Толстой'], genres: ['Classic', 'Romance', 'Realism'], pages: 864 },
  { isbn: '9780140441475', title: 'Отцы и дети', authors: ['Иван Тургенев'], genres: ['Classic', 'Fiction'], pages: 240 },
  { isbn: '9780374528379', title: 'Братья Карамазовы', authors: ['Фёдор Достоевский'], genres: ['Classic', 'Philosophical Fiction'], pages: 796 },
  { isbn: '9780374529529', title: 'Один день Ивана Денисовича', authors: ['Александр Солженицын'], genres: ['Classic', 'Historical Fiction'], pages: 182 },
  { isbn: '9780140448078', title: 'Мёртвые души', authors: ['Николай Гоголь'], genres: ['Classic', 'Satire'], pages: 432 },
  { isbn: '9780140448108', title: 'Евгений Онегин', authors: ['Александр Пушкин'], genres: ['Classic', 'Poetry', 'Romance'], pages: 240 },
  { isbn: '9780307390950', title: 'Доктор Живаго', authors: ['Борис Пастернак'], genres: ['Classic', 'Historical Fiction'], pages: 592 },

  { isbn: '9780735211292', title: 'Atomic Habits', authors: ['James Clear'], genres: ['Self-Help', 'Personal Development', 'Psychology'], pages: 320 },
  { isbn: '9781612680194', title: 'Rich Dad Poor Dad', authors: ['Robert T. Kiyosaki'], genres: ['Finance', 'Personal Finance', 'Business'], pages: 336 },
  { isbn: '9781982137274', title: 'The 7 Habits of Highly Effective People', authors: ['Stephen R. Covey'], genres: ['Self-Help', 'Business', 'Leadership'], pages: 432 },
  { isbn: '9781585424337', title: 'Think and Grow Rich', authors: ['Napoleon Hill'], genres: ['Self-Help', 'Finance', 'Business'], pages: 320 },
  { isbn: '9781455586691', title: 'Deep Work', authors: ['Cal Newport'], genres: ['Productivity', 'Business', 'Self-Help'], pages: 304 },
  { isbn: '9780671027032', title: 'How to Win Friends and Influence People', authors: ['Dale Carnegie'], genres: ['Self-Help', 'Communication', 'Psychology'], pages: 288 },
  { isbn: '9780307887894', title: 'The Lean Startup', authors: ['Eric Ries'], genres: ['Business', 'Entrepreneurship', 'Management'], pages: 336 },
  { isbn: '9780374533557', title: 'Thinking, Fast and Slow', authors: ['Daniel Kahneman'], genres: ['Psychology', 'Business', 'Behavioral Economics'], pages: 512 },
  { isbn: '9780804139298', title: 'Zero to One', authors: ['Peter Thiel', 'Blake Masters'], genres: ['Business', 'Entrepreneurship', 'Startups'], pages: 224 },
  { isbn: '9780857197689', title: 'The Psychology of Money', authors: ['Morgan Housel'], genres: ['Finance', 'Business', 'Psychology'], pages: 256 },

  { isbn: '9781451648539', title: 'Steve Jobs', authors: ['Walter Isaacson'], genres: ['Biography', 'Business', 'Technology'], pages: 656 },
  { isbn: '9780553296983', title: 'Het Achterhuis', authors: ['Anne Frank'], genres: ['Autobiography', 'Memoir', 'History'], pages: 283 },
  { isbn: '9780316548182', title: 'Long Walk to Freedom', authors: ['Nelson Mandela'], genres: ['Autobiography', 'Memoir', 'History'], pages: 656 },
  { isbn: '9781501135910', title: 'Shoe Dog', authors: ['Phil Knight'], genres: ['Autobiography', 'Memoir', 'Business'], pages: 400 },
  { isbn: '9781524763138', title: 'Becoming', authors: ['Michelle Obama'], genres: ['Autobiography', 'Memoir'], pages: 448 },
  { isbn: '9781982181284', title: 'Elon Musk', authors: ['Walter Isaacson'], genres: ['Biography', 'Business', 'Technology'], pages: 688 },
  { isbn: '9780345350688', title: 'The Autobiography of Malcolm X', authors: ['Malcolm X', 'Alex Haley'], genres: ['Autobiography', 'Memoir', 'History'], pages: 528 },
  { isbn: '9780812988406', title: 'When Breath Becomes Air', authors: ['Paul Kalanithi'], genres: ['Autobiography', 'Memoir', 'Medical'], pages: 228 },
  { isbn: '9780399590504', title: 'Educated', authors: ['Tara Westover'], genres: ['Autobiography', 'Memoir'], pages: 352 },
  { isbn: '9780307388407', title: 'Open', authors: ['Andre Agassi'], genres: ['Autobiography', 'Memoir', 'Sports'], pages: 400 },

  { isbn: '9781400069286', title: 'The Power of Habit', authors: ['Charles Duhigg'], genres: ['Self-Help', 'Business', 'Psychology'], pages: 371 },
  { isbn: '9781250183866', title: 'Extreme Ownership', authors: ['Jocko Willink', 'Leif Babin'], genres: ['Leadership', 'Business', 'Self-Help'], pages: 320 },
  { isbn: '9780307465351', title: 'The 4-Hour Workweek', authors: ['Timothy Ferriss'], genres: ['Business', 'Self-Help', 'Productivity'], pages: 416 },
  { isbn: '9780066620992', title: 'Good to Great', authors: ['Jim Collins'], genres: ['Business', 'Management', 'Leadership'], pages: 320 },
  { isbn: '9780984358106', title: 'The Millionaire Fastlane', authors: ['MJ DeMarco'], genres: ['Finance', 'Business', 'Self-Help'], pages: 320 },
  { isbn: '9780062407801', title: 'Never Split the Difference', authors: ['Chris Voss'], genres: ['Business', 'Negotiation', 'Self-Help'], pages: 288 },
  { isbn: '9781501111112', title: 'Grit', authors: ['Angela Duckworth'], genres: ['Psychology', 'Self-Help', 'Business'], pages: 352 },
  { isbn: '9780593089683', title: 'The Compound Effect', authors: ['Darren Hardy'], genres: ['Self-Help', 'Business', 'Personal Development'], pages: 208 },
];

const testUsers = [
  { email: 'reader@test.com', password: 'ReaderPass1!', role: 'reader' },
  { email: 'reader2@test.com', password: 'ReaderPass2!', role: 'reader' },
  { email: 'librarian@test.com', password: 'LibrarianPass1!', role: 'librarian' },
];

const reviewTexts = [
  'A genuinely gripping read from start to finish.',
  'Dense in places, but deeply rewarding.',
  'One of my favorites — highly recommend.',
  'Solid, though the pacing dragged a little in the middle.',
  'Changed how I think about the subject entirely.',
  'A classic for a reason.',
  'Took me a while to get into, but stuck with me after finishing.',
];

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Book.deleteMany({}),
    ReadingLog.deleteMany({}),
    Review.deleteMany({}),
    Shelf.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log('Seeding users...');
  const createdUsers = await Promise.all(
    testUsers.map(async (u) => {
      const passwordHash = await bcrypt.hash(u.password, 12);
      return User.create({ email: u.email, passwordHash, role: u.role });
    })
  );

  console.log(`Seeding ${books.length} books...`);
  const createdBooks = await Book.insertMany(books);

  console.log('Seeding reading logs...');
  const readingLogs = [];
  const today = new Date();

  const readerUser1 = createdUsers.find((u) => u.email === 'reader@test.com');
  const readerUser2 = createdUsers.find((u) => u.email === 'reader2@test.com');
  const findBookByTitle = (title) => createdBooks.find((b) => b.title === title);

  // --- Reader 1: "power reader" — daily, fast, business & self-improvement ---
  const READER1_GENRE = 'Business & Self-Improvement';
  const READER1_TITLES = [
    'Atomic Habits', 'Rich Dad Poor Dad', 'The 7 Habits of Highly Effective People',
    'Think and Grow Rich', 'Deep Work', 'How to Win Friends and Influence People',
    'The Lean Startup', 'Thinking, Fast and Slow', 'Zero to One', 'The Psychology of Money',
    'Steve Jobs', 'Shoe Dog', 'Elon Musk',
    'The Power of Habit', 'Extreme Ownership', 'The 4-Hour Workweek', 'Good to Great',
    'The Millionaire Fastlane', 'Never Split the Difference', 'Grit', 'The Compound Effect',
  ].map(findBookByTitle);

  // --- Reader 2: weekends-only, slow, long sessions — classics & sci-fi ---
  const READER2_SCIFI_TITLES = ['1984', 'Fahrenheit 451', 'Brave New World'];
  const READER2_HISTORICAL_FICTION_TITLES = ['To Kill a Mockingbird', 'Война и мир'];
  const READER2_CLASSICS_TITLES = [
    'To Kill a Mockingbird', 'The Great Gatsby', 'Pride and Prejudice', 'The Catcher in the Rye',
    'The Hobbit', 'Moby-Dick', 'Lord of the Flies',
    'Война и мир', 'Преступление и наказание', 'Мастер и Маргарита', 'Анна Каренина', 'Отцы и дети',
  ];
  const READER2_TITLES = [...READER2_CLASSICS_TITLES, ...READER2_SCIFI_TITLES].map(findBookByTitle);
  const scifiTitleSet = new Set(READER2_SCIFI_TITLES);
  const historicalFictionTitleSet = new Set(READER2_HISTORICAL_FICTION_TITLES);

  // A few of Reader 1's "business" books are really biographies of business
  // figures — breaking those out into their own genre keeps the chart from
  // being one solid bar.
  const BIOGRAPHY_TITLES = new Set(['Steve Jobs', 'Shoe Dog', 'Elon Musk']);

  [...READER1_TITLES, ...READER2_TITLES].forEach((b, i) => {
    if (!b) throw new Error(`Seed config error: a reader book title didn't match any seeded book (slot ${i})`);
  });

  // Walks backward from 365 days ago to today. On each day that passes
  // isActiveDay, logs one session against whichever book is "current" for
  // this reader, advancing to the next title once the current one is fully
  // read. Once every title in the list has been completed at least once, it
  // wraps around and re-reads from the top — so the reader keeps generating
  // realistic daily/weekly activity for the full year, but the *distinct*
  // completed-book count stays fixed at titles.length no matter how long the
  // year runs on.
  function generateReaderSessions({ userId, titles, genreFor, isActiveDay, sessionMinutes, pagesPerMinute }) {
    const logs = [];
    let bookCursor = 0;
    let cumulativePages = 0;
    const completedBookIds = new Set();

    for (let daysAgo = 364; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      if (!isActiveDay(date)) continue;

      const dayIndex = 364 - daysAgo;
      const book = titles[bookCursor % titles.length];

      const minutes = sessionMinutes(dayIndex);
      const speed = pagesPerMinute(dayIndex);
      const remainingPages = book.pages - cumulativePages;
      const pagesThisSession = Math.max(1, Math.min(Math.round(minutes * speed), remainingPages));

      cumulativePages += pagesThisSession;
      const completionPercent = Math.round((cumulativePages / book.pages) * 100);
      const justCompleted = completionPercent >= 100;

      logs.push({
        userId,
        bookId: book._id,
        date,
        pagesRead: pagesThisSession,
        minutes,
        genre: genreFor(book),
        rating: justCompleted ? 3 + (dayIndex % 3) : null, // rate 3-5 on the session that finishes the book
        completionPercent,
      });

      if (justCompleted) {
        completedBookIds.add(String(book._id));
        bookCursor += 1;
        cumulativePages = 0;
      }
    }

    return { logs, completedCount: completedBookIds.size };
  }

  const reader1Result = generateReaderSessions({
    userId: readerUser1._id,
    titles: READER1_TITLES,
    genreFor: (book) => (BIOGRAPHY_TITLES.has(book.title) ? 'Biography & Memoir' : READER1_GENRE),
    isActiveDay: () => true, // every single day of the week
    sessionMinutes: (i) => 45 + (i % 4) * 5, // 45-60 min
    pagesPerMinute: (i) => 2.0 + (i % 3) * 0.2, // 2.0-2.4 p/min -> fast
  });

  const reader2Result = generateReaderSessions({
    userId: readerUser2._id,
    titles: READER2_TITLES,
    genreFor: (book) => {
      if (scifiTitleSet.has(book.title)) return 'Sci-Fi';
      if (historicalFictionTitleSet.has(book.title)) return 'Historical Fiction';
      return 'Classics';
    },
    isActiveDay: (date) => date.getDay() === 0 || date.getDay() === 6, // weekends only
    sessionMinutes: (i) => 150 + (i % 4) * 20, // 150-210 min -> long sessions
    pagesPerMinute: (i) => 0.4 + (i % 3) * 0.05, // 0.4-0.5 p/min -> slow
  });

  readingLogs.push(...reader1Result.logs, ...reader2Result.logs);
  await ReadingLog.insertMany(readingLogs);
  console.log(`  Reader 1: ${reader1Result.logs.length} sessions, ${reader1Result.completedCount} books completed`);
  console.log(`  Reader 2: ${reader2Result.logs.length} sessions, ${reader2Result.completedCount} books completed`);

  console.log('Seeding reviews...');
  function buildReviews(userId, titles, count) {
    return titles.slice(0, count).map((book, i) => ({
      userId,
      bookId: book._id,
      rating: 3 + (i % 3),
      text: reviewTexts[i % reviewTexts.length],
    }));
  }
  const reviews = [
    ...buildReviews(readerUser1._id, READER1_TITLES, 14),
    ...buildReviews(readerUser2._id, READER2_TITLES, 10),
  ];
  await Review.insertMany(reviews);

  console.log('Seeding shelves...');
  const shelves = [
    { name: 'Kazakh Literature', bookIds: createdBooks.slice(0, 10).map((b) => b._id) },
    { name: 'English Classics', bookIds: createdBooks.slice(10, 20).map((b) => b._id) },
    { name: 'Russian Literature', bookIds: createdBooks.slice(20, 30).map((b) => b._id) },
    { name: 'Business & Self-Improvement', bookIds: createdBooks.slice(30, 40).concat(createdBooks.slice(50, 58)).map((b) => b._id) },
    { name: 'Autobiography & Memoir', bookIds: createdBooks.slice(40, 50).map((b) => b._id) },
  ];
  await Shelf.insertMany(shelves);

  console.log('Seed complete:');
  console.log(`  ${createdUsers.length} users`);
  console.log(`  ${createdBooks.length} books`);
  console.log(`  ${readingLogs.length} reading logs`);
  console.log(`  ${reviews.length} reviews`);
  console.log(`  ${shelves.length} shelves`);
  console.log('');
  console.log('Test credentials:');
  testUsers.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.password}`));

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});