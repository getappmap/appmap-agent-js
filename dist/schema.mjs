export const schema = [
  {
    "$id": "encoding",
    "enum": [
      "buffer",
      "utf8",
      "utf16le",
      "latin1"
    ]
  },
  {
    "$id": "log-level",
    "enum": [
      "debug",
      "info",
      "warning",
      "error",
      "off"
    ]
  },
  {
    "$id": "file-type",
    "enum": [
      "script",
      "module"
    ]
  },
  {
    "$id": "recorder",
    "enum": [
      "process",
      "mocha"
    ]
  },
  {
    "$id": "protocol",
    "enum": [
      "inline",
      "tcp",
      "http1",
      "http2"
    ]
  },
  {
    "$id": "serialization-method",
    "enum": [
      "toString",
      "Object.prototype.toString"
    ]
  },
  {
    "$id": "stdio-stream",
    "enum": [
      "ignore",
      "pipe",
      "inherit"
    ]
  },
  {
    "$id": "signal",
    "enum": [
      "SIGINT",
      "SIGTERM",
      "SIGKILL"
    ]
  },
  {
    "$id": "indent",
    "enum": [
      0,
      2,
      4,
      8
    ]
  },
  {
    "$id": "exclusion",
    "type": "string"
  },
  {
    "$id": "regular-identifier",
    "type": "string",
    "pattern": "^[a-zA-Z_$][a-zA-Z_$-9]*$"
  },
  {
    "$id": "path",
    "type": "string"
  },
  {
    "$id": "absolute-path",
    "type": "string",
    "pattern": "^/"
  },
  {
    "$id": "filename",
    "type": "string",
    "pattern": "^[^/]+$"
  },
  {
    "$id": "index",
    "type": "integer",
    "minimum": 0,
    "maximum": 9007199254740991
  },
  {
    "$id": "port-number",
    "type": "integer",
    "minimum": 0,
    "maximum": 65535
  },
  {
    "$id": "name-version-string",
    "type": "string",
    "pattern": "^[^@]+@[^@]+$"
  },
  {
    "$id": "name-version-object",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "version"
    ],
    "properties": {
      "name": {
        "type": "string"
      },
      "version": {
        "type": "string"
      }
    }
  },
  {
    "$id": "name-version",
    "anyOf": [
      {
        "$ref": "name-version-string"
      },
      {
        "$ref": "name-version-object"
      }
    ]
  },
  {
    "$id": "recording-string",
    "type": "string",
    "pattern": "^[^.]+.[^.]+$"
  },
  {
    "$id": "recording-object",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "defined-class",
      "method-id"
    ],
    "properties": {
      "defined-class": {
        "type": "string"
      },
      "method-id": {
        "type": "string"
      }
    }
  },
  {
    "$id": "recording",
    "anyOf": [
      {
        "$ref": "recording-string"
      },
      {
        "$ref": "recording-object"
      }
    ]
  },
  {
    "$id": "package",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "version",
      "homepage"
    ],
    "properties": {
      "name": {
        "type": "string"
      },
      "version": {
        "type": "string"
      },
      "homepage": {
        "type": "string",
        "nullable": true
      }
    }
  },
  {
    "$id": "exclude",
    "type": "array",
    "items": {
      "$ref": "exclusion"
    }
  },
  {
    "$id": "stdio",
    "anyOf": [
      {
        "$ref": "stdio-stream"
      },
      {
        "type": "array",
        "minItems": 3,
        "maxItems": 3,
        "items": [
          {
            "$ref": "stdio-stream"
          },
          {
            "$ref": "stdio-stream"
          },
          {
            "$ref": "stdio-stream"
          }
        ]
      }
    ]
  },
  {
    "$id": "env",
    "type": "object",
    "additionalProperties": false,
    "patternProperties": {
      "^": {
        "type": "string"
      }
    }
  },
  {
    "$id": "specifier",
    "anyOf": [
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "regexp"
        ],
        "properties": {
          "regexp": {
            "type": "string"
          },
          "flags": {
            "type": "string"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "glob"
        ],
        "properties": {
          "glob": {
            "type": "string"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "path"
        ],
        "properties": {
          "path": {
            "type": "string"
          },
          "recursive": {
            "type": "boolean"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "dist"
        ],
        "properties": {
          "dist": {
            "type": "string"
          },
          "recursive": {
            "type": "boolean"
          },
          "external": {
            "type": "boolean"
          },
          "enabled": {
            "type": "boolean"
          },
          "shallow": {
            "type": "boolean"
          },
          "exclude": {
            "$ref": "exclude"
          }
        }
      }
    ]
  },
  {
    "$id": "package-specifier",
    "anyOf": [
      {
        "type": "string"
      },
      {
        "$ref": "specifier"
      }
    ]
  },
  {
    "$id": "enabled-specifier",
    "anyOf": [
      {
        "type": "string"
      },
      {
        "allOf": [
          {
            "$ref": "specifier"
          },
          {
            "not": {
              "anyOf": [
                {
                  "type": "object",
                  "required": [
                    "shallow"
                  ]
                },
                {
                  "type": "object",
                  "required": [
                    "exclude"
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    "$id": "cooked-specifier",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "basedir",
      "source",
      "flags"
    ],
    "properties": {
      "basedir": {
        "$ref": "absolute-path"
      },
      "source": {
        "type": "string"
      },
      "flags": {
        "type": "string"
      }
    }
  },
  {
    "$id": "child-options",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "execPath": {
        "type": "string"
      },
      "execArgv": {
        "type": "string"
      },
      "encoding": {
        "$ref": "encoding"
      },
      "cwd": {
        "$ref": "path"
      },
      "env": {
        "$ref": "env"
      },
      "stdio": {
        "$ref": "stdio"
      },
      "timeout": {
        "type": "integer",
        "minimum": 0
      },
      "killSignal": {
        "$ref": "signal"
      }
    }
  },
  {
    "$id": "child",
    "anyOf": [
      {
        "type": "string"
      },
      {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "string"
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "exec"
        ],
        "properties": {
          "type": {
            "const": "spawn"
          },
          "configuration": {
            "$ref": "configuration"
          },
          "exec": {
            "type": "string"
          },
          "argv": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "options": {
            "allOf": [
              {
                "$ref": "child-options"
              },
              {
                "not": {
                  "anyOf": [
                    {
                      "type": "object",
                      "required": [
                        "execPath"
                      ]
                    },
                    {
                      "type": "object",
                      "required": [
                        "execArgv"
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "exec"
        ],
        "properties": {
          "type": {
            "const": "fork"
          },
          "configuration": {
            "$ref": "configuration"
          },
          "globbing": {
            "type": "boolean"
          },
          "exec": {
            "type": "string"
          },
          "argv": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "options": {
            "$ref": "child-options"
          }
        }
      }
    ]
  },
  {
    "$id": "cooked-child",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "fork",
      "exec",
      "argv",
      "configuration",
      "options"
    ],
    "properties": {
      "fork": {
        "type": "object",
        "nullable": true,
        "required": [
          "directory",
          "data"
        ],
        "additionalProperties": false,
        "properties": {
          "directory": {
            "$ref": "absolute-path"
          },
          "data": {
            "$ref": "configuration"
          }
        }
      },
      "exec": {
        "type": "string"
      },
      "argv": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "configuration": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "directory",
          "data"
        ],
        "properties": {
          "directory": {
            "$ref": "absolute-path"
          },
          "data": {
            "$ref": "configuration"
          }
        }
      },
      "options": {
        "allOf": [
          {
            "$ref": "child-options"
          },
          {
            "type": "object",
            "required": [
              "encoding",
              "cwd",
              "env",
              "stdio",
              "timeout",
              "killSignal"
            ],
            "maxProperties": 6,
            "properties": {
              "cwd": {
                "$ref": "absolute-path"
              }
            }
          }
        ]
      }
    }
  },
  {
    "$id": "configuration",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "validate": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "message": {
            "type": "boolean"
          },
          "appmap": {
            "type": "boolean"
          }
        }
      },
      "protocol": {
        "$ref": "protocol"
      },
      "log-level": {
        "$ref": "log-level"
      },
      "host": {
        "const": "localhost"
      },
      "port": {
        "anyOf": [
          {
            "$ref": "path"
          },
          {
            "$ref": "port-number"
          }
        ]
      },
      "scenario": {
        "type": "string"
      },
      "scenarios": {
        "type": "object",
        "additionalProperties": false,
        "patternProperties": {
          "^": {
            "anyOf": [
              {
                "type": "array",
                "items": {
                  "$ref": "child"
                }
              },
              {
                "$ref": "child"
              }
            ]
          }
        }
      },
      "recorder": {
        "$ref": "recorder"
      },
      "source": {
        "type": "boolean"
      },
      "hooks": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "cjs": {
            "type": "boolean"
          },
          "esm": {
            "type": "boolean"
          },
          "group": {
            "type": "boolean"
          },
          "apply": {
            "type": "boolean"
          },
          "http": {
            "type": "boolean"
          },
          "mysql": {
            "type": "boolean"
          },
          "pg": {
            "type": "boolean"
          },
          "sqlite3": {
            "type": "boolean"
          }
        }
      },
      "enabled": {
        "anyOf": [
          {
            "type": "boolean"
          },
          {
            "type": "array",
            "items": {
              "$ref": "enabled-specifier"
            }
          }
        ]
      },
      "hidden-identifier": {
        "$ref": "regular-identifier"
      },
      "main": {
        "$ref": "path"
      },
      "engine": {
        "$ref": "name-version"
      },
      "language": {
        "$ref": "name-version"
      },
      "packages": {
        "type": "array",
        "items": {
          "$ref": "package-specifier"
        }
      },
      "exclude": {
        "$ref": "exclude"
      },
      "function-name-placeholder": {
        "type": "string"
      },
      "recording": {
        "$ref": "recording"
      },
      "serialization": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "maximum-length": {
            "type": "integer",
            "minimum": 0,
            "nullable": true
          },
          "include-constructor-name": {
            "type": "boolean"
          },
          "method": {
            "$ref": "serialization-method"
          }
        }
      },
      "pruning": {
        "type": "boolean"
      },
      "output": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "object",
            "additionalProperties": false,
            "minProperties": 1,
            "properties": {
              "directory": {
                "type": "string"
              },
              "filename": {
                "$ref": "filename"
              },
              "postfix": {
                "$ref": "filename"
              },
              "indent": {
                "$ref": "indent"
              }
            }
          }
        ]
      },
      "app": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "feature": {
        "type": "string"
      },
      "feature-group": {
        "type": "string"
      },
      "labels": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "frameworks": {
        "type": "array",
        "items": {
          "$ref": "name-version"
        }
      }
    }
  },
  {
    "$id": "cooked-configuration",
    "type": "object",
    "additionalProperties": false,
    "minProperties": 30,
    "properties": {
      "validate": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "message",
          "appmap"
        ],
        "properties": {
          "message": {
            "type": "boolean"
          },
          "appmap": {
            "type": "boolean"
          }
        }
      },
      "repository": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "directory",
          "history",
          "package"
        ],
        "properties": {
          "directory": {
            "$ref": "absolute-path"
          },
          "history": {
            "type": "object",
            "nullable": true
          },
          "package": {
            "anyOf": [
              {
                "const": null
              },
              {
                "$ref": "package"
              }
            ]
          }
        }
      },
      "agent": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "directory",
          "package"
        ],
        "properties": {
          "directory": {
            "$ref": "absolute-path"
          },
          "package": {
            "$ref": "package"
          }
        }
      },
      "scenario": {
        "type": "string"
      },
      "scenarios": {
        "type": "object",
        "additionalProperties": false,
        "patternProperties": {
          "^": {
            "type": "array",
            "items": {
              "$ref": "cooked-child"
            }
          }
        }
      },
      "protocol": {
        "$ref": "protocol"
      },
      "log-level": {
        "$ref": "log-level"
      },
      "host": {
        "const": "localhost"
      },
      "port": {
        "anyOf": [
          {
            "$ref": "absolute-path"
          },
          {
            "$ref": "port-number"
          }
        ]
      },
      "recorder": {
        "$ref": "recorder"
      },
      "source": {
        "type": "boolean"
      },
      "hooks": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "cjs",
          "esm",
          "apply",
          "http",
          "mysql",
          "pg",
          "sqlite3"
        ],
        "properties": {
          "cjs": {
            "type": "boolean"
          },
          "esm": {
            "type": "boolean"
          },
          "group": {
            "type": "boolean"
          },
          "apply": {
            "type": "boolean"
          },
          "http": {
            "type": "boolean"
          },
          "mysql": {
            "type": "boolean"
          },
          "pg": {
            "type": "boolean"
          },
          "sqlite3": {
            "type": "boolean"
          }
        }
      },
      "enabled": {
        "type": "array",
        "items": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": [
            {
              "$ref": "cooked-specifier"
            },
            {
              "type": "boolean"
            }
          ]
        }
      },
      "hidden-identifier": {
        "$ref": "regular-identifier"
      },
      "main": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "absolute-path"
          }
        ]
      },
      "engine": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "name-version-object"
          }
        ]
      },
      "language": {
        "$ref": "name-version-object"
      },
      "packages": {
        "type": "array",
        "items": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": [
            {
              "$ref": "cooked-specifier"
            },
            {
              "type": "object",
              "properties": {
                "enabled": {
                  "type": "boolean"
                },
                "shallow": {
                  "type": "boolean"
                },
                "source": {
                  "type": "boolean",
                  "nullable": true
                },
                "exclude": {
                  "$ref": "exclude"
                }
              }
            }
          ]
        }
      },
      "exclude": {
        "$ref": "exclude"
      },
      "function-name-placeholder": {
        "type": "string"
      },
      "recording": {
        "anyOf": [
          {
            "const": null
          },
          {
            "$ref": "recording-object"
          }
        ]
      },
      "serialization": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "maximum-length",
          "include-constructor-name",
          "method"
        ],
        "properties": {
          "maximum-length": {
            "type": "integer",
            "minimum": 0,
            "nullable": true
          },
          "include-constructor-name": {
            "type": "boolean"
          },
          "method": {
            "$ref": "serialization-method"
          }
        }
      },
      "pruning": {
        "type": "boolean"
      },
      "output": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "directory",
          "filename",
          "postfix",
          "indent"
        ],
        "properties": {
          "directory": {
            "$ref": "absolute-path"
          },
          "filename": {
            "anyOf": [
              {
                "const": null
              },
              {
                "$ref": "filename"
              }
            ]
          },
          "postfix": {
            "$ref": "filename"
          },
          "indent": {
            "$ref": "indent"
          }
        }
      },
      "app": {
        "type": "string",
        "nullable": true
      },
      "name": {
        "type": "string",
        "nullable": true
      },
      "feature": {
        "type": "string",
        "nullable": true
      },
      "feature-group": {
        "type": "string",
        "nullable": true
      },
      "labels": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "frameworks": {
        "type": "array",
        "items": {
          "$ref": "name-version"
        }
      }
    }
  },
  {
    "$id": "message",
    "anyOf": [
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "data"
        ],
        "properties": {
          "type": {
            "const": "initialize"
          },
          "data": {
            "$ref": "cooked-configuration"
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "data"
        ],
        "properties": {
          "type": {
            "const": "terminate"
          },
          "data": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "status",
              "errors"
            ],
            "properties": {
              "status": {
                "type": "integer",
                "minimum": 0,
                "maximum": 255
              },
              "errors": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "name",
                    "message",
                    "stack"
                  ],
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "message": {
                      "type": "string"
                    },
                    "stack": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "type",
          "data"
        ],
        "properties": {
          "type": {
            "const": "trace"
          },
          "data": {
            "anyOf": [
              {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "type",
                  "data"
                ],
                "properties": {
                  "type": {
                    "const": "group"
                  },
                  "data": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                      "group",
                      "origin",
                      "description"
                    ],
                    "properties": {
                      "group": {
                        "$ref": "index"
                      },
                      "origin": {
                        "$ref": "index"
                      },
                      "description": {
                        "type": "string"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "type",
                  "data"
                ],
                "properties": {
                  "type": {
                    "const": "file"
                  },
                  "data": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                      "index",
                      "exclude",
                      "type",
                      "path",
                      "code"
                    ],
                    "properties": {
                      "index": {
                        "$ref": "index"
                      },
                      "exclude": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      "type": {
                        "$ref": "file-type"
                      },
                      "path": {
                        "$ref": "absolute-path"
                      },
                      "code": {
                        "type": "string"
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "type",
                  "data"
                ],
                "properties": {
                  "type": {
                    "const": "track"
                  },
                  "data": {
                    "anyOf": [
                      {
                        "type": "object",
                        "additionalProperties": false,
                        "required": [
                          "type",
                          "index",
                          "options"
                        ],
                        "properties": {
                          "type": {
                            "const": "start"
                          },
                          "index": {
                            "$ref": "index"
                          },
                          "options": {
                            "type": "object",
                            "nullable": true,
                            "additionalProperties": false,
                            "properties": {
                              "main": {
                                "$ref": "absolute-path"
                              },
                              "name": {
                                "type": "string"
                              },
                              "filename": {
                                "$ref": "filename"
                              },
                              "recording": {
                                "$ref": "recording"
                              }
                            }
                          }
                        }
                      },
                      {
                        "type": "object",
                        "additionalProperties": false,
                        "required": [
                          "type",
                          "index"
                        ],
                        "properties": {
                          "type": {
                            "enum": [
                              "stop",
                              "pause",
                              "play"
                            ]
                          },
                          "index": {
                            "$ref": "index"
                          }
                        }
                      }
                    ]
                  }
                }
              },
              {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "type",
                  "data"
                ],
                "properties": {
                  "type": {
                    "const": "event"
                  },
                  "data": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                      "type",
                      "time",
                      "group",
                      "index",
                      "data"
                    ],
                    "properties": {
                      "type": {
                        "enum": [
                          "before",
                          "after"
                        ]
                      },
                      "time": {
                        "type": "number"
                      },
                      "group": {
                        "$ref": "index"
                      },
                      "index": {
                        "$ref": "index"
                      },
                      "data": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      }
    ]
  }
];