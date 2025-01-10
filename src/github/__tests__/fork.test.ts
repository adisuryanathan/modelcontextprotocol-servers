import { closeServer, forkRepository } from "../index.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Mock GitHub API responses
const handlers = [
  http.post("https://api.github.com/repos/:owner/:repo/forks", async ({ params, request }) => {
    const { owner, repo } = params as { owner: string; repo: string };
    const body = await request.json() as {
      organization?: string;
    };

    // Determine owner based on whether organization was specified
    const forkOwner = body.organization || "test-user";

    return HttpResponse.json({
      id: 1,
      node_id: "R_1",
      name: repo,
      full_name: `${forkOwner}/${repo}`,
      private: false,
      owner: {
        login: forkOwner,
        id: 1,
        node_id: "U_1",
        avatar_url: "https://github.com/images/error/test-user.gif",
        url: `https://api.github.com/users/${forkOwner}`,
        html_url: `https://github.com/${forkOwner}`,
        type: body.organization ? "Organization" : "User"
      },
      html_url: `https://github.com/${forkOwner}/${repo}`,
      description: "Test repo",
      fork: true,
      url: `https://api.github.com/repos/${forkOwner}/${repo}`,
      created_at: "2025-01-07T00:00:00Z",
      updated_at: "2025-01-07T00:00:00Z",
      pushed_at: "2025-01-07T00:00:00Z",
      git_url: `git://github.com/${forkOwner}/${repo}.git`,
      ssh_url: `git@github.com:${forkOwner}/${repo}.git`,
      clone_url: `https://github.com/${forkOwner}/${repo}.git`,
      default_branch: "main",
      // Parent repository info
      parent: {
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: {
          login: owner,
          id: 2,
          avatar_url: "https://github.com/images/error/owner.gif"
        },
        html_url: `https://github.com/${owner}/${repo}`
      },
      // Source repository info (same as parent in this case)
      source: {
        name: repo,
        full_name: `${owner}/${repo}`,
        owner: {
          login: owner,
          id: 2,
          avatar_url: "https://github.com/images/error/owner.gif"
        },
        html_url: `https://github.com/${owner}/${repo}`
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

test("forks a repository to user account", async () => {
  const owner = "test-owner";
  const repo = "test-repo";

  const fork = await forkRepository(owner, repo);

  expect(fork).toMatchObject({
    name: repo,
    full_name: `test-user/${repo}`,
    fork: true,
    owner: {
      login: "test-user",
      type: "User"
    },
    parent: {
      name: repo,
      full_name: `${owner}/${repo}`,
      owner: {
        login: owner
      }
    }
  });
});

test("forks a repository to organization", async () => {
  const owner = "test-owner";
  const repo = "test-repo";
  const organization = "test-org";

  const fork = await forkRepository(owner, repo, organization);

  expect(fork).toMatchObject({
    name: repo,
    full_name: `${organization}/${repo}`,
    fork: true,
    owner: {
      login: organization,
      type: "Organization"
    },
    parent: {
      name: repo,
      full_name: `${owner}/${repo}`,
      owner: {
        login: owner
      }
    }
  });
});
