import { closeServer, searchIssues, searchUsers } from "../index.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Mock GitHub API responses
const handlers = [
  // Search issues
  http.get("https://api.github.com/search/issues", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    return HttpResponse.json({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          url: "https://api.github.com/repos/test-owner/test-repo/issues/1",
          repository_url: "https://api.github.com/repos/test-owner/test-repo",
          labels_url: "https://api.github.com/repos/test-owner/test-repo/issues/1/labels{/name}",
          comments_url: "https://api.github.com/repos/test-owner/test-repo/issues/1/comments",
          events_url: "https://api.github.com/repos/test-owner/test-repo/issues/1/events",
          html_url: "https://github.com/test-owner/test-repo/issues/1",
          id: 1,
          node_id: "I_1",
          number: 1,
          title: "Test Issue",
          user: {
            login: "test-user",
            id: 1,
            avatar_url: "https://github.com/images/error/test-user.gif",
            url: "https://api.github.com/users/test-user",
            html_url: "https://github.com/test-user"
          },
          labels: [],
          state: "open",
          locked: false,
          assignee: null,
          assignees: [],
          comments: 0,
          created_at: "2025-01-07T00:00:00Z",
          updated_at: "2025-01-07T00:00:00Z",
          closed_at: null,
          body: "Test issue body",
          score: 1.0
        }
      ]
    });
  }),

  // Search users
  http.get("https://api.github.com/search/users", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    return HttpResponse.json({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          login: "test-user",
          id: 1,
          node_id: "U_1",
          avatar_url: "https://github.com/images/error/test-user.gif",
          gravatar_id: "",
          url: "https://api.github.com/users/test-user",
          html_url: "https://github.com/test-user",
          followers_url: "https://api.github.com/users/test-user/followers",
          following_url: "https://api.github.com/users/test-user/following{/other_user}",
          gists_url: "https://api.github.com/users/test-user/gists{/gist_id}",
          starred_url: "https://api.github.com/users/test-user/starred{/owner}{/repo}",
          subscriptions_url: "https://api.github.com/users/test-user/subscriptions",
          organizations_url: "https://api.github.com/users/test-user/orgs",
          repos_url: "https://api.github.com/users/test-user/repos",
          events_url: "https://api.github.com/users/test-user/events{/privacy}",
          received_events_url: "https://api.github.com/users/test-user/received_events",
          type: "User",
          site_admin: false,
          score: 1.0
        }
      ]
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

test("searches issues with query parameters", async () => {
  const results = await searchIssues({
    q: "repo:test-owner/test-repo is:open",
    sort: "created",
    order: "desc"
  });

  expect(results).toMatchObject({
    total_count: 1,
    incomplete_results: false,
    items: [
      {
        title: "Test Issue",
        state: "open",
        user: {
          login: "test-user"
        }
      }
    ]
  });
});

test("searches users with query parameters", async () => {
  const results = await searchUsers({
    q: "type:user",
    sort: "followers",
    order: "desc"
  });

  expect(results).toMatchObject({
    total_count: 1,
    incomplete_results: false,
    items: [
      {
        login: "test-user",
        type: "User",
        site_admin: false
      }
    ]
  });
});
