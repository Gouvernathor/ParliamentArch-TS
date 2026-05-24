import * as fs from "fs/promises";
import { getAnonymousArgvValues, getArgvValues } from "./argv.ts";

async function clean() {
    const filesToClean = getArgvValues("files", "f");
    const directoriesToClean = getArgvValues("directories", "d");
    const todo = [];
    if (filesToClean) {
        todo.push(...filesToClean.map(f => fs.rm(f, { force: true })));
    }
    if (directoriesToClean) {
        todo.push(...directoriesToClean.map(d => fs.rm(d, { recursive: true, force: true })));
    }
    await Promise.allSettled(todo);
}

await clean();
