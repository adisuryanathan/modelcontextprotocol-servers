import { createPullRequest, closeServer } from "../index.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Mock GitHub API responses
const handlers = [
  http.post("https://api.github.com/repos/:owner/:repo/pulls", async ({ params, request }) => {
    const { owner, repo } = params as { owner: string; repo: string };
    const body = await request.json() as {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
      maintainer_can_modify?: boolean;
    };

    return HttpResponse.json({
      url: `https://api.github.com/repos/${owner}/${repo}/pulls/1`,
      id: 1,
      node_id: "PR_1",
      html_url: `https://github.com/${owner}/${repo}/pull/1`,
      diff_url: `https://github.com/${owner}/${repo}/pull/1.diff`,
      patch_url: `https://github.com/${owner}/${repo}/pull/1.patch`,
      issue_url: `https://api.github.com/repos/${owner}/${repo}/issues/1`,
      number: 1,
      state: "open",
      locked: false,
      title: body.title,
      user: {
        login: "test-user",
        id: 1,
        node_id: "U_1",
        avatar_url: "https://github.com/images/error/test-user.gif",
        url: "https://api.github.com/users/test-user",
        html_url: "https://github.com/test-user",
        type: "User"
      },
      body: body.body || "",
      created_at: "2025-01-07T00:00:00Z",
      updated_at: "2025-01-07T00:00:00Z",
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      assignee: null,
      assignees: [],
      head: {
        label: body.head,
        ref: body.head.split(":")[1] || body.head,
        sha: "test-sha",
        user: {
          login: "test-user",
          id: 1,
          node_id: "U_1",
          avatar_url: "https://github.com/images/error/test-user.gif",
          url: "https://api.github.com/users/test-user",
          html_url: "https://github.com/test-user",
          type: "User"
        },
        repo: {
          id: 1,
          node_id: "R_1",
          name: repo,
          full_name: `${owner}/${repo}`,
          owner: {
            login: owner,
            id: 1,
            node_id: "U_1",
            avatar_url: "https://github.com/images/error/test-user.gif",
            url: `https://api.github.com/users/${owner}`,
            html_url: `https://github.com/${owner}`,
            type: "User"
          },
          html_url: `https://github.com/${owner}/${repo}`,
          description: "Test repo",
          url: `https://api.github.com/repos/${owner}/${repo}`,
          created_at: "2025-01-07T00:00:00Z",
          updated_at: "2025-01-07T00:00:00Z",
          pushed_at: "2025-01-07T00:00:00Z",
          git_url: `git://github.com/${owner}/${repo}.git`,
          ssh_url: `git@github.com:${owner}/${repo}.git`,
          clone_url: `https://github.com/${owner}/${repo}.git`,
          private: false,
          fork: false,
          default_branch: "main"
        }
      },
      base: {
        label: `${owner}:${body.base}`,
        ref: body.base,
        sha: "base-sha",
        user: {
          login: owner,
          id: 2,
          node_id: "U_2",
          avatar_url: "https://github.com/images/error/owner.gif",
          url: `https://api.github.com/users/${owner}`,
          html_url: `https://github.com/${owner}`,
          type: "User"
        },
        repo: {
          id: 2,
          node_id: "R_2",
          name: repo,
          full_name: `${owner}/${repo}`,
          owner: {
            login: owner,
            id: 2,
            node_id: "U_2",
            avatar_url: "https://github.com/images/error/owner.gif",
            url: `https://api.github.com/users/${owner}`,
            html_url: `https://github.com/${owner}`,
            type: "User"
          },
          html_url: `https://github.com/${owner}/${repo}`,
          description: "Test repo",
          url: `https://api.github.com/repos/${owner}/${repo}`,
          created_at: "2025-01-07T00:00:00Z",
          updated_at: "2025-01-07T00:00:00Z",
          pushed_at: "2025-01-07T00:00:00Z",
          git_url: `git://github.com/${owner}/${repo}.git`,
          ssh_url: `git@github.com:${owner}/${repo}.git`,
          clone_url: `https://github.com/${owner}/${repo}.git`,
          private: false,
          fork: false,
          default_branch: "main"
        }
      }
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

describe("Pull Request Creation", () => {
  test("creates a basic pull request", async () => {
    const owner = "test-owner";
    const repo = "test-repo";
    const title = "Test PR";
    const head = "feature-branch";
    const base = "main";
    const body = "Test PR description";

    const pr = await createPullRequest(
      owner,
      repo,
      title,
      head,
      base,
      body
    );

    expect(pr).toMatchObject({
      title,
      body,
      head: {
        ref: head
      },
      base: {
        ref: base
      },
      state: "open"
    });
  });

  test("creates a draft pull request", async () => {
    const owner = "test-owner";
    const repo = "test-repo";
    const title = "Draft PR";
    const head = "feature-branch";
    const base = "main";
    const body = "Draft PR description";
    const draft = true;

    const pr = await createPullRequest(
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft
    );

    expect(pr).toMatchObject({
      title,
      body,
      head: {
        ref: head
      },
      base: {
        ref: base
      },
      state: "open",
      draft: true
    });
  });

  test("creates a PR with maintainer modification enabled", async () => {
    const owner = "test-owner";
    const repo = "test-repo";
    const title = "Test PR";
    const head = "feature-branch";
    const base = "main";
    const body = "Test PR description";
    const maintainer_can_modify = true;

    const pr = await createPullRequest(
      owner,
      repo,
      title,
      head,
      base,
      body,
      false,
      maintainer_can_modify
    );

    expect(pr).toMatchObject({
      title,
      body,
      head: {
        ref: head
      },
      base: {
        ref: base
      },
      state: "open",
      maintainer_can_modify: true
    });
  });

  test("handles invalid head branch", async () => {
    const owner = "test-owner";
    const repo = "test-repo";

    // Mock error response for invalid branch
    server.use(
      http.post("https://api.github.com/repos/:owner/:repo/pulls", () => {
        return new HttpResponse(null, {
          status: 422,
          statusText: "Unprocessable Entity - Invalid head branch"
        });
      })
    );

    await expect(createPullRequest(
      owner,
      repo,
      "Test PR",
      "nonexistent-branch",
      "main",
      "Test description"
    )).rejects.toThrow("GitHub API error: Unprocessable Entity - Invalid head branch");
  });

  test("handles invalid base branch", async () => {
    const owner = "test-owner";
    const repo = "test-repo";

    // Mock error response for invalid branch
    server.use(
      http.post("https://api.github.com/repos/:owner/:repo/pulls", () => {
        return new HttpResponse(null, {
          status: 422,
          statusText: "Unprocessable Entity - Invalid base branch"
        });
      })
    );

    await expect(createPullRequest(
      owner,
      repo,
      "Test PR",
      "feature-branch",
      "nonexistent-base",
      "Test description"
    )).rejects.toThrow("GitHub API error: Unprocessable Entity - Invalid base branch");
  });

  test("handles rate limiting", async () => {
    const owner = "test-owner";
    const repo = "test-repo";

    // Mock rate limit response
    server.use(
      http.post("https://api.github.com/repos/:owner/:repo/pulls", () => {
        return new HttpResponse(null, {
          status: 403,
          statusText: "Rate limit exceeded"
        });
      })
    );

    await expect(createPullRequest(
      owner,
      repo,
      "Test PR",
      "feature-branch",
      "main",
      "Will be rate limited"
    )).rejects.toThrow("GitHub API error: Rate limit exceeded");
  });

  test("handles missing required fields", async () => {
    const owner = "test-owner";
    const repo = "test-repo";

    await expect(createPullRequest(
      owner,
      repo,
      // Type assertion to test invalid input
      "" as any,
      "feature-branch",
      "main"
    )).rejects.toThrow();
  });
});
