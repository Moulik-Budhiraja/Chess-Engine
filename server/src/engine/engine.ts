import {
  ChildProcessWithoutNullStreams,
  spawn,
  spawnSync,
} from "child_process";
import fs from "fs";

interface Command {
  input: string;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
  output: string[];
}

export class Engine {
  private engine: ChildProcessWithoutNullStreams | null = null;
  private pendingCommands: Command[] = [];

  static defaultOutputPath = "../engine/engine";

  constructor() {
    this.loadEngine(Engine.defaultOutputPath);
  }

  loadEngine(outputPath: string) {
    if (this.engine) {
      this.engine.kill();
    }

    this.engine = spawn(outputPath, []);

    this.engine.stdout.on("data", (data) => {
      const output: string = data.toString().trim();
      console.log(`RECEIVED: "${output}"`);

      if (this.pendingCommands.length > 0) {
        // Get the current command
        const currentCommand = this.pendingCommands[0];
        currentCommand.output.push(output);

        // Check if the response is complete
        if (this.isResponseComplete(output, currentCommand.input)) {
          // Response is complete, resolve the Promise
          const command = this.pendingCommands.shift();
          if (command) {
            command.resolve(command.output.join("\n"));
          }
        }
      } else {
        console.warn("Received output but no pending commands");
      }
    });

    this.engine.stderr.on("data", (data) => {
      console.error(`Engine error: \n\n${data}\n\n`);
    });

    // Handle possible errors
    this.engine.on("error", (error) => {
      console.error("Engine error:", error);
      // Reject all pending commands
      while (this.pendingCommands.length > 0) {
        const command = this.pendingCommands.shift();
        if (command) {
          command.reject("Engine error");
        }
      }
    });

    // Handle engine exit
    this.engine.on("exit", (code, signal) => {
      console.log(`Engine exited with code ${code} and signal ${signal}`);
      // Reject all pending commands
      while (this.pendingCommands.length > 0) {
        const command = this.pendingCommands.shift();
        if (command) {
          command.reject("Engine exited");
        }
      }
    });
  }

  buildEngine(outputPath: string) {
    const buildCmd = spawnSync("g++", [
      "-o",
      outputPath,
      "../engine/main.cpp",
      "-O3",
    ]);

    if (buildCmd.error) {
      console.error(buildCmd.error);
    }

    if (buildCmd.status === 0) {
      console.log("Engine built successfully");
    } else {
      console.error(buildCmd.stderr.toString());
      throw new Error("Engine build failed");
    }
  }

  destroy() {
    if (this.engine) {
      this.engine.kill();
    }
  }

  reloadEngine(outputPath: string = Engine.defaultOutputPath) {
    if (this.engine) {
      this.engine.kill();
    }
    this.buildEngine(outputPath);
    this.loadEngine(outputPath);
  }

  isResponseComplete(output: string, input: string): boolean {
    return true; // Placeholder implementation
  }

  sendCommand(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.engine) {
        console.log(`SENDING: "${input}"`);
        const command: Command = {
          input,
          resolve,
          reject,
          output: [],
        };
        this.pendingCommands.push(command);
        this.engine.stdin.write(input + "\n");
      } else {
        reject("Engine not initialized");
      }
    });
  }

  // Example method using sendCommand
  async position(fen: string) {
    try {
      const output = await this.sendCommand(`position fen ${fen}`);
      console.log("Position output", output);
    } catch (error) {
      console.error("Error setting position:", error);
    }
  }

  async getMoves() {
    try {
      const output = await this.sendCommand("getmoves");
      return output;
    } catch (error) {
      console.error("Error getting moves:", error);
    }
  }

  async getBestMove(depth: number, engineTime: number) {
    try {
      const output = await this.sendCommand(
        `getbestmove ${depth} ${engineTime}`
      );
      return output;
    } catch (error) {
      console.error("Error getting moves:", error);
    }
  }

  async getGameWinner(): Promise<string> {
    try {
      const output = await this.sendCommand("getgamewinner");
      return output;
    } catch (error) {
      console.error("Error getting game winner:", error);
      return "none";
    }
  }

  listEngines(): string[] {
    const engines = fs
      .readdirSync("../engineVersions")
      .filter((file) => file.endsWith(".exe"));
    return engines;
  }
}
