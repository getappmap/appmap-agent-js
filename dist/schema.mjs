export const schema = [
  {
    $id: "encoding",
    enum: ["buffer", "utf8", "utf16le", "latin1"],
  },
  {
    $id: "ordering",
    enum: ["chronological", "causal"],
  },
  {
    $id: "log-level",
    enum: ["debug", "info", "warning", "error", "off"],
  },
  {
    $id: "file-type",
    enum: ["script", "module"],
  },
  {
    $id: "recorder",
    enum: ["process", "mocha", "manual", "remote"],
  },
  {
    $id: "serialization-method",
    enum: ["toString", "Object.prototype.toString"],
  },
  {
    $id: "stdio-stream",
    enum: ["ignore", "pipe", "inherit"],
  },
  {
    $id: "signal",
    enum: ["SIGINT", "SIGTERM", "SIGKILL"],
  },
  {
    $id: "indent",
    enum: [0, 2, 4, 8],
  },
  {
    $id: "url",
    type: "string",
    pattern: "^[a-z]+://",
  },
  {
    $id: "exclusion",
    type: "string",
  },
  {
    $id: "regular-identifier",
    type: "string",
    pattern: "^[a-zA-Z_$][a-zA-Z_$-9]*$",
  },
  {
    $id: "path",
    type: "string",
  },
  {
    $id: "absolute-path",
    type: "string",
    pattern: "^/",
  },
  {
    $id: "basename",
    type: "string",
    pattern: "^[^/.]+$",
  },
  {
    $id: "extension",
    type: "string",
    pattern: "^\\.[^/]+$",
  },
  {
    $id: "index",
    type: "integer",
    minimum: 0,
    maximum: 9007199254740991,
  },
  {
    $id: "port-number",
    type: "integer",
    minimum: 1,
    maximum: 65535,
  },
  {
    $id: "port",
    anyOf: [
      {
        $ref: "path",
      },
      {
        $ref: "port-number",
      },
    ],
  },
  {
    $id: "absolute-port",
    anyOf: [
      {
        $ref: "absolute-path",
      },
      {
        $ref: "port-number",
      },
    ],
  },
  {
    $id: "name-version-string",
    type: "string",
    pattern: "^[^@]+@[^@]+$",
  },
  {
    $id: "name-version-object",
    type: "object",
    additionalProperties: false,
    required: ["name", "version"],
    properties: {
      name: {
        type: "string",
      },
      version: {
        type: "string",
      },
    },
  },
  {
    $id: "name-version",
    anyOf: [
      {
        $ref: "name-version-string",
      },
      {
        $ref: "name-version-object",
      },
    ],
  },
  {
    $id: "recording-string",
    type: "string",
    pattern: "^[^.]+.[^.]+$",
  },
  {
    $id: "recording-object",
    type: "object",
    additionalProperties: false,
    required: ["defined-class", "method-id"],
    properties: {
      "defined-class": {
        type: "string",
      },
      "method-id": {
        type: "string",
      },
    },
  },
  {
    $id: "recording",
    anyOf: [
      {
        $ref: "recording-string",
      },
      {
        $ref: "recording-object",
      },
    ],
  },
  {
    $id: "package",
    type: "object",
    additionalProperties: false,
    required: ["name", "version", "homepage"],
    properties: {
      name: {
        type: "string",
      },
      version: {
        type: "string",
      },
      homepage: {
        type: "string",
        nullable: true,
      },
    },
  },
  {
    $id: "exclude",
    type: "array",
    items: {
      $ref: "exclusion",
    },
  },
  {
    $id: "stdio",
    anyOf: [
      {
        $ref: "stdio-stream",
      },
      {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: [
          {
            $ref: "stdio-stream",
          },
          {
            $ref: "stdio-stream",
          },
          {
            $ref: "stdio-stream",
          },
        ],
      },
    ],
  },
  {
    $id: "env",
    type: "object",
    additionalProperties: false,
    patternProperties: {
      "^": {
        type: "string",
      },
    },
  },
  {
    $id: "specifier",
    anyOf: [
      {
        type: "object",
        additionalProperties: false,
        required: ["regexp"],
        properties: {
          regexp: {
            type: "string",
          },
          flags: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
          shallow: {
            type: "boolean",
          },
          exclude: {
            $ref: "exclude",
          },
          "inline-source": {
            type: "boolean",
            nullable: true,
          },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["glob"],
        properties: {
          glob: {
            type: "string",
          },
          enabled: {
            type: "boolean",
          },
          shallow: {
            type: "boolean",
          },
          exclude: {
            $ref: "exclude",
          },
          "inline-source": {
            type: "boolean",
            nullable: true,
          },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["path"],
        properties: {
          path: {
            type: "string",
          },
          recursive: {
            type: "boolean",
          },
          enabled: {
            type: "boolean",
          },
          shallow: {
            type: "boolean",
          },
          exclude: {
            $ref: "exclude",
          },
          "inline-source": {
            type: "boolean",
            nullable: true,
          },
        },
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["dist"],
        properties: {
          dist: {
            type: "string",
          },
          recursive: {
            type: "boolean",
          },
          external: {
            type: "boolean",
          },
          enabled: {
            type: "boolean",
          },
          shallow: {
            type: "boolean",
          },
          exclude: {
            $ref: "exclude",
          },
          "inline-source": {
            type: "boolean",
            nullable: true,
          },
        },
      },
    ],
  },
  {
    $id: "package-specifier",
    anyOf: [
      {
        type: "string",
      },
      {
        $ref: "specifier",
      },
    ],
  },
  {
    $id: "enabled-specifier",
    anyOf: [
      {
        type: "boolean",
      },
      {
        type: "string",
      },
      {
        allOf: [
          {
            $ref: "specifier",
          },
          {
            not: {
              anyOf: [
                {
                  type: "object",
                  required: ["shallow"],
                },
                {
                  type: "object",
                  required: ["inline-source"],
                },
                {
                  type: "object",
                  required: ["exclude"],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    $id: "cooked-specifier",
    type: "object",
    additionalProperties: false,
    required: ["cwd", "source", "flags"],
    properties: {
      cwd: {
        $ref: "absolute-path",
      },
      source: {
        type: "string",
      },
      flags: {
        type: "string",
      },
    },
  },
  {
    $id: "command-options",
    type: "object",
    additionalProperties: false,
    properties: {
      encoding: {
        $ref: "encoding",
      },
      env: {
        $ref: "env",
      },
      stdio: {
        $ref: "stdio",
      },
      timeout: {
        type: "integer",
        minimum: 0,
      },
      killSignal: {
        $ref: "signal",
      },
    },
  },
  {
    $id: "cooked-command-options",
    allOf: [
      {
        $ref: "command-options",
      },
      {
        type: "object",
        required: ["encoding", "env", "stdio", "timeout", "killSignal"],
      },
    ],
  },
  {
    $id: "agent",
    type: "object",
    additionalProperties: false,
    required: ["directory", "package"],
    properties: {
      directory: {
        $ref: "absolute-path",
      },
      package: {
        $ref: "package",
      },
    },
  },
  {
    $id: "repository",
    type: "object",
    additionalProperties: false,
    required: ["directory", "history", "package"],
    properties: {
      directory: {
        $ref: "absolute-path",
      },
      history: {
        type: "object",
        nullable: true,
      },
      package: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "package",
          },
        ],
      },
    },
  },
  {
    $id: "config",
    type: "object",
    additionalProperties: false,
    properties: {
      agent: {
        $ref: "agent",
      },
      repository: {
        $ref: "repository",
      },
      scenarios: {
        type: "array",
        items: {
          $ref: "config",
        },
      },
      scenario: {
        type: "string",
      },
      "recursive-process-recording": {
        type: "boolean",
      },
      command: {
        type: "string",
      },
      "command-options": {
        $ref: "command-options",
      },
      validate: {
        type: "object",
        additionalProperties: false,
        properties: {
          message: {
            type: "boolean",
          },
          appmap: {
            type: "boolean",
          },
        },
      },
      log: {
        $ref: "log-level",
      },
      host: {
        const: "localhost",
      },
      session: {
        $ref: "basename",
      },
      "trace-port": {
        anyOf: [
          {
            const: 0,
          },
          {
            $ref: "port",
          },
        ],
      },
      "trace-protocol": {
        const: "TCP",
      },
      "track-port": {
        anyOf: [
          {
            const: 0,
          },
          {
            $ref: "port",
          },
        ],
      },
      "track-protocol": {
        const: "HTTP/1.1",
      },
      "intercept-track-port": {
        type: "string",
      },
      "intercept-track-protocol": {
        const: "HTTP/1.1",
      },
      recorder: {
        $ref: "recorder",
      },
      "inline-source": {
        type: "boolean",
      },
      hooks: {
        type: "object",
        additionalProperties: false,
        properties: {
          cjs: {
            type: "boolean",
          },
          esm: {
            type: "boolean",
          },
          apply: {
            type: "boolean",
          },
          http: {
            type: "boolean",
          },
          mysql: {
            type: "boolean",
          },
          pg: {
            type: "boolean",
          },
          sqlite3: {
            type: "boolean",
          },
        },
      },
      ordering: {
        $ref: "ordering",
      },
      processes: {
        anyOf: [
          {
            $ref: "enabled-specifier",
          },
          {
            type: "array",
            items: {
              $ref: "enabled-specifier",
            },
          },
        ],
      },
      "hidden-identifier": {
        $ref: "regular-identifier",
      },
      main: {
        $ref: "path",
      },
      engine: {
        $ref: "name-version",
      },
      language: {
        $ref: "name-version",
      },
      packages: {
        anyOf: [
          {
            $ref: "package-specifier",
          },
          {
            type: "array",
            items: {
              $ref: "package-specifier",
            },
          },
        ],
      },
      exclude: {
        $ref: "exclude",
      },
      "function-name-placeholder": {
        type: "string",
      },
      recording: {
        $ref: "recording",
      },
      serialization: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              method: {
                $ref: "serialization-method",
              },
              "include-constructor-name": {
                type: "boolean",
              },
              "maximum-length": {
                type: "integer",
                minimum: 0,
                nullable: true,
              },
            },
          },
        ],
      },
      pruning: {
        type: "boolean",
      },
      output: {
        anyOf: [
          {
            type: "string",
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              directory: {
                $ref: "path",
              },
              basename: {
                $ref: "basename",
              },
              extension: {
                $ref: "extension",
              },
            },
          },
        ],
      },
      app: {
        type: "string",
      },
      name: {
        type: "string",
      },
      feature: {
        type: "string",
      },
      "feature-group": {
        type: "string",
      },
      labels: {
        type: "array",
        items: {
          type: "string",
        },
      },
      frameworks: {
        type: "array",
        items: {
          $ref: "name-version",
        },
      },
    },
  },
  {
    $id: "configuration",
    type: "object",
    additionalProperties: false,
    minProperties: 39,
    properties: {
      scenario: {
        type: "string",
      },
      scenarios: {
        type: "array",
        items: {
          type: "object",
          required: ["value", "cwd"],
          properties: {
            value: {
              $ref: "config",
            },
            cwd: {
              $ref: "absolute-path",
            },
          },
        },
      },
      "recursive-process-recording": {
        type: "boolean",
      },
      command: {
        type: "object",
        nullable: true,
        properties: {
          value: {
            type: "string",
          },
          cwd: {
            $ref: "absolute-path",
          },
        },
      },
      "command-options": {
        $ref: "cooked-command-options",
      },
      validate: {
        type: "object",
        additionalProperties: false,
        required: ["message", "appmap"],
        properties: {
          message: {
            type: "boolean",
          },
          appmap: {
            type: "boolean",
          },
        },
      },
      agent: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "agent",
          },
        ],
      },
      repository: {
        $ref: "repository",
      },
      log: {
        $ref: "log-level",
      },
      host: {
        const: "localhost",
      },
      session: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "basename",
          },
        ],
      },
      "trace-port": {
        anyOf: [
          {
            const: 0,
          },
          {
            $ref: "absolute-port",
          },
        ],
      },
      "trace-protocol": {
        const: "TCP",
      },
      "track-port": {
        anyOf: [
          {
            const: 0,
          },
          {
            $ref: "absolute-port",
          },
        ],
      },
      "track-protocol": {
        const: "HTTP/1.1",
      },
      "intercept-track-port": {
        type: "string",
      },
      "intercept-track-protocol": {
        const: "HTTP/1.1",
      },
      recorder: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "recorder",
          },
        ],
      },
      "inline-source": {
        type: "boolean",
      },
      hooks: {
        type: "object",
        additionalProperties: false,
        required: ["cjs", "esm", "apply", "http", "mysql", "pg", "sqlite3"],
        properties: {
          cjs: {
            type: "boolean",
          },
          esm: {
            type: "boolean",
          },
          apply: {
            type: "boolean",
          },
          http: {
            type: "boolean",
          },
          mysql: {
            type: "boolean",
          },
          pg: {
            type: "boolean",
          },
          sqlite3: {
            type: "boolean",
          },
        },
      },
      ordering: {
        $ref: "ordering",
      },
      processes: {
        type: "array",
        items: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: [
            {
              $ref: "cooked-specifier",
            },
            {
              type: "boolean",
            },
          ],
        },
      },
      "hidden-identifier": {
        $ref: "regular-identifier",
      },
      main: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "absolute-path",
          },
        ],
      },
      engine: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "name-version-object",
          },
        ],
      },
      language: {
        $ref: "name-version-object",
      },
      packages: {
        type: "array",
        items: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: [
            {
              $ref: "cooked-specifier",
            },
            {
              type: "object",
              properties: {
                enabled: {
                  type: "boolean",
                },
                shallow: {
                  type: "boolean",
                },
                "inline-source": {
                  type: "boolean",
                  nullable: true,
                },
                exclude: {
                  $ref: "exclude",
                },
              },
            },
          ],
        },
      },
      exclude: {
        $ref: "exclude",
      },
      "function-name-placeholder": {
        type: "string",
      },
      recording: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "recording-object",
          },
        ],
      },
      serialization: {
        type: "object",
        additionalProperties: false,
        required: ["maximum-length", "include-constructor-name", "method"],
        properties: {
          "maximum-length": {
            type: "integer",
            minimum: 0,
            nullable: true,
          },
          "include-constructor-name": {
            type: "boolean",
          },
          method: {
            $ref: "serialization-method",
          },
        },
      },
      pruning: {
        type: "boolean",
      },
      output: {
        type: "object",
        additionalProperties: false,
        required: ["directory", "basename", "extension"],
        properties: {
          directory: {
            anyOf: [
              {
                const: null,
              },
              {
                $ref: "absolute-path",
              },
            ],
          },
          basename: {
            anyOf: [
              {
                const: null,
              },
              {
                $ref: "basename",
              },
            ],
          },
          extension: {
            $ref: "extension",
          },
        },
      },
      app: {
        type: "string",
        nullable: true,
      },
      name: {
        type: "string",
        nullable: true,
      },
      feature: {
        type: "string",
        nullable: true,
      },
      "feature-group": {
        type: "string",
        nullable: true,
      },
      labels: {
        type: "array",
        items: {
          type: "string",
        },
      },
      frameworks: {
        type: "array",
        items: {
          $ref: "name-version",
        },
      },
    },
  },
  {
    $id: "initialization",
    type: "object",
    additionalProperties: false,
    required: ["path", "data"],
    properties: {
      path: {
        anyOf: [
          {
            const: null,
          },
          {
            $ref: "absolute-path",
          },
        ],
      },
      data: {
        $ref: "config",
      },
    },
  },
  {
    $id: "termination",
    type: "object",
    additionalProperties: false,
    required: ["status", "errors"],
    properties: {
      status: {
        type: "integer",
        minimum: 0,
        maximum: 255,
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "message", "stack"],
          properties: {
            name: {
              type: "string",
            },
            message: {
              type: "string",
            },
            stack: {
              type: "string",
            },
          },
        },
      },
    },
  },
  {
    $id: "source",
    type: "object",
    additionalProperties: false,
    required: ["url", "content", "shallow", "inline", "exclude"],
    properties: {
      url: {
        $ref: "url",
      },
      content: {
        type: "string",
      },
      shallow: {
        type: "boolean",
      },
      inline: {
        type: "boolean",
      },
      exclude: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  },
  {
    $id: "message",
    anyOf: [
      {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: [
          {
            const: "initialize",
          },
          {
            $ref: "configuration",
          },
        ],
      },
      {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: [
          {
            const: "terminate",
          },
          {
            $ref: "termination",
          },
        ],
      },
      {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: [
          {
            const: "start",
          },
          {
            type: "string",
          },
          {
            $ref: "initialization",
          },
        ],
      },
      {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: [
          {
            const: "stop",
          },
          {
            type: "string",
          },
          {
            $ref: "termination",
          },
        ],
      },
      {
        type: "array",
        minItems: 2,
        maxItems: 2,
        items: [
          {
            const: "source",
          },
          {
            $ref: "source",
          },
        ],
      },
      {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: [
          {
            const: "event",
          },
          {
            enum: ["begin", "end", "before", "after"],
          },
          {
            $ref: "index",
          },
          {
            type: "number",
          },
          {
            enum: ["bundle", "apply", "response", "jump", "request", "query"],
          },
          true,
        ],
      },
    ],
  },
  {
    $id: "source-map",
    type: "object",
    required: ["version", "sources", "names", "mappings"],
    properties: {
      version: {
        const: 3,
      },
      file: {
        type: "string",
        nullable: true,
      },
      sourceRoot: {
        type: "string",
        nullable: true,
      },
      sources: {
        type: "array",
        items: {
          type: "string",
        },
      },
      sourcesContent: {
        type: "array",
        nullable: true,
        items: {
          type: "string",
          nullable: true,
        },
      },
      names: {
        type: "array",
        items: {
          type: "string",
        },
      },
      mappings: {
        type: "string",
      },
    },
  },
];
