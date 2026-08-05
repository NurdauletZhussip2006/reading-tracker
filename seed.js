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
  const readerIds = createdUsers.filter((u) => u.role === 'reader').map((u) => u._id);

  console.log(`Seeding ${books.length} books...`);
  const createdBooks = await Book.insertMany(books);

  console.log('Seeding reading logs...');
  const readingLogs = [];
  const today = new Date(2026, 6, 1);

  createdBooks.forEach((book, index) => {
    const sessionsForThisBook = 2 + (index % 4);
    let cumulativePages = 0;

    for (let s = 0; s < sessionsForThisBook; s++) {
      const pagesThisSession = Math.min(
        20 + ((index + s) % 5) * 15,
        book.pages - cumulativePages
      );
      if (pagesThisSession <= 0) break;

      cumulativePages += pagesThisSession;
      const daysAgo = (index * 3 + s * 5) % 180;
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - daysAgo);

      readingLogs.push({
        userId: readerIds[(index + s) % readerIds.length],
        bookId: book._id,
        date: logDate,
        pagesRead: pagesThisSession,
        minutes: 15 + ((index + s) % 6) * 10,
        genre: book.genres[0] || null,
        rating: (index + s) % 5 === 0 ? null : ((index + s) % 5) + 1,
        completionPercent: Math.round((cumulativePages / book.pages) * 100),
      });
    }
  });

  await ReadingLog.insertMany(readingLogs);

  console.log('Seeding reviews...');
  const reviewTexts = [
    'A genuinely gripping read from start to finish.',
    'Dense in places, but deeply rewarding.',
    'One of my favorites — highly recommend.',
    'Solid, though the pacing dragged a little in the middle.',
    'Changed how I think about the subject entirely.',
    'A classic for a reason.',
    'Took me a while to get into, but stuck with me after finishing.',
  ];
  const reviews = createdBooks
    .filter((_, index) => index % 2 === 0)
    .map((book, i) => ({
      userId: readerIds[i % readerIds.length],
      bookId: book._id,
      rating: (i % 5) + 1,
      text: reviewTexts[i % reviewTexts.length],
    }));
  await Review.insertMany(reviews);

  console.log('Seeding shelves...');
  const shelves = [
    { name: 'Kazakh Literature', bookIds: createdBooks.slice(0, 10).map((b) => b._id) },
    { name: 'English Classics', bookIds: createdBooks.slice(10, 20).map((b) => b._id) },
    { name: 'Russian Literature', bookIds: createdBooks.slice(20, 30).map((b) => b._id) },
    { name: 'Business & Self-Improvement', bookIds: createdBooks.slice(30, 40).map((b) => b._id) },
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