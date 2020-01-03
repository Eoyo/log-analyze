import fs from "fs-extra";
import readline from "readline";
import path from "path";
// @ts-ignore
import Nzh from "nzh";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function readLogFileData(file: string) {
  const data = await fs.readFile(file);
  return data
    .toString()
    .split(path.basename(file).split(".")[0] || Date.now() + "");
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
    return acc.concat(b);
  });
}

async function readAllLogsFile() {
  return combineLogFiles(await getFilesInDir("./logs"));
}

function createIgnoreStrMatch(str: string) {
  return new RegExp(str, "i");
}

function allRegMatchStr(reg: RegExp[]) {
  return (str: string) => {
    const testResult = !reg.some((oneReg) => {
      return !oneReg.test(str);
    });
    // console.log("testing", str, testResult);
    return testResult;
  };
}

function searchKeywordsInData(data: string[]) {
  return function searchKeywords(props: string[]) {
    console.log("searching... ", props);
    const reg = props.map(createIgnoreStrMatch);
    console.log("use regexp:", reg);
    const result = data
      .filter(allRegMatchStr(reg))
      .map((one) => one.trim())
      .filter((one) => !!one);
    // console.log("search result", result);
    return result;
  };
}

function handleSearchingWith(
  searchKeywords: (inputData: string[]) => string[]
) {
  console.log("\n请输入关键字搜索, 回车确定:");
  rl.on("line", (input) => {
    const inputData = input.split(" ").filter((one) => !!one);
    const result = searchKeywords(inputData);
    fs.writeFile(
      "./output.log",
      `结果: ${Nzh.cn.encodeS(result.length)} 条日志\n` + result.join("\n")
    ).then(() => {
      console.log(`结果: ${Nzh.cn.encodeS(result.length)} 条日志`);
    });
  });
}

async function start() {
  const data = await readAllLogsFile();
  console.log("文件解析完成");
  handleSearchingWith(searchKeywordsInData(data));
}

start();
