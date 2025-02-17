import { test, expect } from 'vitest';
import { Env, Hono } from 'hono';
import { StatusCodes } from '../../../src/utils/responses.ts';
import { testClient } from 'hono/testing'; // Correct import for testClient
import { authRoutes } from '../../../src/routes/auth/index.ts'; // Adjust import to your route

// Mock the database interaction (for this example, it's just a basic mock)
const mockDatabase = {
  getEmailPassword: (email: string, password: string) => {
    if (email === 'test@example.com' && password === "password123") {
      return 'saltBase64:hashedPassword'; // Mock salt and hashed password
    }
    return null;
  },
};

const kvSessionMock = {
	put : ( sessionToken: string, expiryAndUserEmail: string)=>{
		return null;
	}
}

interface EnvironmentBindings extends Env {
  database: typeof mockDatabase; // Define the database type
  SESSION_TOKENS: typeof kvSessionMock;
  BASE_URL: string;
}

// Create a new instance of Hono for testing
const app = new Hono<EnvironmentBindings>();

app.use((ctx, next) => {
  ctx.env = {
    database: mockDatabase,
    SESSION_TOKENS: kvSessionMock,
    BASE_URL: 'http://localhost',
  };
  return next();
});

// Register your routes
app.route('/auth', authRoutes);

// Create a test client using testClient
const client = testClient(app) as ReturnType<typeof testClient>;

test('POST /auth/sign-in - success', async () => {
  const mockRequestBody = {
    email: 'test@example.com',
    password: 'password123',
  };

  const response = await client
    .post('/auth/sign-in')
    .json(mockRequestBody) // Send the mock body
    .expect(StatusCodes.CREATED); // Assert the status code

  // Check the response content
  expect(response.json().message).toBe('Authorized successfully');
});

// test('POST /auth/sign-in - unauthorized (invalid password)', async () => {
//   const mockRequestBody = {
//     email: 'test@example.com',
//     password: 'wrongpassword',
//   };

//   const response = await client
//     .post('/auth/sign-in')
//     .json(mockRequestBody) // Send the mock body
//     .expect(StatusCodes.UNAUTHORIZED); // Assert the status code

//   expect(response.json().message).toBe('Unauthorized');
// });

// test('POST /auth/sign-in - bad input (missing email)', async () => {
//   const mockRequestBody = {
//     password: 'password123',
//   };

//   const response = await client
//     .post('/auth/sign-in')
//     .json(mockRequestBody) // Send the mock body
//     .expect(StatusCodes.BAD_REQUEST); // Assert the status code

//   expect(response.json().message).toMatch(/Invalid input/);
// });
