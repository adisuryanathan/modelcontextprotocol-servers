import { createPullRequestReview, closeServer } from "../index.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Mock GitHub API responses
const handlers = [
  http.post("https://api.github.com/repos/:owner/:repo/pulls/:number/reviews", async ({ params, request }) => {
    const { owner, repo, number } = params as { owner: string; repo: string; number: string };
    const body = await request.json() as {
      commit_id?: string;
      body: string;
      event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
      comments?: Array<{
        path: string;
        position: number;
        body: string;
      }>;
    };

    return HttpResponse.json({
      id: 1,
      node_id: "PRR_1",
      user: {
        login: "test-user",
        id: 1,
        avatar_url: "https://github.com/images/error/test-user.gif",
        url: "https://api.github.com/users/test-user",
        html_url: "https://github.com/test-user"
      },
      body: body.body,
      state: body.event, // Note: Response state matches the event we sent
      html_url: `https://github.com/${owner}/${repo}/pull/${number}#pullrequestreview-1`,
      pull_request_url: `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      commit_id: body.commit_id || "default-sha",
      submitted_at: "2025-01-07T00:00:00Z"
    });
  })
];

const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close servers after all tests
afterAll(async () => {
  server.close();
  await closeServer();
});

test("creates an approving review", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  const review = await createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "LGTM! 👍",
      event: "APPROVE"
    }
  );

  expect(review).toMatchObject({
    body: "LGTM! 👍",
    state: "APPROVE",
    user: {
      login: "test-user"
    }
  });
});

test("creates a review requesting changes", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  const review = await createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Please fix these issues",
      event: "REQUEST_CHANGES",
      comments: [
        {
          path: "src/file.ts",
          position: 42,
          body: "This could be improved"
        }
      ]
    }
  );

  expect(review).toMatchObject({
    body: "Please fix these issues",
    state: "REQUEST_CHANGES",
    user: {
      login: "test-user"
    }
  });
});

test("creates a review with just comments", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  const review = await createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Here are some suggestions",
      event: "COMMENT",
      comments: [
        {
          path: "src/file.ts",
          position: 42,
          body: "Consider using const here"
        },
        {
          path: "src/file.ts",
          position: 50,
          body: "This could be simplified"
        }
      ]
    }
  );

  expect(review).toMatchObject({
    body: "Here are some suggestions",
    state: "COMMENT",
    user: {
      login: "test-user"
    }
  });
});

// Error cases
test("handles invalid review event", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  await expect(createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Invalid review",
      event: "INVALID_EVENT" as any
    }
  )).rejects.toThrow();
});

test("handles missing required fields", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  await expect(createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      // Missing required 'event' field
      body: "Missing event"
    } as any
  )).rejects.toThrow();
});

test("handles API errors", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  // Mock API error response
  server.use(
    http.post("https://api.github.com/repos/:owner/:repo/pulls/:number/reviews", () => {
      return new HttpResponse(null, {
        status: 422,
        statusText: "Unprocessable Entity"
      });
    })
  );

  await expect(createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Will fail",
      event: "APPROVE"
    }
  )).rejects.toThrow("GitHub API error: Unprocessable Entity");
});

test("handles rate limiting", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  // Mock rate limit response
  server.use(
    http.post("https://api.github.com/repos/:owner/:repo/pulls/:number/reviews", () => {
      return new HttpResponse(null, {
        status: 403,
        statusText: "Rate limit exceeded"
      });
    })
  );

  await expect(createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Will be rate limited",
      event: "APPROVE"
    }
  )).rejects.toThrow("GitHub API error: Rate limit exceeded");
});

test("handles invalid commit ID", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;

  // Mock invalid commit response
  server.use(
    http.post("https://api.github.com/repos/:owner/:repo/pulls/:number/reviews", () => {
      return new HttpResponse(null, {
        status: 422,
        statusText: "Unprocessable Entity - Invalid commit SHA"
      });
    })
  );

  await expect(createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Invalid commit",
      event: "COMMENT",
      commit_id: "invalid-sha"
    }
  )).rejects.toThrow("GitHub API error: Unprocessable Entity - Invalid commit SHA");
});

test("creates a review for specific commit", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const pullNumber = 123;
  const commitId = "abc123";

  const review = await createPullRequestReview(
    owner,
    repo,
    pullNumber,
    {
      body: "Reviewing specific commit",
      event: "COMMENT",
      commit_id: commitId
    }
  );

  expect(review).toMatchObject({
    body: "Reviewing specific commit",
    state: "COMMENT",
    commit_id: commitId,
    user: {
      login: "test-user"
    }
  });
});
