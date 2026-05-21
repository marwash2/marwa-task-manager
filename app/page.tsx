"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface Task {
  _id?: string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate: string;
}

const priorityConfig: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  urgent: { color: "text-red-700", bgColor: "bg-red-100", label: "Urgent" },
  high: { color: "text-orange-700", bgColor: "bg-orange-100", label: "High" },
  medium: { color: "text-amber-700", bgColor: "bg-amber-100", label: "Medium" },
  low: { color: "text-green-700", bgColor: "bg-green-100", label: "Low" },
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTasks, setAiTasks] = useState<string[]>([]);

  const fetchTasks = async (): Promise<void> => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const deleteTask = async (id: string) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((task) => task._id !== id));

    try {
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      setTasks(previousTasks);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === id ? { ...task, completed: !completed } : task,
      ),
    );
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });
    } catch (error) {
      console.error("Error toggling task:", error);
      await fetchTasks();
    }
  };

  const addTask = async () => {
    if (!input.trim()) return;
    setIsLoading(true);

    const tempId = Date.now().toString();
    const optimisticTask: Task = {
      _id: tempId,
      title: input,
      completed: false,
      priority,
      dueDate,
    };

    setTasks((prev) => [optimisticTask, ...prev]);
    setInput("");

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: optimisticTask.title,
          priority,
          dueDate,
        }),
      });
      await fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
      setTasks((prev) => prev.filter((task) => task._id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const generateTasks = async () => {
    try {
      setAiTasks([]);
      const res = await fetch("/api/ai-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      setAiTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setAiPrompt("");
    } catch (error) {
      console.error("Error generating AI tasks:", error);
      setAiTasks([]);
    }
  };

  const addTaskFromAI = async (title: string) => {
    const tempId = Date.now().toString();
    const optimisticTask: Task = {
      _id: tempId,
      title,
      completed: false,
      priority: "medium",
      dueDate: new Date().toISOString(),
    };
    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          priority: "medium",
          dueDate: new Date().toISOString(),
        }),
      });
      setAiTasks((prev) => prev.filter((task) => task !== title));
      await fetchTasks();
    } catch (error) {
      console.error("Failed to add AI task", error);
      setTasks((prev) => prev.filter((task) => task._id !== tempId));
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter(
    (t) => !t.completed && new Date(t.dueDate) < new Date(),
  ).length;
  const urgentTasks = tasks.filter((t) => t.priority === "urgent").length;

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-100">
        <div className="text-center space-y-8 bg-white/80 backdrop-blur-xl border border-white/70 rounded-3xl shadow-2xl p-10 max-w-md">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tight text-indigo-900">
              TaskFlow
            </h1>
            <p className="text-lg text-indigo-500">
              AI driven task planning in a beautiful workspace
            </p>
          </div>

          <button
            onClick={() => signIn("github")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
          >
            Sign in with GitHub
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 text-slate-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_-5px_rgba(48,41,80,0.05)]">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <button
            onClick={() => setActiveView("dashboard")}
            className="p-2 hover:bg-indigo-50/50 rounded-lg"
          >
            <span className="material-symbols-outlined text-indigo-600">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                TaskFlow
              </h1>
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut()}
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <section className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Hi, {session.user?.name || "there"}
          </h2>
          <p className="text-gray-500 font-medium">
            You have {pendingTasks} pending tasks and {completedTasks}{" "}
            completed.
          </p>
        </section>

        {activeView === "dashboard" && (
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Total", value: totalTasks, icon: "task_alt" },
              {
                label: "Completed",
                value: completedTasks,
                icon: "check_circle",
              },
              { label: "Pending", value: pendingTasks, icon: "schedule" },
              { label: "Overdue", value: overdueTasks, icon: "error" },
              { label: "Urgent", value: urgentTasks, icon: "priority_high" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="material-symbols-outlined">{stat.icon}</span>
                  <span className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                    {stat.label}
                  </span>
                </div>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {stat.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {activeView === "ai" && (
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Generate Tasks with AI
              </h2>
              <p className="text-sm text-gray-500">
                Describe your goal and let AI suggest tasks
              </p>
            </div>
            <div className="flex gap-3 items-center bg-indigo-50 rounded-full p-2">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your task..."
                className="w-full bg-transparent border-none focus:outline-none text-slate-700"
              />
              <button
                onClick={generateTasks}
                className="bg-gradient-to-br cursor-pointer from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            {aiTasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {aiTasks.map((task, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                  >
                    <span className="text-slate-800">{task}</span>
                    <button
                      onClick={() => addTaskFromAI(task)}
                      className="text-xs cursor-pointer bg-indigo-600 text-white px-3 py-1 rounded-full"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === "tasks" && (
          <section className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end mb-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What needs to be done?"
                className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                onClick={addTask}
                disabled={isLoading}
                className={`px-4 py-3 rounded-lg font-semibold text-white transition ${isLoading ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"}`}
              >
                {isLoading ? "Adding…" : "+ Add Task"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {["all", "low", "medium", "high", "urgent"].map((level) => (
                <button
                  key={level}
                  onClick={() => setPriorityFilter(level)}
                  className={`px-3 py-1 rounded-full text-xs ${priorityFilter === level ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto">
              {tasks
                .filter((task) =>
                  priorityFilter === "all"
                    ? true
                    : task.priority === priorityFilter,
                )
                .sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() -
                    new Date(b.dueDate).getTime(),
                )
                .map((task) => {
                  const isOverdue =
                    !task.completed && new Date(task.dueDate) < new Date();
                  const pConfig =
                    priorityConfig[task.priority] || priorityConfig.low;

                  return (
                    <div
                      key={task._id}
                      className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${isOverdue ? "border-red-500" : task.completed ? "border-green-500" : "border-indigo-500"} flex justify-between gap-3`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task._id!, task.completed)}
                          className="mt-1 w-5 h-5 text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-3">
                            <p
                              className={`${task.completed ? "line-through text-gray-400" : "text-slate-900"} font-semibold`}
                            >
                              {task.title}
                            </p>
                            <span
                              className={`${pConfig.bgColor} ${pConfig.color} text-[10px] px-2 py-1 rounded-sm font-bold`}
                            >
                              {pConfig.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex gap-2">
                            <span>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <span className="text-red-600 font-semibold bg-red-100 px-1 rounded">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task._id!)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        )}
      </main>{" "}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-2 bg-white/70 backdrop-blur-2xl">
        {[
          { id: "dashboard", icon: "home" },
          { id: "tasks", icon: "Task" },
          { id: "ai", icon: "Assistant" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center justify-center text-xs font-bold tracking-widest ${activeView === item.id ? "text-indigo-700" : "text-slate-400"}`}
          >
            <div
              className={`${activeView === item.id ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white" : ""} p-3 rounded-full`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}
