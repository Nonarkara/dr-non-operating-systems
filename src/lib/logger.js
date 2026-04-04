function write(level, event, fields = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function createLogger(scope) {
  return {
    debug(event, fields = {}) {
      write("debug", event, { scope, ...fields });
    },
    info(event, fields = {}) {
      write("info", event, { scope, ...fields });
    },
    warn(event, fields = {}) {
      write("warn", event, { scope, ...fields });
    },
    error(event, fields = {}) {
      write("error", event, { scope, ...fields });
    }
  };
}
