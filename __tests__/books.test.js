process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("DELETE FROM books");
  await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
    VALUES ('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)
  `);
});

afterAll(async () => {
  await db.end();
});

describe("GET /books", () => {
  test("Gets a list of books", async () => {
    const res = await request(app).get("/books");
    expect(res.statusCode).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0]).toHaveProperty("isbn");
  });
});

describe("GET /books/:isbn", () => {
  test("Gets a single book by ISBN", async () => {
    const res = await request(app).get("/books/0691161518");
    expect(res.statusCode).toBe(200);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.isbn).toBe("0691161518");
  });

  test("Responds with 404 for non-existent book", async () => {
    const res = await request(app).get("/books/0000000000");
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /books", () => {
  test("Creates a new book", async () => {
    const newBook = {
      isbn: "1234567890",
      amazon_url: "http://a.co/eobPtX3",
      author: "John Doe",
      language: "english",
      pages: 300,
      publisher: "Some Publisher",
      title: "Some Title",
      year: 2021,
    };
    const res = await request(app).post("/books").send(newBook);
    expect(res.statusCode).toBe(201);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.isbn).toBe("1234567890");
  });

  test("Prevents creating a book with missing required fields", async () => {
    const invalidBook = {
      amazon_url: "http://a.co/eobPtX3",
      author: "John Doe",
      language: "english",
      pages: 300,
      publisher: "Some Publisher",
      title: "Some Title",
      year: 2021,
    };
    const res = await request(app).post("/books").send(invalidBook);
    expect(res.statusCode).toBe(400);
  });

  test("Prevents creating a book with invalid data types", async () => {
    const invalidBook = {
      isbn: 1234567890, // Should be a string
      amazon_url: "http://a.co/eobPtX3",
      author: "John Doe",
      language: "english",
      pages: "three hundred", // Should be an integer
      publisher: "Some Publisher",
      title: "Some Title",
      year: "twenty twenty-one", // Should be an integer
    };
    const res = await request(app).post("/books").send(invalidBook);
    expect(res.statusCode).toBe(400);
  });

  test("Prevents creating a book with additional properties", async () => {
    const invalidBook = {
      isbn: "1234567890",
      amazon_url: "http://a.co/eobPtX3",
      author: "John Doe",
      language: "english",
      pages: 300,
      publisher: "Some Publisher",
      title: "Some Title",
      year: 2021,
      extra_property: "This should not be here", // Additional property not defined in the schema
    };
    const res = await request(app).post("/books").send(invalidBook);
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /books/:isbn", () => {
  test("Updates a book", async () => {
    const updatedBook = {
      amazon_url: "http://a.co/eobPtX4",
      author: "Jane Doe",
      language: "english",
      pages: 350,
      publisher: "Another Publisher",
      title: "Another Title",
      year: 2022,
    };
    const res = await request(app).put("/books/0691161518").send(updatedBook);
    expect(res.statusCode).toBe(200);
    expect(res.body.book).toHaveProperty("isbn");
    expect(res.body.book.author).toBe("Jane Doe");
  });

  test("Prevents updating a book with invalid data types", async () => {
    const invalidBook = {
      amazon_url: "not-a-url",
      author: "Jane Doe",
      language: "english",
      pages: 350,
      publisher: "Another Publisher",
      title: "Another Title",
      year: 2022,
    };
    const res = await request(app).put("/books/0691161518").send(invalidBook);
    expect(res.statusCode).toBe(400);
  });

  test("Prevents updating a book with additional properties", async () => {
    const invalidBook = {
      amazon_url: "http://a.co/eobPtX4",
      author: "Jane Doe",
      language: "english",
      pages: 350,
      publisher: "Another Publisher",
      title: "Another Title",
      year: 2022,
      extra_property: "This should not be here", // Additional property not defined in the schema
    };
    const res = await request(app).put("/books/0691161518").send(invalidBook);
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /books/:isbn", () => {
  test("Deletes a book", async () => {
    const res = await request(app).delete("/books/0691161518");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Book deleted" });
  });

  test("Responds with 404 for non-existent book", async () => {
    const res = await request(app).delete("/books/0000000000");
    expect(res.statusCode).toBe(404);
  });
});
