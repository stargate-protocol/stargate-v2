---
name: linear
description: Use Symphony's linear_graphql tool for Linear issue comments, status changes, and PR links.
---

# Linear

Use this workflow during Symphony app-server sessions when the `linear_graphql` tool is available.

## Tool Shape

```json
{
  "query": "query or mutation document",
  "variables": {
    "id": "value"
  }
}
```

Treat a top-level `errors` array as failure.

## Common Operations

Read an issue by key:

```graphql
query IssueByKey($key: String!) {
  issue(id: $key) {
    id
    identifier
    title
    url
    description
    state {
      id
      name
      type
    }
    team {
      id
      states {
        nodes {
          id
          name
          type
        }
      }
    }
    attachments {
      nodes {
        id
        title
        url
      }
    }
  }
}
```

Create a workpad comment:

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment {
      id
      url
    }
  }
}
```

Update the workpad comment:

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment {
      id
    }
  }
}
```

Move an issue to a state:

```graphql
mutation MoveIssue($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      id
      state {
        id
        name
      }
    }
  }
}
```

Attach a GitHub PR:

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId
    url: $url
    title: $title
    linkKind: links
  ) {
    success
    attachment {
      id
      url
    }
  }
}
```

## Rules

- Fetch team states and use state IDs instead of hardcoding IDs.
- Use one persistent `## Codex Workpad` comment for progress.
- Keep comments concise and reviewer-oriented.
- Prefer `attachmentLinkGitHubPR` when linking PRs.
- Do not introduce raw Linear API tokens or shell helpers.
