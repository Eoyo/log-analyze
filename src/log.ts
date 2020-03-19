#!/usr/bin/env node
import fs from "fs-extra";
import readline from "readline";
import path from "path";
import chalk from "chalk";
// @ts-ignore
import Nzh from "nzh";
import { LogRecord } from "./interface";
import { combineLogs } from "./methods/combine-logs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readLogFileData(file: string): Promise<LogRecord[]> {
  const data = await fs.readFile(file);
  const logs = data
    .toString()
    .split(path.basename(file).split(".")[0] || Date.now() + "");

  return logs
    .filter((one) => !!one)
    .map((one) => one.trim())
    .map((one) => {
      return {
        time: one.slice(0, 12),
        level: one.slice(13, 14),
        message: one.slice(15),
        isMark: false,
      };
    });
}

async function getFilesInDir(dir: string) {
  const d = await fs.readdir(dir);
  return d.map((one) => path.join(dir, one));
}

async function combineLogFiles(files: string[]) {
  console.log(
    "combine logs",
    files.map((file) => path.basename(file))
  );
  const fileStr = await Promise.all(files.map(readLogFileData));
  return fileStr.reduce((acc, b) => {
    return combineLogs(acc, b);
  });
}

async function readAllLogsFile() {
  return combineLogFiles(await getFilesInDir(path.join(process.cwd(), "logs")));
}

function createIgnoreStrMatch(str: string) {
  return new RegExp(str.replace("_", "[_ ]"), "i");
}

function allRegMatchStr(reg: RegExp[]): StrFilter {
  return Object.assign(
    (str: string) => {
      const testResult = !reg.some((oneReg) => {
        return !oneReg.test(str);
      });
      // console.log("testing", str, testResult);
      return testResult;
    },
    {
      hasReg: reg.length > 0,
    }
  );
}

function inputLine(inputHandler: (inputStr: string) => void) {
  console.log("\n请输入关键字搜索, 回车确定:");
  rl.on("line", (input) => {
    inputHandler(input);
  });
}

function logRecordStr(log: LogRecord): string {
  const message = `${log.time} ${log.level} ${log.message}`;
  if (log.isMark) {
    return `\n<<<\n${message}\n>>>\n`;
  } else {
    return message;
  }
}

async function writeLogsRecord(data: LogRecord[]) {
  const messages = data.map(logRecordStr);
  await fs.writeFile(
    path.join(process.cwd(), "output.log"),
    `结果: ${Nzh.cn.encodeS(messages.length)} 条日志\n` + messages.join("\n")
  );
  console.log(`结果: ${Nzh.cn.encodeS(messages.length)} 条日志`);
}

type SearchFilters<T = StrFilter> = {
  time: T;
  level: T;
  content: T;
  mark: T;
};

type StrFilter = { (str: string): boolean; hasReg: boolean };

function logFilters(originStr: string, filters: SearchFilters<string[]>) {
  console.log(chalk.blue("filters: "), chalk.green(originStr));
  const keys = Object.keys(filters);
  keys.forEach((oneKey) => {
    console.log(chalk.blueBright(oneKey) + "\t", (filters as any)[oneKey]);
  });
}

function stringArrayFilter(str?: string): string[] {
  if (str) {
    return str
      .split(" ")
      .map((one) => one.trim())
      .filter((one) => !!one);
  } else {
    return [];
  }
}

/**
 * 通过 字符串 构建搜索的过滤器
 */
function searchFilters(searchStr: string): SearchFilters<StrFilter> {
  const commandRegArray = searchStr.match(/`.*`/);
  const filters: SearchFilters<string[]> = {
    time: [],
    level: [],
    content: [],
    mark: [],
  };
  let commandStr = "";
  if (commandRegArray) {
    const t1 = commandRegArray[0];
    commandStr = t1;
    const t3 = t1.slice(1, -1).split(" ");
    t3.forEach((one) => {
      if (one) {
        if (one.match(/[0-9]/)) {
          filters.time.push(one);
        } else {
          filters.level.push(one);
        }
      }
    });
  }
  const t2 = commandStr ? searchStr.replace(commandStr, "") : searchStr;
  const [contentStr, markStr] = t2.split(">>>").map((one) => one.trim());
  const contentStrArray = stringArrayFilter(contentStr);
  const markStrArray = stringArrayFilter(markStr);
  if (contentStrArray) {
    filters.content = contentStrArray;
  }
  if (markStrArray) {
    filters.mark = markStrArray;
  }

  const { level, mark, time, content } = filters;
  logFilters(searchStr, filters);

  const [levelReg, markReg, timeReg, contentReg] = [level, mark, time, content]
    .map((one) => {
      return one.map(createIgnoreStrMatch);
    })
    .map(allRegMatchStr);

  const filtersReg = {
    level: levelReg,
    time: timeReg,
    mark: markReg,
    content: contentReg,
  };
  return filtersReg;
}

function filterLogsRecord(
  data: LogRecord[],
  filters: SearchFilters
): LogRecord[] {
  let d = data;

  if (filters.level.hasReg) {
    d = d.filter((one) => filters.level(one.level));
  }

  if (filters.content.hasReg) {
    d = d.filter((one) => filters.content(one.message));
  }
  if (filters.time.hasReg) {
    d = d.filter((one) => filters.time(one.time));
  }

  if (filters.mark.hasReg) {
    d.forEach((one) => {
      one.isMark = filters.mark(one.message);
    });
  }
  return d;
}

async function start() {
  const data = await readAllLogsFile();
  console.log("文件解析完成");
  inputLine((inputStr) => {
    const filters = searchFilters(inputStr);
    writeLogsRecord(filterLogsRecord(data, filters));
  });
}

start();
