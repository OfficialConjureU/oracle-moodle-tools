{
  "openapi": "3.1.0",
  "info": {
    "title": "Oracle Universal Relay",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://oracle-moodle-tools.onrender.com"
    }
  ],
  "paths": {
    "/oracle_command": {
      "post": {
        "summary": "Send universal Moodle command",
        "operationId": "oracleCommand",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "command": {
                    "type": "string",
                    "description": "Moodle WS function to call (e.g., core_user_create_users)"
                  }
                },
                "additionalProperties": true
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Operation successful"
          }
        }
      }
    }
  }
}
