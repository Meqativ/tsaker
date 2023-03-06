import path from "path";
import * as sjd from "simple-json-db";
import * as readline from "node:readline/promises";
import * as fs from "fs";
import * as os from "os";
const __dirname = path.dirname(import.meta.url);
if (!fs.existsSync(path.join(os.homedir(), ".tsaker")))
	await fs.promises.mkdir(path.join(os.homedir(), ".tsaker"));
const db = new sjd.default(path.join(os.homedir(), ".tsaker/data.json"));
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
String.prototype.rgb = function (
	{ fg = [255, 255, 255], bg = [0, 0, 0] } = {
		fg: [255, 255, 255],
		bg: [0, 0, 0],
	}
) {
	return `\u001b[48;2;${bg[0]};${bg[1]};${bg[2]}m\u001b[38;2;${fg[0]};${fg[1]};${fg[2]}m${this}\u001b[m`;
};
Array.prototype.swap = function (x, y) {
	const b = this[x];
	this[x] = this[y];
	this[y] = b;
	return this;
};

let tasks = db.get("tasks") ?? [];

if (process.argv[2]) {
	switch (process.argv[2]) {
		case "get_raw":
			console.log(JSON.stringify(tasks));
			break;
		case "show_tasks":
			showTasks(true);
			break;
	}
	process.exit(0);
}
function showTasks(first) {
	if (tasks.length <= 0)
		return console.log(
			`${"i".rgb({ fg: [100, 100, 100] })} # You've got no tasks${
				first ? `. Use the help command to see how to add tasks` : ""
			}`
		);
	const doneTasks = tasks.reduce((p, task) => p + (task.done === true), 0);
	console.log(
		doneTasks === tasks.length
			? `🎉 # You've completed all of your tasks! You can clear them by doing the clear command`
			: `${"i".rgb({ fg: [100, 100, 100] })} # You've got ${tasks.length} task${
					tasks.length === 1 ? "" : "s"
			  }, ${doneTasks} of which ${doneTasks === 1 ? "is" : "are"} completed`
	);

	let i = 0;
	for (let task of tasks) {
		i++;
		console.log(
			`${
				task.done
					? "~".rgb({ fg: [10, 200, 10] })
					: "•".rgb({ fg: [100, 100, 100] })
			} | ${i} | ${task.goal}`
		);
	}
}

function removeTaskJob(args) {
	let index = parseInt(args[1]);
	if (Number.isNaN(index))
		return console.log(
			`${"×".rgb({ fg: [200, 10, 10] })} | Invalid task index number`
		);
	index -= 1;
	const removedTask = tasks.splice(index, 1)[0];
	console.log(
		`${"✓".rgb({ fg: [10, 200, 10] })} | Removed task with goal: "${
			removedTask.goal
		}"`
	);
}
function toggleTaskJob(args) {
	let index = parseInt(args[1]);
	if (Number.isNaN(index))
		return console.log(
			`${"×".rgb({ fg: [200, 10, 10] })} | Invalid task index number`
		);
	index -= 1;
	tasks[index].done = !tasks[index].done;
	console.log(
		`${"✓".rgb({ fg: [10, 200, 10] })} | Toggled the task with goal: "${
			tasks[index].goal
		}", to ${tasks[index].done ? "completed" : "pending"}`
	);
}
function addTaskJob(args) {
	if (!args[1] && args[1] !== "")
		return console.log(`${"×".rgb({ fg: [200, 10, 10] })} | No goal specified`);
	tasks.push({ goal: args.slice(1, args.length).join(" "), done: false });
	console.log(`${"✓".rgb({ fg: [10, 200, 10] })} | Added`);
}
function moveTaskJob(args) {
	if (args.length === 1)
		return console.log(
			`${"×".rgb({
				fg: [200, 10, 10],
			})} | indexOne and indexTwo is not specified. See in the help command`
		);
	let iOne = parseInt(args[1]);
	if (Number.isNaN(iOne))
		return console.log(
			`${"×".rgb({ fg: [200, 10, 10] })} | Invalid indexOne number`
		);
	let iTwo = parseInt(args[2]);
	if (Number.isNaN(iTwo))
		return console.log(
			`${"×".rgb({ fg: [200, 10, 10] })} | Invalid indexTwo number`
		);
	iOne--;
	iTwo--;
	tasks.swap(iOne, iTwo);
	return console.log(
		`${"✓".rgb({ fg: [10, 200, 10] })} | Swapped tasks ${iOne + 1} & ${
			iTwo + 1
		}`
	);
}

let firstLaunch = true;
async function input(message) {
	const args = message.split(/ +/);
	switch (args[0]) {
		case "h":
		case "help":
			console.log(
				`List of commands:\n` +
					`	help               | shows this message\n` +
					`	list               | shows the list of your tasks\n` +
					`	add [goal...]      | adds a task to the tasks list\n` +
					`	remove [index]     | removes a task on the specified index\n` +
					`	move [ifrom] [ito] | swaps the indexes of tasks\n` +
					`	toggle [index]     | toggles a task on the specified index\n` +
					`	raw                | prints the raw object of your tasks\n` +
					`	clear              | clears all of your tasks\n` +
					`	save               | saves your tasks\n` +
					`	exit               | saves & exits the program`
			);
			break;
		case "ls":
		case "list":
			showTasks(firstLaunch);
			firstLaunch = false;
			break;
		case "mv":
		case "move":
			moveTaskJob(args);
			break;
		case "raw":
			console.log(tasks);
			break;
		case "empty":
		case "clear":
			const answer = await rl.question(
				'Are you sure? Type "bruh" to clear tasks: '
			);
			if (answer === "bruh") {
				tasks = [];
				console.log(`${"✓".rgb({ fg: [10, 200, 10] })} | Done`);
			}
			break;
		case "+":
		case "add":
			addTaskJob(args);
			break;
		case "-":
		case "remove":
			removeTaskJob(args);
			break;
		case ".":
		case "toggle":
			toggleTaskJob(args);
			break;
		case "s":
		case "save":
			db.set("tasks", tasks);
			console.log("• | Saved");
			break;
		case "x":
		case "leave":
		case "exit":
			console.log("• | Saving...");
			db.set("tasks", tasks);
			console.log("bai");
			process.exit();
		default:
			console.log(
				`${"i".rgb({
					fg: [100, 100, 100],
				})} | Unsupported command. Use the help command for a list of them`
			);
	}
	const answer = await rl.question("> ");
	input(answer);
}
input("list");
