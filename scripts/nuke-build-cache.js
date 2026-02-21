import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { resolve } from "path";

// Nuke both the project and build env .next caches
const dirs = [
  resolve("/vercel/share/v0-project/.next"),
  resolve("/vercel/share/v0-next-shadcn/.next"),
];

for (const dir of dirs) {
  if (existsSync(dir)) {
    console.log(`Deleting: ${dir}`);
    try {
      rmSync(dir, { recursive: true, force: true });
      console.log(`Deleted: ${dir}`);
    } catch (e) {
      console.log(`Failed to delete ${dir}: ${e.message}`);
      // Try with shell command as fallback
      try {
        execSync(`rm -rf "${dir}"`, { stdio: "inherit" });
        console.log(`Deleted via shell: ${dir}`);
      } catch (e2) {
        console.log(`Shell delete also failed: ${e2.message}`);
      }
    }
  } else {
    console.log(`Does not exist: ${dir}`);
  }
}

// Verify
for (const dir of dirs) {
  console.log(`${dir} exists after cleanup: ${existsSync(dir)}`);
}
